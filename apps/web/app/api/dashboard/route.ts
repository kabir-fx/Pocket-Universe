import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "../../../lib/nextAuth/auth";
import { getServerSession } from "next-auth";
import prisma from "@repo/db/prisma";

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

  // Try to enrich planets with AI reasoning using planetId link first, fallback to content match
  let planetIdToReason: Record<string, string> = {};
  let contentToReason: Record<string, string> = {};
  const normalize = (s: string) => s.trim().replace(/\s+/g, ' ').slice(0, 500);
  try {
    const anyPrisma: any = prisma as any;
    if (anyPrisma?.aICategorization?.findMany) {
      // Pull recent categorizations with planetId
      const rows = await anyPrisma.aICategorization.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: 'desc' },
        take: 200,
        select: { planetId: true, contentPreview: true, reasoning: true, suggestedFolder: true },
      });

      const previewPairs = rows
        .filter((r: any) => typeof r?.contentPreview === 'string' && typeof r?.reasoning === 'string')
        .map((r: any) => ({ key: normalize(r.contentPreview as string), value: r.reasoning as string }));

      for (const r of rows) {
        if (r?.planetId && typeof r.reasoning === 'string') {
          planetIdToReason[r.planetId as string] = r.reasoning as string;
        }
      }

      function findReasonFor(content: string): string | undefined {
        const key = normalize(content);
        // Exact match first
        const exact = previewPairs.find((p: any) => p.key === key);
        if (exact) return exact.value;
        // Prefix/contains fallback (handles minor edits)
        const contains = previewPairs.find((p: any) => key.startsWith(p.key) || p.key.startsWith(key));
        return contains?.value;
      }

      // Build map for quick lookups
      for (const g of galaxies) {
        for (const p of g.planets) {
          const r = planetIdToReason[p.id] ?? findReasonFor(p.content);
          if (r) contentToReason[normalize(p.content)] = r;
        }
      }
      for (const p of orphanedPlanets) {
        const r = planetIdToReason[p.id] ?? findReasonFor(p.content);
        if (r) contentToReason[normalize(p.content)] = r;
      }
    }
    // Fallback when Prisma client lacks AICategorization model: query via raw SQL
    else if (typeof (prisma as any).$queryRawUnsafe === 'function') {
      const rows: Array<{ planetId: string | null; contentPreview: string | null; reasoning: string | null; userId: string } > = await (prisma as any).$queryRawUnsafe(
        `select "planetId", "contentPreview", "reasoning", "userId" from "AICategorization" where "userId" = $1 order by "createdAt" desc limit 500`,
        session.user.id
      );

      const previewPairs = rows
        .filter((r) => typeof r?.contentPreview === 'string' && typeof r?.reasoning === 'string')
        .map((r) => ({ key: normalize(r.contentPreview as string), value: r.reasoning as string }));

      for (const r of rows) {
        if (r?.planetId && typeof r.reasoning === 'string') {
          planetIdToReason[r.planetId as string] = r.reasoning as string;
        }
      }

      function findReasonFor(content: string): string | undefined {
        const key = normalize(content);
        const exact = previewPairs.find((p: any) => p.key === key);
        if (exact) return exact.value;
        const contains = previewPairs.find((p: any) => key.startsWith(p.key) || p.key.startsWith(key));
        return contains?.value;
      }

      for (const g of galaxies) {
        for (const p of g.planets) {
          const r = planetIdToReason[p.id] ?? findReasonFor(p.content);
          if (r) contentToReason[normalize(p.content)] = r;
        }
      }
      for (const p of orphanedPlanets) {
        const r = planetIdToReason[p.id] ?? findReasonFor(p.content);
        if (r) contentToReason[normalize(p.content)] = r;
      }
    }
  } catch {
    // If the table or client isn't available, skip enrichment silently
  }

  // Enrich with reasoning if available
  const enrichedGalaxies = galaxies.map((g) => ({
    ...g,
    planets: g.planets.map((p) => ({
      ...p,
      reasoning: planetIdToReason[p.id] ?? contentToReason[normalize(p.content)] ?? null,
    })),
  }));
  const enrichedOrphaned = orphanedPlanets.map((p) => ({
    ...p,
    reasoning: planetIdToReason[p.id] ?? contentToReason[normalize(p.content)] ?? null,
  }));

  console.log("API - User ID:", session.user.id);
  console.log("API - Real galaxies found:", galaxies.length);
  console.log("API - Orphaned planets found:", orphanedPlanets.length);

  // Always show virtual galaxy for adding new folder names
  const result: any[] = [...enrichedGalaxies];

  // ALWAYS add virtual galaxy to allow creating new folders
  result.push({
    id: "orphaned-planets", // Virtual ID
    name: "Orphaned Planets",
    planets: enrichedOrphaned.length > 0 ? enrichedOrphaned : [],
    _count: { planets: enrichedOrphaned.length },
    isVirtual: true,
  });

  console.log("API - Total Folders returned:", result.length);

  return NextResponse.json(result);
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { type, id } = await req.json();

  // Validate required fields
  if (!type) {
    return NextResponse.json({ error: "Type is required" }, { status: 400 });
  }

  if (type === "planet") {
    if (!id) {
      return NextResponse.json(
        { error: "ID is required for planet deletion" },
        { status: 400 },
      );
    }

    const res = await prisma.planet.deleteMany({
      where: {
        userId: session.user.id,
        id: id,
      },
    });

    if (res.count === 0) {
      return NextResponse.json(
        { error: "Planet not found or already deleted" },
        { status: 404 },
      );
    }

    return NextResponse.json(res);
  } else if (type === "folder") {
    if (!id) {
      return NextResponse.json(
        { error: "ID is required for Folder deletion" },
        { status: 400 },
      );
    }

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
  } else {
    return NextResponse.json(
      { error: "Invalid type. Must be 'planet' or 'folder'" },
      { status: 400 },
    );
  }
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
