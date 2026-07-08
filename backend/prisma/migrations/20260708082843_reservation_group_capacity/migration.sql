-- AlterTable
ALTER TABLE "Reservation" ADD COLUMN     "requestedGroupId" TEXT;

-- AlterTable: add nullable first, backfill, then enforce NOT NULL below
ALTER TABLE "ReservationGroup" ADD COLUMN     "capacity" INTEGER,
ADD COLUMN     "maxAge" INTEGER,
ADD COLUMN     "minAge" INTEGER;

-- Backfill existing groups: capacity = current member count, age range = member age min/max.
-- Groups without members (shouldn't normally happen) fall back to capacity 1 / age 4~10.
UPDATE "ReservationGroup" g
SET
  "capacity" = COALESCE(stats.member_count, 1),
  "minAge" = COALESCE(stats.min_age, 4),
  "maxAge" = COALESCE(stats.max_age, 10)
FROM (
  SELECT "groupId", COUNT(*) AS member_count, MIN("childAge") AS min_age, MAX("childAge") AS max_age
  FROM "Reservation"
  WHERE "groupId" IS NOT NULL
  GROUP BY "groupId"
) AS stats
WHERE g."id" = stats."groupId";

UPDATE "ReservationGroup" SET "capacity" = 1 WHERE "capacity" IS NULL;
UPDATE "ReservationGroup" SET "minAge" = 4 WHERE "minAge" IS NULL;
UPDATE "ReservationGroup" SET "maxAge" = 10 WHERE "maxAge" IS NULL;

ALTER TABLE "ReservationGroup" ALTER COLUMN "capacity" SET NOT NULL;
ALTER TABLE "ReservationGroup" ALTER COLUMN "minAge" SET NOT NULL;
ALTER TABLE "ReservationGroup" ALTER COLUMN "maxAge" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_requestedGroupId_fkey" FOREIGN KEY ("requestedGroupId") REFERENCES "ReservationGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;
