-- Remove the discontinued level-test feature and all of its persisted data.
ALTER TABLE "Reservation" DROP CONSTRAINT "Reservation_levelTestResultId_fkey";
ALTER TABLE "LevelTestResult" DROP CONSTRAINT "LevelTestResult_childId_fkey";

ALTER TABLE "Reservation" DROP COLUMN "levelTestResultId";
DROP TABLE "LevelTestResult";
DROP TABLE "LevelTestAgeConfig";
DROP TABLE "LevelTestQuestion";
DROP TYPE "LevelTestQuestionType";
