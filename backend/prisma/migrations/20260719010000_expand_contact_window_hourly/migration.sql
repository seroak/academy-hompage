-- Replace the 3 broad ContactWindow buckets with 15 one-hour slots (09~10 ... 23~24).
-- Existing rows are mapped to the slot matching their old window's start hour.
DROP TYPE IF EXISTS "ContactWindow_new";
CREATE TYPE "ContactWindow_new" AS ENUM (
  'H09_10', 'H10_11', 'H11_12', 'H12_13', 'H13_14', 'H14_15', 'H15_16',
  'H16_17', 'H17_18', 'H18_19', 'H19_20', 'H20_21', 'H21_22', 'H22_23', 'H23_24'
);

ALTER TABLE "Lead"
ADD COLUMN "contactWindow_new" "ContactWindow_new";

UPDATE "Lead"
SET "contactWindow_new" = (
  CASE "contactWindow"::text
    WHEN 'H13_15' THEN 'H13_14'
    WHEN 'H15_18' THEN 'H15_16'
    WHEN 'H18_20' THEN 'H18_19'
    ELSE "contactWindow"::text
  END
)::"ContactWindow_new";

ALTER TABLE "Lead" DROP COLUMN "contactWindow";
ALTER TABLE "Lead" RENAME COLUMN "contactWindow_new" TO "contactWindow";
ALTER TABLE "Lead" ALTER COLUMN "contactWindow" SET NOT NULL;

DROP TYPE "ContactWindow";
ALTER TYPE "ContactWindow_new" RENAME TO "ContactWindow";
