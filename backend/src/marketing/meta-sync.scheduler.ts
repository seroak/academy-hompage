import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MetaSyncService } from './meta-sync.service.js';

@Injectable()
export class MetaSyncScheduler implements OnModuleInit, OnModuleDestroy {
  private timer?: NodeJS.Timeout;
  constructor(
    private readonly syncService: MetaSyncService,
    private readonly config: ConfigService,
  ) {}
  onModuleInit() {
    if (this.config.get<string>('META_SYNC_ENABLED', 'false') !== 'true')
      return;
    this.timer = setInterval(
      () => void this.syncService.sync().catch(() => undefined),
      6 * 60 * 60 * 1000,
    );
    this.timer.unref();
    void this.syncService.sync().catch(() => undefined);
  }
  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }
}
