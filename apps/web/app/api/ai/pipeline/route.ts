import { categorizeContent, categorizeImage, bufferToBase64 } from "@repo/ai";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/nextAuth/auth";
import prisma from "@repo/db/prisma";
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";

const BodySchema = z.object({
  type: z.enum(["text", "image"]).optional(),
  data: z.any().optional(),
  content: z.string().min(3).max(50_000).optional(),
});

export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Ensure the session user actually exists in DB (after prisma reset, old cookies may remain)
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
    });
    if (!dbUser) {
      return NextResponse.json(
        { error: "Session invalid. Please sign in again." },
        { status: 401 },
      );
    }

    const parse = BodySchema.safeParse(await req.json());
    if (!parse.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const userId = session.user.id;
    const body = parse.data;
    const isLegacyText =
      typeof body.content === "string" && (!body.type || body.type === "text");
    const reqType = (body.type ?? (isLegacyText ? "text" : undefined)) as
      | "text"
      | "image"
      | undefined;
    if (!reqType) {
      return NextResponse.json(
        { error: "Missing type for request" },
        { status: 400 },
      );
    }

    // Get user's existing galaxies for context
    const userFolders = await prisma.galaxy.findMany({
      where: { userId },
      select: { name: true },
      take: 100,
    });

    // Collect recent user corrections (suggested vs accepted) to guide the model
    let userCorrections:
      | Array<{
          originalContent: string;
          suggestedFolder: string;
          acceptedFolder: string;
        }>
      | undefined = undefined;
    try {
      const anyPrisma: any = prisma as any;
      const normalize = (s: string) =>
        s.trim().replace(/\s+/g, " ").slice(0, 500);

      if (anyPrisma?.aICategorization?.findMany) {
        const rows = await anyPrisma.aICategorization.findMany({
          where: { userId, acceptedFolder: { not: null } },
          orderBy: { createdAt: "desc" },
          take: 50,
          select: {
            contentPreview: true,
            suggestedFolder: true,
            acceptedFolder: true,
          },
        });
        const mapped = (rows as Array<any>)
          .filter(
            (r) =>
              typeof r?.contentPreview === "string" &&
              typeof r?.suggestedFolder === "string" &&
              typeof r?.acceptedFolder === "string",
          )
          // Only include actual user overrides (accepted differs from suggested)
          .filter((r) => r.acceptedFolder !== r.suggestedFolder)
          .map((r) => ({
            originalContent: normalize(r.contentPreview as string),
            suggestedFolder: r.suggestedFolder as string,
            acceptedFolder: r.acceptedFolder as string,
          }));
        if (mapped.length > 0) userCorrections = mapped;
      } else if (typeof (prisma as any).$queryRawUnsafe === "function") {
        const rows: Array<{
          contentPreview: string | null;
          suggestedFolder: string | null;
          acceptedFolder: string | null;
        }> = await (prisma as any).$queryRawUnsafe(
          `select "contentPreview", "suggestedFolder", "acceptedFolder" from "AICategorization" where "userId" = $1 and "acceptedFolder" is not null order by "createdAt" desc limit 50`,
          userId,
        );
        const mapped = rows
          .filter(
            (r) =>
              typeof r?.contentPreview === "string" &&
              typeof r?.suggestedFolder === "string" &&
              typeof r?.acceptedFolder === "string",
          )
          .filter((r) => r.acceptedFolder !== r.suggestedFolder)
          .map((r) => ({
            originalContent: normalize(r.contentPreview as string),
            suggestedFolder: r.suggestedFolder as string,
            acceptedFolder: r.acceptedFolder as string,
          }));
        if (mapped.length > 0) userCorrections = mapped;
      }
    } catch {
      // Silently ignore if table is missing or query fails
    }

    let aiResponse: {
      suggestedFolder: string;
      confidence?: number;
      reasoning?: string;
      alternatives?: string[];
    } | null = null;

    let textContent: string | null = null;
    if (reqType === "text") {
      const raw = isLegacyText
        ? (body.content as string)
        : typeof body.data?.content === "string"
          ? (body.data.content as string)
          : "";
      const contentTrimmed = raw.trim().slice(0, 4000);
      if (!contentTrimmed)
        return NextResponse.json(
          { error: "Missing text content" },
          { status: 400 },
        );
      textContent = contentTrimmed;
      aiResponse = await categorizeContent({
        content: contentTrimmed,
        userId,
        existingFolders: userFolders.map((f) => f.name),
        userCorrections: userCorrections,
      });
    } else {
      const img = body.data;
      let buf: Buffer | null = null;
      let mime: string = "";
      if (typeof img?.dataUrl === "string" && img.dataUrl.startsWith("data:")) {
        const match = img.dataUrl.match(/^data:(.*?);base64,(.*)$/);
        if (!match)
          return NextResponse.json(
            { error: "Invalid dataUrl" },
            { status: 400 },
          );
        const [, ct, b64] = match;
        mime = img.mimeType || ct;
        buf = Buffer.from(b64, "base64");
      } else if (typeof img?.base64 === "string" && img.base64) {
        mime = img.mimeType || img.contentType || "";
        buf = Buffer.from(img.base64, "base64");
      } else if (typeof img?.url === "string" && img.url) {
        try {
          const u = new URL(img.url);
          const resFetch = await fetch(u.toString(), {
            method: "GET",
            cache: "no-store",
          });
          if (!resFetch.ok)
            return NextResponse.json(
              { error: `Failed to fetch image URL (${resFetch.status})` },
              { status: 400 },
            );
          const ab = await resFetch.arrayBuffer();
          buf = Buffer.from(ab);
          mime =
            resFetch.headers.get("content-type") ||
            img.mimeType ||
            img.contentType ||
            "";
        } catch (e: any) {
          return NextResponse.json(
            { error: e?.message || "Failed to fetch image URL" },
            { status: 400 },
          );
        }
      } else {
        return NextResponse.json(
          { error: "Missing image payload: expected base64, dataUrl, or url" },
          { status: 400 },
        );
      }

      if (!mime)
        return NextResponse.json(
          { error: "Unknown image mimeType" },
          { status: 415 },
        );
      const allowed = new Set(["image/jpeg", "image/png", "image/webp"]);
      const normalized = mime === "image/jpg" ? "image/jpeg" : mime;
      if (!allowed.has(normalized))
        return NextResponse.json(
          { error: "Unsupported image type" },
          { status: 415 },
        );

      const imageBase64 = bufferToBase64(buf as Buffer);
      aiResponse = await categorizeImage({
        imageBase64,
        mimeType: normalized,
        userId,
        existingFolders: userFolders.map((f) => f.name),
        userCorrections: userCorrections,
        filename: typeof img?.filename === "string" ? img.filename : undefined,
      });
    }

    // Validate AI response
    if (!aiResponse || !aiResponse.suggestedFolder) {
      return NextResponse.json(
        { error: "AI did not return a folder" },
        { status: 502 },
      );
    }

    // Find or create target folder
    let folder = await prisma.galaxy.findFirst({
      where: { userId, name: aiResponse!.suggestedFolder },
    });
    if (!folder) {
      try {
        folder = await prisma.galaxy.create({
          data: {
            userId: userId,
            name: aiResponse!.suggestedFolder,
            shareable: false,
          },
        });
      } catch (e: any) {
        // Handle unique constraint race: re-query existing
        const code = e?.code || e?.meta?.code;
        if (code === "P2002") {
          const f2 = await prisma.galaxy.findFirst({
            where: { userId, name: aiResponse!.suggestedFolder },
          });
          folder = f2 ?? folder;
        } else {
          throw e;
        }
      }
    }
    if (!folder) {
      throw new Error("Folder resolution failed");
    }

    const planet =
      reqType === "text"
        ? await prisma.planet.create({
            data: {
              content: textContent!,
              userId,
              galaxies: { connect: { id: folder.id } },
            },
          })
        : null;

    // Persist AI review row with fallbacks
    let reviewId: string | undefined = undefined;
    let aiCategorizationSaved = false;
    try {
      const normalized =
        reqType === "text"
          ? textContent!.replace(/\s+/g, " ").slice(0, 500)
          : `[image] ${new Date().toISOString()}`;
      const review = await (prisma as any).aICategorization.create({
        data: {
          id: randomUUID(),
          userId,
          ...(planet?.id ? { planetId: planet.id } : {}),
          folderId: folder.id,
          contentPreview: normalized,
          suggestedFolder: aiResponse!.suggestedFolder,
          acceptedFolder: aiResponse!.suggestedFolder,
          confidence: aiResponse?.confidence ?? 0,
          reasoning: aiResponse?.reasoning ?? "",
          alternatives: aiResponse?.alternatives ?? [],
          createdAt: new Date(),
        },
      });
      reviewId = review?.id;
      aiCategorizationSaved = Boolean(reviewId);
      if (process.env.NODE_ENV !== "production") {
        console.log("[AI] AICategorization created id=", reviewId);
      }
    } catch (err: any) {
      try {
        const normalized =
          reqType === "text"
            ? textContent!.replace(/\s+/g, " ").slice(0, 500)
            : `[image] ${new Date().toISOString()}`;
        const review = await (prisma as any).aICategorization.create({
          data: {
            id: randomUUID(),
            userId,
            contentPreview: normalized,
            suggestedFolder: aiResponse!.suggestedFolder,
            acceptedFolder: aiResponse!.suggestedFolder,
            createdAt: new Date(),
            folderId: folder.id,
          },
        });
        reviewId = review?.id;
        aiCategorizationSaved = Boolean(reviewId);
        console.warn(
          "[AI] AICategorization created with minimal Prisma fields due to error:",
          err?.message ?? err,
        );
      } catch (err2: any) {
        try {
          const normalized =
            reqType === "text"
              ? textContent!.replace(/\s+/g, " ").slice(0, 500)
              : `[image] ${new Date().toISOString()}`;
          const id = randomUUID();
          const cols: Array<{
            column_name: string;
            is_nullable: string;
            data_type: string;
          }> = await (prisma as any).$queryRawUnsafe(
            "select column_name, is_nullable, data_type from information_schema.columns where table_schema='public' and table_name='AICategorization'",
          );

          const colNames: string[] = [];
          const values: any[] = [];
          const placeholders: string[] = [];
          let param = 1;

          function addParamCol(name: string, value: any) {
            colNames.push(`"${name}"`);
            placeholders.push(`$${param++}`);
            values.push(value);
          }
          function addLiteralCol(name: string, literal: string) {
            colNames.push(`"${name}"`);
            placeholders.push(literal);
          }
          const present = (name: string) =>
            cols.some((c) => c.column_name === name);
          const get = (name: string) =>
            cols.find((c) => c.column_name === name);

          if (present("id")) addParamCol("id", id);
          if (present("userId")) addParamCol("userId", userId);
          if (present("planetId") && planet && planet.id)
            addParamCol("planetId", planet.id);
          if (present("folderId")) addParamCol("folderId", folder.id);
          if (present("contentPreview"))
            addParamCol("contentPreview", normalized);
          if (present("suggestedFolder"))
            addParamCol("suggestedFolder", aiResponse!.suggestedFolder);
          if (present("acceptedFolder"))
            addParamCol("acceptedFolder", aiResponse!.suggestedFolder);
          if (present("confidence"))
            addParamCol("confidence", aiResponse?.confidence ?? 0);
          if (present("reasoning"))
            addParamCol("reasoning", aiResponse?.reasoning ?? "");
          if (present("alternatives")) {
            const dt = get("alternatives")?.data_type ?? "";
            const alts = Array.isArray(aiResponse?.alternatives)
              ? (aiResponse.alternatives as string[]).filter(
                  (x) => typeof x === "string",
                )
              : [];
            if (dt.includes("ARRAY")) {
              if (alts.length === 0) {
                addLiteralCol("alternatives", "'{}'::text[]");
              } else {
                // Build ARRAY[$1,$2,...]::text[] using parameterized values to avoid injection
                colNames.push('"alternatives"');
                const arrPlaceholders: string[] = [];
                for (const alt of alts) {
                  arrPlaceholders.push(`$${param++}`);
                  values.push(alt);
                }
                placeholders.push(
                  `ARRAY[${arrPlaceholders.join(", ")}]::text[]`,
                );
              }
            } else {
              addParamCol("alternatives", JSON.stringify(alts));
            }
          }
          if (present("createdAt")) addLiteralCol("createdAt", "NOW()");

          for (const c of cols) {
            if (colNames.includes(`"${c.column_name}"`)) continue;
            if (c.is_nullable === "YES") continue;
            switch (c.data_type) {
              case "boolean":
                addLiteralCol(c.column_name, "false");
                break;
              case "integer":
              case "bigint":
              case "numeric":
              case "real":
              case "double precision":
                addLiteralCol(c.column_name, "0");
                break;
              case "ARRAY":
                addLiteralCol(c.column_name, "'{}'");
                break;
              case "timestamp without time zone":
              case "timestamp with time zone":
                addLiteralCol(c.column_name, "NOW()");
                break;
              default:
                addParamCol(c.column_name, "");
            }
          }

          const sql = `insert into "AICategorization" (${colNames.join(", ")}) values (${placeholders.join(", ")})`;
          const result = await (prisma as any).$executeRawUnsafe(
            sql,
            ...values,
          );
          aiCategorizationSaved = result > 0;
          console.warn(
            "[AI] AICategorization inserted via dynamic raw SQL; columns=",
            colNames.join(","),
            "affected rows=",
            result,
          );
        } catch (err3: any) {
          console.warn(
            "[AI] Failed to persist AICategorization (all attempts):",
            err3?.message ?? err3,
          );
        }
      }
    }

    return NextResponse.json(
      {
        folderId: folder.id,
        folderName: folder.name,
        planetId: planet ? planet.id : undefined,
        reviewId,
        suggestedFolder: aiResponse!.suggestedFolder,
        confidence: aiResponse?.confidence ?? 0,
        aiCategorizationSaved,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("AI categorization error:", error);
    const message = (error as Error).message ?? "Unknown error";
    return NextResponse.json(
      {
        error: "Failed to categorize content",
        message,
      },
      { status: 500 },
    );
  }
}
