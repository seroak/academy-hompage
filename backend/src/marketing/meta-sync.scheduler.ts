import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MetaSyncService } from './meta-sync.service.js';

@Injectable()
export class MetaSyncScheduler implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MetaSyncScheduler.name);
  private timer?: NodeJS.Timeout;
  constructor(
    private readonly syncService: MetaSyncService,
    private readonly config: ConfigService,
  ) {}
  onModuleInit() {
    if (this.config.get<string>('META_SYNC_ENABLED', 'false') !== 'true')
      return;
    this.timer = setInterval(() => void this.runSync(), 6 * 60 * 60 * 1000);
    this.timer.unref();
    void this.runSync();
  }
  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }
  private async runSync() {
    try {
      await this.syncService.sync();
    } catch (error) {
      this.logger.error(
        error instanceof Error ? error.message : 'Meta 자동 동기화 실패',
      );
    }
  }
}
