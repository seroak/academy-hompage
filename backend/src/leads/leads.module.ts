import { Module } from '@nestjs/common';
import { LeadsController } from './leads.controller.js';
import { LeadsService } from './leads.service.js';
import { LeadRateLimiter } from './lead-rate-limiter.service.js';
import { TurnstileVerifier } from './turnstile-verifier.service.js';

@Module({
  controllers: [LeadsController],
  providers: [LeadsService, LeadRateLimiter, TurnstileVerifier],
})
export class LeadsModule {}
