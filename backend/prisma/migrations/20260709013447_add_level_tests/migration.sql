-- CreateEnum
CREATE TYPE "LevelTestQuestionType" AS ENUM ('MULTIPLE_CHOICE', 'SHORT_ANSWER');

-- AlterTable
ALTER TABLE "Reservation" ADD COLUMN     "levelTestResultId" TEXT;

-- CreateTable
CREATE TABLE "LevelTestQuestion" (
    "id" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "type" "LevelTestQuestionType" NOT NULL,
    "prompt" TEXT NOT NULL,
    "choices" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "correctChoiceIndex" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LevelTestQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LevelTestAgeConfig" (
    "age" INTEGER NOT NULL,
    "drawCount" INTEGER NOT NULL DEFAULT 5,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LevelTestAgeConfig_pkey" PRIMARY KEY ("age")
);

-- CreateTable
CREATE TABLE "LevelTestResult" (
    "id" TEXT NOT NULL,
    "parentUserId" TEXT NOT NULL,
    "childName" TEXT NOT NULL,
    "childAge" INTEGER NOT NULL,
    "answers" JSONB NOT NULL,
    "score" INTEGER,
    "scorableCount" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LevelTestResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LevelTestQuestion_age_active_idx" ON "LevelTestQuestion"("age", "active");

-- CreateIndex
CREATE INDEX "LevelTestResult_parentUserId_idx" ON "LevelTestResult"("parentUserId");

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_levelTestResultId_fkey" FOREIGN KEY ("levelTestResultId") REFERENCES "LevelTestResult"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LevelTestResult" ADD CONSTRAINT "LevelTestResult_parentUserId_fkey" FOREIGN KEY ("parentUserId") REFERENCES "ParentUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
