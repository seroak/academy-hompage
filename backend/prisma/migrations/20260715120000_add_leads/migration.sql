CREATE TYPE "LeadStatus" AS ENUM (
  'NEW',
  'CONTACTED',
  'CONSULTATION_BOOKED',
  'VISITED',
  'REGISTERED',
  'NO_RESPONSE',
  'DISQUALIFIED'
);

CREATE TYPE "ContactWindow" AS ENUM ('H13_15', 'H15_18', 'H18_20');

CREATE TYPE "CommuteStatus" AS ENUM ('AVAILABLE', 'DECIDE_AFTER_CONSULTATION');

CREATE TABLE "Lead" (
  "id" TEXT NOT NULL,
  "guardianName" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "childAge" INTEGER NOT NULL,
  "contactWindow" "ContactWindow" NOT NULL,
  "commuteStatus" "CommuteStatus" NOT NULL,
  "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
  "utmSource" TEXT,
  "utmMedium" TEXT,
  "utmCampaign" TEXT,
  "utmContent" TEXT,
  "utmTerm" TEXT,
  "fbclid" TEXT,
  "landingPath" TEXT,
  "referrer" TEXT,
  "privacyConsentVersion" TEXT NOT NULL,
  "privacyConsentAt" TIMESTAMP(3) NOT NULL,
  "analyticsConsent" BOOLEAN NOT NULL,
  "marketingConsent" BOOLEAN NOT NULL,
  "adminNote" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Lead_phone_createdAt_idx" ON "Lead"("phone", "createdAt");
CREATE INDEX "Lead_status_createdAt_idx" ON "Lead"("status", "createdAt");
CREATE INDEX "Lead_utmCampaign_utmContent_createdAt_idx" ON "Lead"("utmCampaign", "utmContent", "createdAt");
