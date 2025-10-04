import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "../../../lib/nextAuth/auth";
import { getServerSession } from "next-auth";
import prisma from "@repo/db/prisma";
import { supabaseAdmin } from "../../../lib/supabase/supabaseAdmin";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized " }, { status: 401 });
  }

  // Fetch all galaxies with their planets
  const galaxies = await prisma.galaxy.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      images: {
        select: {
          id: true,
          bucket: true,
          objectKey: true,
          contentType: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 12,
      },
      planets: {
        select: {
          id: true,
          content: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      },
      _count: { select: { planets: true } },
    },
  });

  // Fetch planets that don't belong to any galaxy
  const orphanedPlanets = await prisma.planet.findMany({
    where: {
      userId: session.user.id,
      galaxies: {
        none: {}, // Planets with no associated galaxies
      },
    },
    select: {
      id: true,
      content: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // Fetch images that don't belong to any galaxy (orphaned images)
  const orphanedImages = await prisma.image.findMany({
    where: {
      userId: session.user.id,
      galaxies: {
        none: {},
      },
    },
    select: {
      id: true,
      bucket: true,
      objectKey: true,
      contentType: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // Try to enrich planets with AI reasoning and alternatives using planetId link first, fallback to content match
  let planetIdToReason: Record<string, string> = {};
  let contentToReason: Record<string, string> = {};
  let planetIdToAlternatives: Record<string, string[]> = {};
  let contentToAlternatives: Record<string, string[]> = {};
  // For images, map objectKey => reasoning/alternatives when available
  const imageKeyToReason: Record<string, string> = {};
  const imageKeyToAlternatives: Record<string, string[]> = {};
  const normalize = (s: string) => s.trim().replace(/\s+/g, " ").slice(0, 500);
  try {
    const anyPrisma: any = prisma as any;
    if (anyPrisma?.aICategorization?.findMany) {
      // Pull recent categorizations with planetId
      const rows = await anyPrisma.aICategorization.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        take: 200,
        select: {
          planetId: true,
          contentPreview: true,
          reasoning: true,
          alternatives: true,
          suggestedFolder: true,
        },
      });

      const previewPairs = rows
        .filter(
          (r: any) =>
            typeof r?.contentPreview === "string" &&
            typeof r?.reasoning === "string",
        )
        .map((r: any) => ({
          key: normalize(r.contentPreview as string),
          value: r.reasoning as string,
        }));

      const previewAltPairs = rows
        .filter(
          (r: any) =>
            typeof r?.contentPreview === "string" &&
            Array.isArray(r?.alternatives),
        )
        .map((r: any) => ({
          key: normalize(r.contentPreview as string),
          value: (r.alternatives as string[]).filter(
            (x) => typeof x === "string",
          ),
        }));

      for (const r of rows) {
        if (r?.planetId && typeof r.reasoning === "string") {
          planetIdToReason[r.planetId as string] = r.reasoning as string;
        }
        if (r?.planetId && Array.isArray(r?.alternatives)) {
          planetIdToAlternatives[r.planetId as string] = (
            r.alternatives as string[]
          ).filter((x) => typeof x === "string");
        }
        // Image enrichment: expect contentPreview like "[image] <objectKey>"
        if (
          typeof r?.contentPreview === "string" &&
          r.contentPreview.startsWith("[image] ")
        ) {
          const key = r.contentPreview.slice("[image] ".length).trim();
          if (key) {
            if (typeof r?.reasoning === "string")
              imageKeyToReason[key] = r.reasoning as string;
            if (Array.isArray(r?.alternatives))
              imageKeyToAlternatives[key] = (r.alternatives as string[]).filter(
                (x) => typeof x === "string",
              );
          }
        }
      }

      function findReasonFor(content: string): string | undefined {
        const key = normalize(content);
        // Exact match first
        const exact = previewPairs.find((p: any) => p.key === key);
        if (exact) return exact.value;
        // Prefix/contains fallback (handles minor edits)
        const contains = previewPairs.find(
          (p: any) => key.startsWith(p.key) || p.key.startsWith(key),
        );
        return contains?.value;
      }

      function findAlternativesFor(content: string): string[] | undefined {
        const key = normalize(content);
        const exact = previewAltPairs.find((p: any) => p.key === key);
        if (exact) return exact.value;
        const contains = previewAltPairs.find(
          (p: any) => key.startsWith(p.key) || p.key.startsWith(key),
        );
        return contains?.value;
      }

      // Build map for quick lookups
      for (const g of galaxies) {
        for (const p of g.planets) {
          const r = planetIdToReason[p.id] ?? findReasonFor(p.content);
          const a =
            planetIdToAlternatives[p.id] ?? findAlternativesFor(p.content);
          if (r) contentToReason[normalize(p.content)] = r;
          if (a && a.length) contentToAlternatives[normalize(p.content)] = a;
        }
      }
      for (const p of orphanedPlanets) {
        const r = planetIdToReason[p.id] ?? findReasonFor(p.content);
        const a =
          planetIdToAlternatives[p.id] ?? findAlternativesFor(p.content);
        if (r) contentToReason[normalize(p.content)] = r;
        if (a && a.length) contentToAlternatives[normalize(p.content)] = a;
      }
    }
    // Fallback when Prisma client lacks AICategorization model: query via raw SQL
    else if (typeof (prisma as any).$queryRawUnsafe === "function") {
      const rows: Array<{
        planetId: string | null;
        contentPreview: string | null;
        reasoning: string | null;
        alternatives: string[] | null;
        userId: string;
      }> = await (prisma as any).$queryRawUnsafe(
        `select "planetId", "contentPreview", "reasoning", "alternatives", "userId" from "AICategorization" where "userId" = $1 order by "createdAt" desc limit 500`,
        session.user.id,
      );

      const previewPairs = rows
        .filter(
          (r) =>
            typeof r?.contentPreview === "string" &&
            typeof r?.reasoning === "string",
        )
        .map((r) => ({
          key: normalize(r.contentPreview as string),
          value: r.reasoning as string,
        }));

      const previewAltPairs = rows
        .filter(
          (r) =>
            typeof r?.contentPreview === "string" &&
            Array.isArray(r?.alternatives),
        )
        .map((r) => ({
          key: normalize(r.contentPreview as string),
          value: (r.alternatives as string[]).filter(
            (x) => typeof x === "string",
          ),
        }));

      for (const r of rows) {
        if (r?.planetId && typeof r.reasoning === "string") {
          planetIdToReason[r.planetId as string] = r.reasoning as string;
        }
        if (r?.planetId && Array.isArray(r?.alternatives)) {
          planetIdToAlternatives[r.planetId as string] = (
            r.alternatives as string[]
          ).filter((x) => typeof x === "string");
        }
        if (
          typeof r?.contentPreview === "string" &&
          r.contentPreview.startsWith("[image] ")
        ) {
          const key = r.contentPreview.slice("[image] ".length).trim();
          if (key) {
            if (typeof r?.reasoning === "string")
              imageKeyToReason[key] = r.reasoning as string;
            if (Array.isArray(r?.alternatives))
              imageKeyToAlternatives[key] = (r.alternatives as string[]).filter(
                (x) => typeof x === "string",
              );
          }
        }
      }

      function findReasonFor(content: string): string | undefined {
        const key = normalize(content);
        const exact = previewPairs.find((p: any) => p.key === key);
        if (exact) return exact.value;
        const contains = previewPairs.find(
          (p: any) => key.startsWith(p.key) || p.key.startsWith(key),
        );
        return contains?.value;
      }

      function findAlternativesFor(content: string): string[] | undefined {
        const key = normalize(content);
        const exact = previewAltPairs.find((p: any) => p.key === key);
        if (exact) return exact.value;
        const contains = previewAltPairs.find(
          (p: any) => key.startsWith(p.key) || p.key.startsWith(key),
        );
        return contains?.value;
      }

      for (const g of galaxies) {
        for (const p of g.planets) {
          const r = planetIdToReason[p.id] ?? findReasonFor(p.content);
          const a =
            planetIdToAlternatives[p.id] ?? findAlternativesFor(p.content);
          if (r) contentToReason[normalize(p.content)] = r;
          if (a && a.length) contentToAlternatives[normalize(p.content)] = a;
        }
      }
      for (const p of orphanedPlanets) {
        const r = planetIdToReason[p.id] ?? findReasonFor(p.content);
        const a =
          planetIdToAlternatives[p.id] ?? findAlternativesFor(p.content);
        if (r) contentToReason[normalize(p.content)] = r;
        if (a && a.length) contentToAlternatives[normalize(p.content)] = a;
      }
    }
  } catch {
    // If the table or client isn't available, skip enrichment silently
  }

  // Add signed URLs to images and enrich planets
  const enrichedGalaxies = await Promise.all(
    galaxies.map(async (g) => {
      const signedImages = await Promise.all(
        (g.images || []).map(async (img: any) => {
          try {
            const res = await supabaseAdmin.storage
              .from(img.bucket)
              .createSignedUrl(img.objectKey, 60 * 60);
            return {
              ...img,
              signedUrl: res.data?.signedUrl || null,
              reasoning: imageKeyToReason[img.objectKey] ?? null,
              alternatives: imageKeyToAlternatives[img.objectKey] ?? [],
            };
          } catch {
            return {
              ...img,
              signedUrl: null,
              reasoning: null,
              alternatives: [],
            };
          }
        }),
      );
      return {
        ...g,
        images: signedImages,
        planets: g.planets.map((p) => ({
          ...p,
          reasoning:
            planetIdToReason[p.id] ??
            contentToReason[normalize(p.content)] ??
            null,
          alternatives:
            planetIdToAlternatives[p.id] ??
            contentToAlternatives[normalize(p.content)] ??
            [],
        })),
      };
    }),
  );
  const enrichedOrphaned = orphanedPlanets.map((p) => ({
    ...p,
    reasoning:
      planetIdToReason[p.id] ?? contentToReason[normalize(p.content)] ?? null,
    alternatives:
      planetIdToAlternatives[p.id] ??
      contentToAlternatives[normalize(p.content)] ??
      [],
  }));

  // Sign orphaned images
  const orphanedSignedImages = await Promise.all(
    orphanedImages.map(async (img: any) => {
      try {
        const res = await supabaseAdmin.storage
          .from(img.bucket)
          .createSignedUrl(img.objectKey, 60 * 60);
        return {
          ...img,
          signedUrl: res.data?.signedUrl || null,
          reasoning: imageKeyToReason[img.objectKey] ?? null,
          alternatives: imageKeyToAlternatives[img.objectKey] ?? [],
        };
      } catch {
        return { ...img, signedUrl: null, reasoning: null, alternatives: [] };
      }
    }),
  );

  // Always show virtual galaxy for adding new folder names
  const result: any[] = [...enrichedGalaxies];

  // ALWAYS add virtual galaxy to allow creating new folders
  result.push({
    id: "orphaned-planets", // Virtual ID
    name: "Orphaned Planets",
    images: orphanedSignedImages,
    planets: enrichedOrphaned.length > 0 ? enrichedOrphaned : [],
    _count: { planets: enrichedOrphaned.length },
    isVirtual: true,
  });

  return NextResponse.json(result);
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { type, id } = await req.json();

  // Validate required fields
  if (!type || !id) {
    return NextResponse.json(
      { error: "Type and ID are required" },
      { status: 400 },
    );
  }

  if (type === "planet") {
    const res = await prisma.planet.delete({
      where: {
        userId: session.user.id,
        id: id,
      },
    });

    if (!res) {
      return NextResponse.json(
        { error: "Planet not found or already deleted" },
        { status: 404 },
      );
    }

    return NextResponse.json(res);
  } else if (type === "folder") {
    // Check if this is the default "Orphaned Planets" folder (virtual folder)
    if (id === "orphaned-planets") {
      return NextResponse.json(
        { error: "Can't delete default folder" },
        { status: 400 },
      );
    }

    // Use transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // First, find all planets in this galaxy
      const planetsInGalaxy = await tx.planet.findMany({
        where: {
          userId: session.user.id,
          galaxies: {
            some: { id: id },
          },
        },
        select: { id: true },
      });

      // Disconnect each planet from the galaxy individually
      for (const planet of planetsInGalaxy) {
        await tx.planet.update({
          where: { id: planet.id },
          data: {
            galaxies: {
              disconnect: { id: id },
            },
          },
        });
      }

      // Then delete the galaxy
      const res = await tx.galaxy.deleteMany({
        where: {
          userId: session.user.id,
          id: id,
        },
      });

      return res;
    });

    if (result.count === 0) {
      return NextResponse.json(
        { error: "Folder not found or already deleted" },
        { status: 404 },
      );
    }

    return NextResponse.json(result);
  } else if (type === "image") {
    // Look up image first to get storage path and verify ownership
    const img = await prisma.image.findFirst({
      where: { id, userId: session.user.id },
      select: { id: true, bucket: true, objectKey: true },
    });

    if (!img) {
      return NextResponse.json(
        { error: "Image not found or already deleted" },
        { status: 404 },
      );
    }

    // Attempt to remove from Supabase storage (best-effort)
    try {
      const { error } = await supabaseAdmin.storage
        .from(img.bucket)
        .remove([img.objectKey]);
      if (error) {
        console.warn(
          "[storage] remove failed",
          img.bucket,
          img.objectKey,
          error.message,
        );
      }
    } catch (e: any) {
      console.warn("[storage] exception during remove", e?.message || e);
    }

    // Remove DB row
    try {
      await prisma.image.delete({ where: { id: img.id } });
    } catch (e: any) {
      return NextResponse.json(
        { error: "Failed to delete image row" },
        { status: 500 },
      );
    }
  } else {
    return NextResponse.json(
      { error: "Invalid type. Must be 'planet' or 'folder'" },
      { status: 400 },
    );
  }

  // After deletions, remove any folders that became empty
  await prisma.galaxy.deleteMany({
    where: {
      userId: session.user.id,
      planets: { none: {} },
      images: { none: {} },
    },
  });

  return NextResponse.json({ ok: true });
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { type, id, updatedData } = await req.json();

  // Validate required fields
  if (!type || !id) {
    return NextResponse.json(
      { error: "ID or Type is missing" },
      { status: 400 },
    );
  }

  if (
    !updatedData ||
    typeof updatedData !== "string" ||
    updatedData.trim() === ""
  ) {
    return NextResponse.json(
      { error: "Updated data must be a non-empty string" },
      { status: 400 },
    );
  }

  try {
    if (type === "planet") {
      const res = await prisma.planet.update({
        where: {
          userId: session.user.id,
          id: id,
        },
        data: {
          content: updatedData.trim(),
        },
      });

      return NextResponse.json(res);
    } else if (type === "folder") {
      // Check if this is the default "Orphaned Planets" folder (virtual folder with ID "orphaned-planets")
      if (id === "orphaned-planets") {
        return NextResponse.json(
          { error: "Can't update default folder" },
          { status: 400 },
        );
      }

      const res = await prisma.galaxy.update({
        where: {
          userId: session.user.id,
          id: id,
        },
        data: {
          name: updatedData.trim(),
        },
      });

      return NextResponse.json(res);
    } else {
      return NextResponse.json(
        { error: "Invalid type. Must be 'planet' or 'galaxy'" },
        { status: 400 },
      );
    }
  } catch (error) {
    // Handle Prisma errors (e.g., record not found)
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2025"
    ) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }
    console.error("Update error:", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const action = body?.action;
    if (action !== "attachPlanetToFolder" && action !== "attachImageToFolder") {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const planetId: string | undefined = body?.planetId;
    const imageId: string | undefined = body?.imageId;
    const rawFolderName: string | undefined = body?.folderName;
    const folderName = (rawFolderName ?? "").toString().trim().slice(0, 80);

    if (action === "attachPlanetToFolder") {
      if (!planetId || !folderName) {
        return NextResponse.json(
          { error: "planetId and folderName are required" },
          { status: 400 },
        );
      }
    } else if (action === "attachImageToFolder") {
      if (!imageId || !folderName) {
        return NextResponse.json(
          { error: "imageId and folderName are required" },
          { status: 400 },
        );
      }
    }

    if (action === "attachPlanetToFolder") {
      // Verify planet belongs to user
      const planet = await prisma.planet.findFirst({
        where: { id: planetId, userId: session.user.id },
        select: { id: true },
      });
      if (!planet) {
        return NextResponse.json(
          { error: "Planet not found" },
          { status: 404 },
        );
      }
    }

    // Find or create the folder for this user
    let folder = await prisma.galaxy.findFirst({
      where: { userId: session.user.id, name: folderName },
      select: { id: true },
    });
    if (!folder) {
      try {
        folder = await prisma.galaxy.create({
          data: { userId: session.user.id, name: folderName, shareable: false },
          select: { id: true },
        });
      } catch (e: any) {
        if (e?.code === "P2002") {
          folder = await prisma.galaxy.findFirst({
            where: { userId: session.user.id, name: folderName },
            select: { id: true },
          });
        } else {
          throw e;
        }
      }
    }
    if (!folder) {
      return NextResponse.json(
        { error: "Folder resolution failed" },
        { status: 500 },
      );
    }

    if (action === "attachPlanetToFolder") {
      // Move planet: disconnect from all existing folders for this user, then connect to the selected folder
      await prisma.$transaction(async (tx) => {
        const existing = await tx.galaxy.findMany({
          where: {
            userId: session.user.id,
            planets: { some: { id: planetId } },
          },
          select: { id: true },
        });

        if (existing.length > 0) {
          await tx.planet.update({
            where: { id: planetId },
            data: {
              galaxies: {
                disconnect: existing.map((g) => ({ id: g.id })),
              },
            },
          });
        }

        // Now connect to the target folder (idempotent-ish; if already present, it's fine)
        await tx.planet.update({
          where: { id: planetId },
          data: { galaxies: { connect: { id: folder.id } } },
        });

        // Update acceptedFolder in AI categorization records for this planet
        try {
          const updateResult = await tx.$executeRawUnsafe(
            `UPDATE "AICategorization" SET "acceptedFolder" = $1 WHERE "planetId" = $2 AND "userId" = $3`,
            folderName,
            planetId,
            session.user.id,
          );
          console.log(
            `[AI] Updated ${updateResult} AICategorization record(s) for planet ${planetId} to acceptedFolder="${folderName}"`,
          );
        } catch (aiUpdateError: any) {
          console.warn(
            "Could not update AICategorization.acceptedFolder:",
            aiUpdateError?.message,
          );
        }

        // Auto-delete any folders that became empty (excluding the target folder)
        const candidateIds = existing
          .map((g) => g.id)
          .filter((id) => id !== folder!.id);
        if (candidateIds.length > 0) {
          const deletedCount = await tx.galaxy.deleteMany({
            where: {
              userId: session.user.id,
              id: { in: candidateIds },
              planets: { none: {} },
            },
          });
          if (deletedCount.count > 0) {
            console.log(
              `[Cleanup] Auto-deleted ${deletedCount.count} empty folder(s)`,
            );
          }
        }
      });

      return NextResponse.json({ ok: true, folderId: folder.id, moved: true });
    }

    // attachImageToFolder
    // Verify image and compute new storage key
    const image = await prisma.image.findFirst({
      where: { id: imageId!, userId: session.user.id },
      select: { id: true, bucket: true, objectKey: true },
    });
    if (!image) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    function slugify(input: string): string {
      return String(input)
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
    }
    const fileName = image.objectKey.split("/").pop() || image.objectKey;
    const newKey = `${session.user.id}/${slugify(folderName)}/${fileName}`;

    // Move storage object then update DB relations
    try {
      const { error } = await supabaseAdmin.storage
        .from(image.bucket)
        .move(image.objectKey, newKey);
      if (error) {
        return NextResponse.json(
          { error: `Move failed: ${error.message}` },
          { status: 500 },
        );
      }
    } catch (e: any) {
      return NextResponse.json(
        { error: e?.message || "Move failed" },
        { status: 500 },
      );
    }

    await prisma.$transaction(async (tx) => {
      // Disconnect from existing folders for this user and connect to target
      const existing = await tx.galaxy.findMany({
        where: { userId: session.user.id, images: { some: { id: image.id } } },
        select: { id: true },
      });
      if (existing.length > 0) {
        await tx.image.update({
          where: { id: image.id },
          data: {
            galaxies: { disconnect: existing.map((g) => ({ id: g.id })) },
          },
        });
      }
      await tx.image.update({
        where: { id: image.id },
        data: { objectKey: newKey, galaxies: { connect: { id: folder.id } } },
      });

      // Update acceptedFolder on AI categorization rows for this image (match by contentPreview string)
      try {
        // 1) Update acceptedFolder
        await tx.$executeRawUnsafe(
          `UPDATE "AICategorization" SET "acceptedFolder" = $1 WHERE "userId" = $2 AND "contentPreview" = $3`,
          folderName,
          session.user.id,
          `[image] ${image.objectKey}`,
        );
        // 2) Keep reasoning/alternatives discoverable by updating contentPreview to the new objectKey
        await tx.$executeRawUnsafe(
          `UPDATE "AICategorization" SET "contentPreview" = $1 WHERE "userId" = $2 AND "contentPreview" = $3`,
          `[image] ${newKey}`,
          session.user.id,
          `[image] ${image.objectKey}`,
        );
      } catch {}

      // Clean up any empty folders (excluding target)
      const candidateIds = existing
        .map((g) => g.id)
        .filter((id) => id !== folder!.id);
      if (candidateIds.length > 0) {
        await tx.galaxy.deleteMany({
          where: {
            userId: session.user.id,
            id: { in: candidateIds },
            planets: { none: {} },
            images: { none: {} },
          },
        });
      }
    });

    return NextResponse.json({
      ok: true,
      folderId: folder.id,
      moved: true,
      newKey,
    });
  } catch (error) {
    console.error("Dashboard POST error:", error);
    return NextResponse.json({ error: "Request failed" }, { status: 500 });
  }
}
