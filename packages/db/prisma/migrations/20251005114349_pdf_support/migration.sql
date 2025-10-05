-- CreateTable
CREATE TABLE "public"."Document" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bucket" TEXT NOT NULL,
    "objectKey" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "sizeBytes" BIGINT NOT NULL,
    "checksumSha256" TEXT,
    "pageCount" INTEGER,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."_DocumentToGalaxy" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_DocumentToGalaxy_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "Document_userId_idx" ON "public"."Document"("userId");

-- CreateIndex
CREATE INDEX "Document_bucket_objectKey_idx" ON "public"."Document"("bucket", "objectKey");

-- CreateIndex
CREATE UNIQUE INDEX "Document_userId_objectKey_key" ON "public"."Document"("userId", "objectKey");

-- CreateIndex
CREATE INDEX "_DocumentToGalaxy_B_index" ON "public"."_DocumentToGalaxy"("B");

-- AddForeignKey
ALTER TABLE "public"."Document" ADD CONSTRAINT "Document_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_DocumentToGalaxy" ADD CONSTRAINT "_DocumentToGalaxy_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_DocumentToGalaxy" ADD CONSTRAINT "_DocumentToGalaxy_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."Galaxy"("id") ON DELETE CASCADE ON UPDATE CASCADE;
