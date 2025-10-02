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

  console.log("API - User ID:", session.user.id);
  console.log("API - Real galaxies found:", galaxies.length);
  console.log("API - Orphaned planets found:", orphanedPlanets.length);

  // Always show virtual galaxy for adding new folder names
  const result: any[] = [...galaxies];

  // ALWAYS add virtual galaxy to allow creating new folders
  result.push({
    id: "orphaned-planets", // Virtual ID
    name: "Orphaned Planets",
    planets: orphanedPlanets.length > 0 ? orphanedPlanets : [],
    _count: { planets: orphanedPlanets.length },
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
