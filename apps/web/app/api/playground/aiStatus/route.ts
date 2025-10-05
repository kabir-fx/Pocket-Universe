import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "../../../../lib/nextAuth/auth";
import { getAiUsage } from "../../../../lib/AiLimitHandler/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json(
      { limited: false, used: 0, remaining: 0, limit: 0 },
      { status: 401 },
    );
  }
  const meta = await getAiUsage(session.user.id);
  return NextResponse.json({
    limited: meta.remaining <= 0,
    used: meta.used,
    remaining: meta.remaining,
    limit: meta.limit,
    windowStart: meta.windowStart.toISOString(),
  });
}
