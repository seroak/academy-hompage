-- CreateTable
CREATE TABLE "ReservationGroupSlot" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "dayOfWeek" TEXT NOT NULL,
    "startMinute" INTEGER NOT NULL,
    "endMinute" INTEGER NOT NULL,

    CONSTRAINT "ReservationGroupSlot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReservationGroupSlot_groupId_idx" ON "ReservationGroupSlot"("groupId");

-- CreateIndex
CREATE INDEX "ReservationGroupSlot_dayOfWeek_startMinute_endMinute_idx" ON "ReservationGroupSlot"("dayOfWeek", "startMinute", "endMinute");

-- AddForeignKey
ALTER TABLE "ReservationGroupSlot" ADD CONSTRAINT "ReservationGroupSlot_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "ReservationGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReservationGroupSlot" ADD CONSTRAINT "ReservationGroupSlot_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: preserve existing group time window as a slot per member reservation
-- so no in-flight confirmed group loses its schedule data during the migration.
INSERT INTO "ReservationGroupSlot" ("id", "groupId", "reservationId", "dayOfWeek", "startMinute", "endMinute")
SELECT gen_random_uuid()::text, r."groupId", r."id", g."dayOfWeek", g."startMinute", g."endMinute"
FROM "Reservation" r
JOIN "ReservationGroup" g ON g."id" = r."groupId"
WHERE r."groupId" IS NOT NULL;

-- AlterTable
ALTER TABLE "ReservationGroup" DROP COLUMN "dayOfWeek",
DROP COLUMN "startMinute",
DROP COLUMN "endMinute";
