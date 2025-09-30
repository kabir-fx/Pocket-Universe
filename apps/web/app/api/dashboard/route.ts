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
    name: "Miscellaneous",
    planets: orphanedPlanets.length > 0 ? orphanedPlanets : [],
    _count: { planets: orphanedPlanets.length },
    isVirtual: true,
  });

  console.log("API - Total galaxies returned:", result.length);

  return NextResponse.json(result);
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized " }, { status: 401 });
  }

  const { content } = await req.json();

  const res = await prisma.planet.deleteMany({
    where: {
      userId: session.user.id,
      content: content,
    },
  });

  if (!res) {
    return NextResponse.json(
      { error: "Failed Planet Deletion" },
      { status: 400 },
    );
  }

  return NextResponse.json(res);
}
