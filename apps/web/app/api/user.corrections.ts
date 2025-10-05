import prisma from "@repo/db/prisma";

export async function getUserCorrections(userId: string): Promise<
  | Array<{
      originalContent: string;
      suggestedFolder: string;
      acceptedFolder: string;
    }>
  | undefined
> {
  let userCorrections:
    | Array<{
        originalContent: string;
        suggestedFolder: string;
        acceptedFolder: string;
      }>
    | undefined = undefined;
  try {
    const normalize = (s: string) =>
      s.trim().replace(/\s+/g, " ").slice(0, 500);
    const rows = await prisma.aICategorization.findMany({
      where: { userId, acceptedFolder: { not: null } },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        contentPreview: true,
        suggestedFolder: true,
        acceptedFolder: true,
      },
    });
    const mapped = (rows as Array<any>)
      .filter(
        (r) =>
          typeof r?.contentPreview === "string" &&
          typeof r?.suggestedFolder === "string" &&
          typeof r?.acceptedFolder === "string",
      )
      .filter((r) => r.acceptedFolder !== r.suggestedFolder)
      .map((r) => ({
        originalContent: normalize(r.contentPreview as string),
        suggestedFolder: r.suggestedFolder as string,
        acceptedFolder: r.acceptedFolder as string,
      }));
    if (mapped.length > 0) userCorrections = mapped;
  } catch {}
  return userCorrections;
}
