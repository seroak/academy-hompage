/*
  Warnings:

  - You are about to drop the column `preferredTimeSlot` on the `Reservation` table. All the data in the column will be lost.
  - You are about to drop the column `timeSlot` on the `ReservationGroup` table. All the data in the column will be lost.
  - Added the required column `preferredHour` to the `Reservation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `hour` to the `ReservationGroup` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Reservation" DROP COLUMN "preferredTimeSlot",
ADD COLUMN     "preferredHour" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "ReservationGroup" DROP COLUMN "timeSlot",
ADD COLUMN     "hour" INTEGER NOT NULL;
