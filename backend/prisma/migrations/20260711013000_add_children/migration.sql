CREATE TABLE "Child" (
    "id" TEXT NOT NULL,
    "parentUserId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Child_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Reservation" ADD COLUMN "childId" TEXT;
ALTER TABLE "LevelTestResult" ADD COLUMN "childId" TEXT;

CREATE INDEX "Child_parentUserId_idx" ON "Child"("parentUserId");

ALTER TABLE "Child" ADD CONSTRAINT "Child_parentUserId_fkey"
  FOREIGN KEY ("parentUserId") REFERENCES "ParentUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_childId_fkey"
  FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "LevelTestResult" ADD CONSTRAINT "LevelTestResult_childId_fkey"
  FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE SET NULL ON UPDATE CASCADE;
