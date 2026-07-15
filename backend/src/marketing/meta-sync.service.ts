import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service.js';
import { MetaInsightsClient } from './meta-insights.client.js';

const dateInSeoul = (date: Date) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(date);

@Injectable()
export class MetaSyncService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly client: MetaInsightsClient,
    private readonly config: ConfigService,
  ) {}

  isConfigured() {
    return this.client.isConfigured();
  }

  async status() {
    const state = await this.prisma.metaSyncState.findUnique({
      where: { id: 'meta' },
    });
    return {
      configured: this.isConfigured(),
      isRunning: state?.isRunning ?? false,
      lastStartedAt: state?.lastStartedAt ?? null,
      lastSuccessAt: state?.lastSuccessAt ?? null,
      lastError: state?.lastError ?? null,
    };
  }

  async sync(): Promise<{ synced: number; skipped?: true }> {
    if (!this.client.isConfigured())
      throw new Error('Meta API가 설정되지 않았습니다.');
    const startedAt = new Date();
    const previous = await this.prisma.metaSyncState.findUnique({
      where: { id: 'meta' },
    });
    await this.prisma.metaSyncState.upsert({
      where: { id: 'meta' },
      create: { id: 'meta' },
      update: {},
    });
    const staleMinutes = Number(this.config.get('META_SYNC_LOCK_MINUTES', 30));
    const acquired = await this.prisma.metaSyncState.updateMany({
      where: {
        id: 'meta',
        OR: [
          { isRunning: false },
          {
            lastStartedAt: {
              lt: new Date(startedAt.getTime() - staleMinutes * 60000),
            },
          },
        ],
      },
      data: { isRunning: true, lastStartedAt: startedAt, lastError: null },
    });
    if (acquired.count === 0) return { synced: 0, skipped: true };
    try {
      const days = previous?.lastSuccessAt ? 7 : 29;
      const from = dateInSeoul(new Date(startedAt.getTime() - days * 86400000));
      const to = dateInSeoul(startedAt);
      const rows = await this.client.fetchDaily(from, to);
      for (const row of rows)
        await this.prisma.metaAdDailyInsight.upsert({
          where: { date_adId: { date: row.date, adId: row.adId } },
          create: row,
          update: row,
        });
      await this.prisma.metaSyncState.update({
        where: { id: 'meta' },
        data: { isRunning: false, lastSuccessAt: new Date(), lastError: null },
      });
      return { synced: rows.length };
    } catch (error) {
      await this.prisma.metaSyncState.upsert({
        where: { id: 'meta' },
        create: {
          id: 'meta',
          isRunning: false,
          lastStartedAt: startedAt,
          lastError: 'Meta 광고 데이터를 가져오지 못했습니다.',
        },
        update: {
          isRunning: false,
          lastError: 'Meta 광고 데이터를 가져오지 못했습니다.',
        },
      });
      throw error;
    }
  }
}
