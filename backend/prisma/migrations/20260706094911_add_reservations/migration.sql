-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('WAITING', 'GROUPED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ReservationGroupStatus" AS ENUM ('CONFIRMED', 'CANCELLED');

-- CreateTable
CREATE TABLE "Reservation" (
    "id" TEXT NOT NULL,
    "childName" TEXT NOT NULL,
    "childAge" INTEGER NOT NULL,
    "parentName" TEXT NOT NULL,
    "parentEmail" TEXT NOT NULL,
    "parentPhone" TEXT,
    "preferredDayOfWeek" TEXT NOT NULL,
    "preferredTimeSlot" TEXT NOT NULL,
    "note" TEXT,
    "status" "ReservationStatus" NOT NULL DEFAULT 'WAITING',
    "groupId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReservationGroup" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "dayOfWeek" TEXT NOT NULL,
    "timeSlot" TEXT NOT NULL,
    "status" "ReservationGroupStatus" NOT NULL DEFAULT 'CONFIRMED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReservationGroup_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "ReservationGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;
