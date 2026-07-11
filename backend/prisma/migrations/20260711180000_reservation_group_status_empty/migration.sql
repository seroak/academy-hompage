-- Replace the unused CANCELLED group status with EMPTY.
-- The failed first attempt can leave this temporary type behind.
DROP TYPE IF EXISTS "ReservationGroupStatus_new";
CREATE TYPE "ReservationGroupStatus_new" AS ENUM ('CONFIRMED', 'EMPTY');

ALTER TABLE "ReservationGroup"
ADD COLUMN "status_new" "ReservationGroupStatus_new";

UPDATE "ReservationGroup"
SET "status_new" = (
  CASE
    WHEN EXISTS (
      SELECT 1 FROM "Reservation" r WHERE r."groupId" = "ReservationGroup"."id"
    ) THEN 'CONFIRMED'::"ReservationGroupStatus_new"
    ELSE 'EMPTY'::"ReservationGroupStatus_new"
  END
);

ALTER TABLE "ReservationGroup" DROP COLUMN "status";
ALTER TABLE "ReservationGroup" RENAME COLUMN "status_new" TO "status";
ALTER TABLE "ReservationGroup" ALTER COLUMN "status" SET NOT NULL;
ALTER TABLE "ReservationGroup" ALTER COLUMN "status" SET DEFAULT 'EMPTY';

DROP TYPE "ReservationGroupStatus";
ALTER TYPE "ReservationGroupStatus_new" RENAME TO "ReservationGroupStatus";
