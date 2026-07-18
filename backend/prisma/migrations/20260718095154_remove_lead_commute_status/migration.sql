/*
  Warnings:

  - You are about to drop the column `commuteStatus` on the `Lead` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Lead" DROP COLUMN "commuteStatus";

-- DropEnum
DROP TYPE "CommuteStatus";
