import { ConfigService } from '@nestjs/config';
import { MetaSyncService } from './meta-sync.service.js';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service.js';
import { MetaInsightsClient } from './meta-insights.client.js';

describe('MetaSyncService', () => {
  it('Nest 모듈에서 테스트용 시계 없이 생성된다', async () => {
    const module = await Test.createTestingModule({
      providers: [
        MetaSyncService,
        { provide: PrismaService, useValue: {} },
        { provide: MetaInsightsClient, useValue: {} },
        { provide: ConfigService, useValue: { get: jest.fn() } },
      ],
    }).compile();
    expect(module.get(MetaSyncService)).toBeInstanceOf(MetaSyncService);
  });
  it('최근 8일 인사이트를 날짜와 광고 ID로 upsert하고 성공 상태를 남긴다', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-07-15T12:00:00+09:00'));
    const prisma = {
      metaAdDailyInsight: { upsert: jest.fn().mockResolvedValue({}) },
      metaSyncState: {
        findUnique: jest.fn().mockResolvedValue({
          lastSuccessAt: new Date('2026-07-01T00:00:00Z'),
        }),
        upsert: jest.fn().mockResolvedValue({}),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        update: jest.fn().mockResolvedValue({}),
      },
    };
    const client = {
      isConfigured: jest.fn().mockReturnValue(true),
      fetchDaily: jest.fn().mockResolvedValue([
        {
          date: '2026-07-15',
          accountId: '1',
          campaignId: '10',
          campaignName: '흥덕',
          adSetId: '20',
          adSetName: '학부모',
          adId: '30',
          adName: '수업 영상',
          spendWon: 20000,
          impressions: 3200,
          linkClicks: 40,
        },
      ]),
    };
    const config = {
      get: jest.fn((_key: string, fallback: unknown) => fallback),
    } as unknown as ConfigService;
    const service = new MetaSyncService(
      prisma as never,
      client as never,
      config,
    );
    try {
      await expect(service.sync()).resolves.toEqual({ synced: 1 });
      expect(client.fetchDaily).toHaveBeenCalledWith(
        '2026-07-08',
        '2026-07-15',
      );
      expect(prisma.metaAdDailyInsight.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { date_adId: { date: '2026-07-15', adId: '30' } },
        }),
      );
      const updateCall = (
        prisma.metaSyncState.update.mock.calls as unknown[][]
      )[0]?.[0] as
        | { data?: { isRunning?: boolean; lastError?: string | null } }
        | undefined;
      expect(updateCall?.data).toMatchObject({
        isRunning: false,
        lastError: null,
      });
    } finally {
      jest.useRealTimers();
    }
  });

  it('DB 잠금을 얻지 못하면 중복 동기화를 시작하지 않는다', async () => {
    const prisma = {
      metaSyncState: {
        findUnique: jest.fn().mockResolvedValue({}),
        upsert: jest.fn().mockResolvedValue({}),
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
    };
    const service = new MetaSyncService(
      prisma as never,
      { isConfigured: () => true } as never,
      { get: jest.fn() } as never,
    );
    await expect(service.sync()).resolves.toEqual({ synced: 0, skipped: true });
  });
});
