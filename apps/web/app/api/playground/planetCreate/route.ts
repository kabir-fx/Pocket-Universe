import { categorizeContent } from "@repo/ai";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/nextAuth/auth";
import prisma from "@repo/db/prisma";
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import { getUserCorrections } from "../../user.corrections";

const BodySchema = z.object({
  type: z.string("text"),
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
    const userCorrections = await getUserCorrections(userId);

    let aiResponse: {
      suggestedFolder: string;
      confidence?: number;
      reasoning?: string;
      alternatives?: string[];
    } | null = null;

    let textContent: string | null = null;
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

    const planet = await prisma.planet.create({
            data: {
              content: textContent!,
              userId,
              galaxies: { connect: { id: folder.id } },
            },
          });

    // Persist AI review row with fallbacks
    let reviewId: string | undefined = undefined;
    let aiCategorizationSaved = false;
    try {
      const normalized = textContent!.replace(/\s+/g, " ").slice(0, 500);

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
          console.warn(
            "[AI] Failed to persist AICategorization (all attempts):",
            err.message,
          );
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
