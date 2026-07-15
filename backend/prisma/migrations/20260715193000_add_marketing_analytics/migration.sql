CREATE TABLE "MarketingEvent" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "utmContent" TEXT,
    "utmTerm" TEXT,
    "fbclid" TEXT,
    "landingPath" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MarketingEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MetaAdDailyInsight" (
    "id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "campaignName" TEXT NOT NULL,
    "adSetId" TEXT NOT NULL,
    "adSetName" TEXT NOT NULL,
    "adId" TEXT NOT NULL,
    "adName" TEXT NOT NULL,
    "spendWon" INTEGER NOT NULL,
    "impressions" INTEGER NOT NULL,
    "linkClicks" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MetaAdDailyInsight_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MetaSyncState" (
    "id" TEXT NOT NULL,
    "isRunning" BOOLEAN NOT NULL DEFAULT false,
    "lastStartedAt" TIMESTAMP(3),
    "lastSuccessAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MetaSyncState_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MarketingEvent_eventId_key" ON "MarketingEvent"("eventId");
CREATE INDEX "MarketingEvent_occurredAt_idx" ON "MarketingEvent"("occurredAt");
CREATE INDEX "MarketingEvent_utmCampaign_utmContent_occurredAt_idx" ON "MarketingEvent"("utmCampaign", "utmContent", "occurredAt");
CREATE INDEX "MarketingEvent_name_sessionId_occurredAt_idx" ON "MarketingEvent"("name", "sessionId", "occurredAt");
CREATE UNIQUE INDEX "MetaAdDailyInsight_date_adId_key" ON "MetaAdDailyInsight"("date", "adId");
CREATE INDEX "MetaAdDailyInsight_campaignId_date_idx" ON "MetaAdDailyInsight"("campaignId", "date");
