// apps/web/app/api/playground/pdfStorage/route.ts
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "../../../../lib/nextAuth/auth";
import { supabaseAdmin } from "../../../../lib/supabase/supabaseAdmin";
import prisma from "@repo/db/prisma";
import { categorizePdf } from "@repo/ai"; // new
import { ensureGalaxyByName } from "../../galaxy.ensure";
import { randomUUID, createHash } from "crypto";
import { getUserCorrections } from "../../user.corrections";
import { enforceAiLimit } from "../../../../lib/AiLimitHandler/auth";

const BUCKET = process.env.BUCKET!;
const MAX_PDF_SIZE = Number(process.env.MAX_PDF_SIZE ?? 20 * 1024 * 1024); // 20MB
const ALLOWED_MIME = new Set(["application/pdf"]);

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    return NextResponse.json(
      { error: "Server misconfiguration" },
      { status: 500 },
    );
  }

  let buffer: Buffer;
  let contentType = "";
  let galaxyName = "";
  let filename = "document.pdf";

  if ((req.headers.get("content-type") || "").includes("multipart/form-data")) {
    const form = await req.formData();
    const file = form.get("file");
    galaxyName = String(form.get("galaxy") || "").trim();
    if (!file || !(file instanceof File))
      return NextResponse.json({ error: "No file" }, { status: 400 });
    const ab = await file.arrayBuffer();
    buffer = Buffer.from(ab);
    contentType = file.type || "";
    filename = (file as any).name || filename;
  } else {
    const body = await req.json().catch(() => ({}));
    galaxyName = (body?.galaxy || "").toString().trim();
    const pdf = body?.pdf;
    if (!pdf) return NextResponse.json({ error: "No pdf" }, { status: 400 });
    // decode from { dataUrl } or { url }
    const decoded = await decodePdf(pdf);
    buffer = decoded.buffer;
    contentType = decoded.contentType;
    filename = decoded.filename || filename;
  }

  if (!ALLOWED_MIME.has(contentType))
    return NextResponse.json({ error: "invalid pdf type" }, { status: 415 });
  if (buffer.length > MAX_PDF_SIZE)
    return NextResponse.json({ error: "pdf too large" }, { status: 413 });

  // Resolve folder (AI if absent)
  let galaxyRes: { id: string; name: string } | null = null;
  if (galaxyName) {
    galaxyRes = (await ensureGalaxyByName(session.user.id, galaxyName)) as any;
  }

  // If not provided, AI path will be used; if rate limit exceeded, keep unassigned
  let aiBlocked = false;
  if (!galaxyRes) {
    const gate = await enforceAiLimit(session.user.id);
    if (!gate.allowed) {
      aiBlocked = true;
    }
  }

  let aiResult: {
    suggestedFolder: string;
    confidence?: number;
    reasoning?: string;
    alternatives?: string[];
  } | null = null;
  let aiUsed = false;
  if (!galaxyRes && !aiBlocked) {
    try {
      const userFolders = await prisma.galaxy.findMany({
        where: { userId: session.user.id },
        select: { name: true },
        take: 100,
      });
      const userCorrections = await getUserCorrections(session.user.id);
      aiResult = await categorizePdf({
        bytes: buffer,
        filename,
        userId: session.user.id,
        existingFolders: userFolders.map((f) => f.name),
        userCorrections,
      });
      aiUsed = true;
      const minConf = Number(process.env.DOC_AI_MIN_CONFIDENCE ?? 0.55);
      const target =
        typeof aiResult?.confidence === "number" &&
        aiResult.confidence >= minConf
          ? aiResult.suggestedFolder
          : "miscellaneous";
      galaxyRes = (await ensureGalaxyByName(session.user.id, target)) as any;
    } catch {
      galaxyRes = null;
    }
  }

  const id = randomUUID();
  const objectKey = buildObjectKey({
    userId: session.user.id,
    galaxyName: galaxyRes?.name || "orphaned",
    fileId: id,
    ext: "pdf",
  });

  const checksumSha256 = createHash("sha256").update(buffer).digest("hex");

  const upload = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(objectKey, buffer, {
      contentType,
      cacheControl: "3600",
      upsert: false,
    });
  if (upload.error)
    return NextResponse.json({ error: upload.error.message }, { status: 500 });

  const docRow = await prisma.document.create({
    data: {
      id,
      userId: session.user.id,
      bucket: BUCKET,
      objectKey,
      contentType,
      sizeBytes: BigInt(buffer.length),
      checksumSha256,
      ...(galaxyRes ? { galaxies: { connect: { id: galaxyRes.id } } } : {}),
    },
    select: { id: true },
  });

  // Audit AI suggestion only if AI was used
  try {
    if (!aiUsed) {
      throw new Error("skip-audit");
    }
    const folder =
      galaxyRes ?? (await ensureGalaxyByName(session.user.id, "orphaned"));
    await (prisma as any).aICategorization.create({
      data: {
        id: randomUUID(),
        userId: session.user.id,
        folderId: folder?.id,
        contentPreview: `[pdf] ${objectKey}`,
        suggestedFolder:
          aiResult?.suggestedFolder ?? (folder?.name || "orphaned"),
        acceptedFolder: folder?.name || "orphaned",
        confidence: aiResult?.confidence ?? 0,
        reasoning: aiResult?.reasoning ?? "",
        alternatives: Array.isArray(aiResult?.alternatives)
          ? (aiResult!.alternatives as string[])
          : [],
        createdAt: new Date(),
      },
    });
  } catch {}

  const signed = await supabaseAdmin.storage
    .from(BUCKET)
    .createSignedUrl(objectKey, 60 * 60);
  return NextResponse.json({
    id: docRow.id,
    bucket: BUCKET,
    objectKey,
    contentType,
    sizeBytes: buffer.length,
    checksumSha256,
    galaxyId: galaxyRes?.id ?? null,
    signedUrl: signed.data?.signedUrl ?? null,
  });
}

function buildObjectKey({
  userId,
  galaxyName,
  fileId,
  ext,
}: {
  userId: string;
  galaxyName: string;
  fileId: string;
  ext: string;
}) {
  const slug = String(galaxyName)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
  return `${userId}/${slug}/${fileId}.${ext}`;
}

async function decodePdf(
  pdf: any,
): Promise<{ buffer: Buffer; contentType: string; filename?: string }> {
  // Accept { dataUrl } or { url }
  if (pdf?.dataUrl?.startsWith("data:application/pdf;base64,")) {
    const b64 = pdf.dataUrl.split(",")[1];
    return {
      buffer: Buffer.from(b64, "base64"),
      contentType: "application/pdf",
      filename: pdf?.filename,
    };
  }
  if (pdf?.url) {
    const r = await fetch(pdf.url);
    const ab = await r.arrayBuffer();
    const ct = r.headers.get("content-type") || "application/pdf";
    return {
      buffer: Buffer.from(ab),
      contentType: ct,
      filename: pdf?.filename || new URL(pdf.url).pathname.split("/").pop(),
    };
  }
  throw new Error("Unsupported pdf input");
}
