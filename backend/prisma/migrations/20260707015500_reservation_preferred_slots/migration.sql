-- CreateTable
CREATE TABLE "ReservationPreferredSlot" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "dayOfWeek" TEXT NOT NULL,
    "hour" INTEGER NOT NULL,

    CONSTRAINT "ReservationPreferredSlot_pkey" PRIMARY KEY ("id")
);

-- Preserve existing single preferred time values as one preferred slot.
INSERT INTO "ReservationPreferredSlot" ("id", "reservationId", "dayOfWeek", "hour")
SELECT
    concat('slot_', "id"),
    "id",
    "preferredDayOfWeek",
    "preferredHour"
FROM "Reservation";

-- DropColumns
ALTER TABLE "Reservation"
DROP COLUMN "preferredDayOfWeek",
DROP COLUMN "preferredHour";

-- CreateIndex
CREATE UNIQUE INDEX "ReservationPreferredSlot_reservationId_dayOfWeek_hour_key" ON "ReservationPreferredSlot"("reservationId", "dayOfWeek", "hour");

-- CreateIndex
CREATE INDEX "ReservationPreferredSlot_dayOfWeek_hour_idx" ON "ReservationPreferredSlot"("dayOfWeek", "hour");

-- AddForeignKey
ALTER TABLE "ReservationPreferredSlot" ADD CONSTRAINT "ReservationPreferredSlot_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
