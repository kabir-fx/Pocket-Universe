import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "../../../../lib/nextAuth/auth";
import { ensureGalaxyByName } from "../../galaxy.ensure";
import { randomUUID, createHash } from "crypto";
import { supabaseAdmin } from "../../../../lib/supabase/supabaseAdmin";
import prisma from "@repo/db/prisma";

const BUCKET = "user-images"
const MAX_IMG_SIZE = 6 * 1024 * 1024; // ~6MB
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png']);

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = session.user.id;

    // Basic env sanity check
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return NextResponse.json({ error: "Server misconfiguration", message: "Supabase env vars are missing" }, { status: 500 });
    }

    const contentTypeHeader = req.headers.get("content-type") || "";

    try {
        // Ensure the session user exists to avoid FK issues after DB resets
        const dbUser = await prisma.user.findUnique({ where: { id: session.user.id } });
        if (!dbUser) {
            return NextResponse.json({ error: "Session invalid. Please sign in again." }, { status: 401 });
        }

        let galaxyName = "";
        let buffer: Buffer | null = null;
        let contentType = "";

        if (contentTypeHeader.includes("multipart/form-data")) {
            const form = await req.formData();
            const file = form.get("file");
            galaxyName = String(form.get("galaxy") || "").trim();
            if (!file || !(file instanceof File)) {
                return NextResponse.json({ error: "No file" }, { status: 400 });
            }
            if (!galaxyName) return NextResponse.json({ error: "Missing galaxy" }, { status: 400 });
            const ab = await file.arrayBuffer();
            buffer = Buffer.from(ab);
            contentType = file.type || "";
        } else {
            const { img, galaxy } = await req.json();
            if (!img) return NextResponse.json({ error: "No img"}, { status: 400 });
            if (!galaxy || typeof galaxy !== "string" || !galaxy.trim()) {
                return NextResponse.json({ error: "Missing galaxy" }, { status: 400 });
            }
            galaxyName = galaxy.trim();
            const decoded = await decodeImage(img);
            buffer = decoded.buffer;
            contentType = decoded.contentType;
        }

        const galaxyRes = await ensureGalaxyByName(session.user.id, galaxyName);
        if (!galaxyRes) return NextResponse.json({ error: "Failed to create/get new folder for img"}, { status: 403 });

        // Normalize common CDN content types (e.g., image/jpg)
        const normalizedCT = contentType === "image/jpg" ? "image/jpeg" : contentType;
        if (!ALLOWED_MIME.has(normalizedCT)) return NextResponse.json({ error: "invalid img type"}, { status: 415 });
        if (buffer.length > MAX_IMG_SIZE) return NextResponse.json({ error: "img size too large" }, { status: 413 });

        const id = randomUUID();
        const ext = getExtFromContentType(normalizedCT);
        const objectKey = buildObjectKey({ userId, galaxyName: galaxyRes.name, fileId: id, ext });

        const uploadRes = await supabaseAdmin
            .storage
            .from(BUCKET)
            .upload(objectKey, buffer, { contentType: normalizedCT, cacheControl: "3600", upsert: false });

        if (uploadRes.error) {
            return NextResponse.json({ error: "Failed to upload image", message: uploadRes.error.message }, { status: 500 });
        }

        const checksumSha256 = createHash("sha256").update(buffer).digest("hex");

        // Ensure Prisma Image model is available
        const anyPrisma: any = prisma as any;
        const availableModels = Object.keys(anyPrisma).filter((k) => typeof anyPrisma[k] === "object" && anyPrisma[k]?.findMany);
        console.log("[imgStorage] Available Prisma models:", availableModels);
        
        if (!anyPrisma?.image?.create) {
            return NextResponse.json(
                {
                    error: "Image model not available",
                    message:
                        `Prisma model 'Image' is not generated. Available models: ${availableModels.join(", ")}. Try: rm -rf apps/web/.next && restart dev server`,
                },
                { status: 500 },
            );
        }

        const imageRow = await anyPrisma.image.create({
            data: {
                userId,
                bucket: BUCKET,
                objectKey,
                contentType,
                sizeBytes: BigInt(buffer.length),
                checksumSha256,
                isPublic: false,
                galaxies: { connect: { id: galaxyRes.id } },
            },
        });

        const signed = await supabaseAdmin
            .storage
            .from(BUCKET)
            .createSignedUrl(objectKey, 60 * 60);

        const signedUrl = signed.data?.signedUrl ?? null;

        return NextResponse.json({
            id: imageRow.id,
            bucket: BUCKET,
            objectKey,
            contentType: normalizedCT,
            sizeBytes: buffer.length,
            checksumSha256,
            galaxyId: galaxyRes.id,
            signedUrl,
        }, { status: 200 });
    } catch (err: any) {
        return NextResponse.json({ error: "Unexpected error", message: err?.message ?? String(err) }, { status: 500 });
    }
}

async function decodeImage(img: any): Promise<{ buffer: Buffer; contentType: string }> {
    // Accept { base64, contentType } or { dataUrl } or { url }
    let contentType = typeof img?.contentType === "string" ? img.contentType : "";
    if (typeof img?.base64 === "string" && img.base64) {
        const buffer = Buffer.from(img.base64, "base64");
        return { buffer, contentType };
    }
    if (typeof img?.dataUrl === "string" && img.dataUrl.startsWith("data:")) {
        const match = img.dataUrl.match(/^data:(.*?);base64,(.*)$/);
        if (!match) throw new Error("Invalid dataUrl");
        const [, ct, b64] = match;
        const buffer = Buffer.from(b64, "base64");
        return { buffer, contentType: contentType || ct };
    }
    if (typeof img?.url === "string") {
        try {
            const url = new URL(img.url);
            const res = await fetch(url.toString(), {
                method: "GET",
                redirect: "follow",
                headers: {
                    // Request original quality image where CDNs support content negotiation
                    "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
                    "Accept-Language": "en-US,en;q=0.9",
                    // Spoof a common browser UA to avoid servers returning low-res placeholders
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
                    // Some CDNs gate assets behind origin/referrer checks
                    "Referer": `${url.origin}/`,
                },
                cache: "no-store",
            });
            if (!res.ok) throw new Error(`Failed to fetch image (${res.status})`);
            const ct = res.headers.get("content-type") || contentType || "";
            const ab = await res.arrayBuffer();
            const buffer = Buffer.from(ab);
            return { buffer, contentType: ct };
        } catch (e: any) {
            throw new Error(e?.message || "Failed to fetch image URL");
        }
    }
    throw new Error("Missing image payload: expected base64, dataUrl, or url");
}

function getExtFromContentType(contentType: string): string {
    switch (contentType) {
        case "image/jpeg": return "jpg";
        case "image/png": return "png";
        default: return "bin";
    }
}

function buildObjectKey({ userId, galaxyName, fileId, ext }: { userId: string; galaxyName: string; fileId: string; ext: string }): string {
    const safeGalaxy = slugify(galaxyName);
    return `${userId}/${safeGalaxy}/${fileId}.${ext}`;
}

function slugify(input: string): string {
    return String(input)
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
}