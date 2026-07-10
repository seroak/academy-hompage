ALTER TABLE "ReservationGroup"
ADD COLUMN "scheduleDayOfWeek" TEXT,
ADD COLUMN "scheduleStartMinute" INTEGER,
ADD COLUMN "scheduleEndMinute" INTEGER;
