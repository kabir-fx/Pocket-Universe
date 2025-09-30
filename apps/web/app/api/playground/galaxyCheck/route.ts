import prisma from "@repo/db/prisma";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "../../../../lib/nextAuth/auth";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { galaxy } = await req.json();

  let res = await prisma.galaxy.findFirst({
    where: {
      name: galaxy,
    },
  });

  if (!res) {
    res = await prisma.galaxy.create({
      data: {
        userId: session.user.id,
        name: galaxy,
        shareable: false,
      },
    });
  }

  return NextResponse.json(res);
}
