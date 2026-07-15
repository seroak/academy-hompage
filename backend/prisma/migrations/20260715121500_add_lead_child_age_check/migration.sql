ALTER TABLE "Lead"
ADD CONSTRAINT "Lead_childAge_check" CHECK ("childAge" BETWEEN 4 AND 10);
