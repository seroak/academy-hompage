-- CreateTable
CREATE TABLE "MetaAdCreative" (
    "adId" TEXT NOT NULL,
    "imageUrl" TEXT,
    "thumbnailUrl" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MetaAdCreative_pkey" PRIMARY KEY ("adId")
);
