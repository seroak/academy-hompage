-- AlterTable
ALTER TABLE "ReservationPreferredSlot"
ADD COLUMN "startMinute" INTEGER,
ADD COLUMN "endMinute" INTEGER;

-- Backfill existing local development rows before dropping hour.
UPDATE "ReservationPreferredSlot"
SET "startMinute" = "hour" * 60,
    "endMinute" = LEAST("hour" * 60 + 70, 1080);

-- DropIndex
DROP INDEX "ReservationPreferredSlot_dayOfWeek_hour_idx";

-- DropIndex
DROP INDEX "ReservationPreferredSlot_reservationId_dayOfWeek_hour_key";

-- AlterTable
ALTER TABLE "ReservationPreferredSlot"
ALTER COLUMN "startMinute" SET NOT NULL,
ALTER COLUMN "endMinute" SET NOT NULL,
DROP COLUMN "hour";

-- AlterTable
ALTER TABLE "ReservationGroup"
ADD COLUMN "startMinute" INTEGER,
ADD COLUMN "endMinute" INTEGER;

-- Backfill existing local development rows before dropping hour.
UPDATE "ReservationGroup"
SET "startMinute" = "hour" * 60,
    "endMinute" = LEAST("hour" * 60 + 70, 1080);

-- AlterTable
ALTER TABLE "ReservationGroup"
ALTER COLUMN "startMinute" SET NOT NULL,
ALTER COLUMN "endMinute" SET NOT NULL,
DROP COLUMN "hour";

-- CreateIndex
CREATE UNIQUE INDEX "ReservationPreferredSlot_reservationId_dayOfWeek_startMinute_endMinute_key" ON "ReservationPreferredSlot"("reservationId", "dayOfWeek", "startMinute", "endMinute");

-- CreateIndex
CREATE INDEX "ReservationPreferredSlot_dayOfWeek_startMinute_endMinute_idx" ON "ReservationPreferredSlot"("dayOfWeek", "startMinute", "endMinute");
