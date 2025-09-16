import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "../../../../lib/auth";
import prisma from "@repo/db/prisma";

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized "}, { status: 401 });

    const { galaxy, planet } = await req.json();
    if (!planet) return;

    // await prisma.planet.

}