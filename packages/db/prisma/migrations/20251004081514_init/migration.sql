-- CreateTable
CREATE TABLE "public"."Image" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bucket" TEXT NOT NULL,
    "objectKey" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "sizeBytes" BIGINT NOT NULL,
    "checksumSha256" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Image_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."_GalaxyToImage" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_GalaxyToImage_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "Image_userId_idx" ON "public"."Image"("userId");

-- CreateIndex
CREATE INDEX "Image_bucket_objectKey_idx" ON "public"."Image"("bucket", "objectKey");

-- CreateIndex
CREATE UNIQUE INDEX "Image_userId_objectKey_key" ON "public"."Image"("userId", "objectKey");

-- CreateIndex
CREATE INDEX "_GalaxyToImage_B_index" ON "public"."_GalaxyToImage"("B");

-- AddForeignKey
ALTER TABLE "public"."Image" ADD CONSTRAINT "Image_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_GalaxyToImage" ADD CONSTRAINT "_GalaxyToImage_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Galaxy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_GalaxyToImage" ADD CONSTRAINT "_GalaxyToImage_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."Image"("id") ON DELETE CASCADE ON UPDATE CASCADE;
