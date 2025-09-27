import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "../../../lib/auth";
import { getServerSession } from "next-auth";
import prisma from "@repo/db/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized " }, { status: 401 });
  }

  const res = await prisma.galaxy.findMany({
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

  if (!res) {
    return NextResponse.json({ msg: "Emptyyy" }, { status: 400 });
  }

  return NextResponse.json(res);
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
