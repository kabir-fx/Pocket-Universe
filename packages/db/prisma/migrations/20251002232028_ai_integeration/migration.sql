-- AlterTable
ALTER TABLE "public"."AICategorization" ADD COLUMN     "folderId" TEXT,
ADD COLUMN     "planetId" TEXT;

-- CreateIndex
CREATE INDEX "AICategorization_userId_createdAt_idx" ON "public"."AICategorization"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "public"."AICategorization" ADD CONSTRAINT "AICategorization_planetId_fkey" FOREIGN KEY ("planetId") REFERENCES "public"."Planet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AICategorization" ADD CONSTRAINT "AICategorization_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "public"."Galaxy"("id") ON DELETE SET NULL ON UPDATE CASCADE;
