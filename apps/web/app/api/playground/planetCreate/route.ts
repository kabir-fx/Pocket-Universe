import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "../../../../lib/nextAuth/auth";
import prisma from "@repo/db/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized " }, { status: 401 });

  const { galaxy, planet } = await req.json();

  const res = await prisma.planet.create({
    data: {
      userId: session.user.id,
      content: planet,
      ...(galaxy && {
        galaxies: {
          connect: { name: galaxy },
        },
      }),
    },
  });

  if (!res) {
    return NextResponse.json(
      { error: "Failed Planet Creation " },
      { status: 400 },
    );
  }

  return NextResponse.json(res);
}
