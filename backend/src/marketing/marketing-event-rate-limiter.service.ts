import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MarketingEventRateLimiter {
  private readonly buckets = new Map<string, number[]>();
  constructor(private readonly config: ConfigService) {}
  consume(ip: string) {
    const limit = Number(this.config.get('MARKETING_EVENT_RATE_LIMIT', 120));
    const windowMs =
      Number(this.config.get('MARKETING_EVENT_RATE_WINDOW_SECONDS', 3600)) *
      1000;
    const cutoff = Date.now() - windowMs;
    const recent = (this.buckets.get(ip) ?? []).filter(
      (value) => value > cutoff,
    );
    if (recent.length >= limit) return false;
    recent.push(Date.now());
    this.buckets.set(ip, recent);
    return true;
  }
}
