import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface RateBucket {
  count: number;
  resetAt: number;
}

@Injectable()
export class LeadRateLimiter {
  private readonly buckets = new Map<string, RateBucket>();

  constructor(private readonly config: ConfigService) {}

  consume(ip: string): boolean {
    const now = Date.now();
    const limit = this.positiveInteger('LEAD_RATE_LIMIT', 5);
    const windowMs =
      this.positiveInteger('LEAD_RATE_WINDOW_SECONDS', 600) * 1000;
    const bucket = this.buckets.get(ip);

    if (!bucket || bucket.resetAt <= now) {
      this.buckets.set(ip, { count: 1, resetAt: now + windowMs });
      return true;
    }
    if (bucket.count >= limit) return false;
    bucket.count += 1;
    return true;
  }

  private positiveInteger(key: string, fallback: number): number {
    const raw = Number(this.config.get<string | number>(key, fallback));
    return Number.isInteger(raw) && raw > 0 ? raw : fallback;
  }
}
