import prisma from "@repo/db/prisma";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "../../../../lib/nextAuth/auth";
import { ensureGalaxyByName } from "../../galaxy.ensure";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { galaxy } = await req.json();
  const name = typeof galaxy === "string" ? galaxy.trim() : "";
  if (!name) {
    return NextResponse.json({ error: "Invalid galaxy name" }, { status: 400 });
  }

  // Ensure user exists (avoids FK violations after DB resets)
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
  });
  if (!dbUser) {
    return NextResponse.json(
      { error: "Session invalid. Please sign in again." },
      { status: 401 },
    );
  }

  const res = await ensureGalaxyByName(session.user.id, name);
  return NextResponse.json(res);
}
