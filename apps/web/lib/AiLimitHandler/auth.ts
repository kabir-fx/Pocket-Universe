import prisma from "@repo/db/prisma";

export const AI_DAILY_LIMIT = Number(process.env.AI_DAILY_LIMIT ?? 10);

function startOfUtcDay(d = new Date()): Date {
  const copy = new Date(d);
  copy.setUTCHours(0, 0, 0, 0);
  return copy;
}

export async function getAiUsage(userId: string) {
  const start = startOfUtcDay(new Date());
  const used = await prisma.aICategorization.count({
    where: { userId, createdAt: { gte: start } },
  });
  const remaining = Math.max(0, AI_DAILY_LIMIT - used);
  return {
    used,
    remaining,
    limit: AI_DAILY_LIMIT,
    windowStart: start,
  };
}

export async function enforceAiLimit(userId: string) {
  const meta = await getAiUsage(userId);
  if (meta.remaining <= 0) {
    return { allowed: false, ...meta };
  }
  return { allowed: true, ...meta };
}
