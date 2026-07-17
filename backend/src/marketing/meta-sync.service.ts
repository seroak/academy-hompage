import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service.js';
import { MetaApiError, MetaInsightsClient } from './meta-insights.client.js';

const dateInSeoul = (date: Date) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(date);
const UPSERT_CHUNK_SIZE = 25;
const DEFAULT_SYNC_ERROR = 'Meta 광고 데이터를 가져오지 못했습니다.';

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size)
    chunks.push(items.slice(index, index + size));
  return chunks;
}

function describeError(error: unknown): string {
  return error instanceof MetaApiError ? error.message : DEFAULT_SYNC_ERROR;
}

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
    const staleMinutes = Number(this.config.get('META_SYNC_LOCK_MINUTES', 5));
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
      for (const batch of chunk(rows, UPSERT_CHUNK_SIZE))
        await Promise.all(
          batch.map((row) =>
            this.prisma.metaAdDailyInsight.upsert({
              where: { date_adId: { date: row.date, adId: row.adId } },
              create: row,
              update: row,
            }),
          ),
        );
      const adIds = [...new Set(rows.map((row) => row.adId))];
      if (adIds.length > 0) {
        const creatives = await this.client.fetchCreatives(adIds);
        for (const batch of chunk(creatives, UPSERT_CHUNK_SIZE))
          await Promise.all(
            batch.map((creative) =>
              this.prisma.metaAdCreative.upsert({
                where: { adId: creative.adId },
                create: creative,
                update: creative,
              }),
            ),
          );
      }
      await this.prisma.metaSyncState.update({
        where: { id: 'meta' },
        data: { isRunning: false, lastSuccessAt: new Date(), lastError: null },
      });
      return { synced: rows.length };
    } catch (error) {
      const lastError = describeError(error);
      await this.prisma.metaSyncState.upsert({
        where: { id: 'meta' },
        create: {
          id: 'meta',
          isRunning: false,
          lastStartedAt: startedAt,
          lastError,
        },
        update: { isRunning: false, lastError },
      });
      throw error;
    }
  }
}
