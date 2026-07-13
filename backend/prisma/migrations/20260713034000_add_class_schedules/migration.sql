CREATE TYPE "ScheduleStatus" AS ENUM ('DRAFT', 'PUBLISHED');
CREATE TYPE "ScheduleDayKind" AS ENUM ('CLASS', 'HOLIDAY', 'CLOSED');

CREATE TABLE "ClassSchedule" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "quarter" INTEGER NOT NULL,
    "status" "ScheduleStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ClassSchedule_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ClassScheduleDay" (
    "id" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "kind" "ScheduleDayKind" NOT NULL,
    "classMonth" TEXT,
    "note" TEXT,
    CONSTRAINT "ClassScheduleDay_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ClassSchedule_year_quarter_key" ON "ClassSchedule"("year", "quarter");
CREATE UNIQUE INDEX "ClassScheduleDay_scheduleId_date_key" ON "ClassScheduleDay"("scheduleId", "date");
CREATE INDEX "ClassScheduleDay_scheduleId_idx" ON "ClassScheduleDay"("scheduleId");
ALTER TABLE "ClassScheduleDay" ADD CONSTRAINT "ClassScheduleDay_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "ClassSchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
