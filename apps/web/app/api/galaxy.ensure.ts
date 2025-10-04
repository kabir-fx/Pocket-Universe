import prisma from "@repo/db/prisma";

// galaxy.ensure.ts (server-only util)
export async function ensureGalaxyByName(userId: string, name: string) {
    const trimmed = name.trim();
    // Fallback implementation that does not rely on composite unique typing
    const existing = await prisma.galaxy.findFirst({ where: { userId, name: trimmed } });
    if (existing) return existing;
    try {
      return await prisma.galaxy.create({
        data: { userId, name: trimmed, shareable: false },
      });
    } catch (e: any) {
      // If a unique exists and another request created it, re-query
      const code = e?.code || e?.meta?.code;
      if (code === "P2002") {
        const again = await prisma.galaxy.findFirst({ where: { userId, name: trimmed } });
        if (again) return again;
      }
      throw e;
    }
}