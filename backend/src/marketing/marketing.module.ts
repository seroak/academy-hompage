import { Module } from '@nestjs/common';
import { MarketingController } from './marketing.controller.js';
import { MarketingEventRateLimiter } from './marketing-event-rate-limiter.service.js';
import { MarketingService } from './marketing.service.js';
import { MetaInsightsClient } from './meta-insights.client.js';
import { MetaSyncScheduler } from './meta-sync.scheduler.js';
import { MetaSyncService } from './meta-sync.service.js';

@Module({
  controllers: [MarketingController],
  providers: [
    MarketingService,
    MarketingEventRateLimiter,
    MetaInsightsClient,
    MetaSyncService,
    MetaSyncScheduler,
  ],
})
export class MarketingModule {}
