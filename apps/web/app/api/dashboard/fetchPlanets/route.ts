import { NextResponse } from "next/server";
import { authOptions } from "../../../../lib/auth";
import { getServerSession } from "next-auth";
import prisma from "@repo/db/prisma";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized "}, { status: 401 });
    }

    const res = await prisma.galaxy.findMany({
        where: {
            userId: session.user.id
        }
    })

    if (!res) {
        return NextResponse.json({ msg: "Emptyyy"}, {status: 400 });
    }

    return NextResponse.json(res);
}