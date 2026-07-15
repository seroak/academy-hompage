import { MarketingService } from './marketing.service.js';

describe('MarketingService', () => {
  const prisma = {
    marketingEvent: { create: jest.fn(), findMany: jest.fn() },
    metaAdDailyInsight: { findMany: jest.fn() },
    lead: { findMany: jest.fn() },
    metaSyncState: { findUnique: jest.fn() },
  };
  const limiter = { consume: jest.fn().mockReturnValue(true) };
  const metaClient = { isConfigured: jest.fn().mockReturnValue(true) };
  let service: MarketingService;

  beforeEach(() => {
    jest.clearAllMocks();
    limiter.consume.mockReturnValue(true);
    service = new MarketingService(
      prisma as never,
      limiter as never,
      metaClient as never,
    );
  });

  it('익명 이벤트만 저장하고 중복 eventId는 성공으로 처리한다', async () => {
    prisma.marketingEvent.create
      .mockResolvedValueOnce({ id: '1' })
      .mockRejectedValueOnce({ code: 'P2002' });
    const input = {
      eventId: '5eddf7c8-ea1a-4973-aa67-ff9fa45fe913',
      sessionId: '76a93f01-6007-475a-a939-a481abbdbecc',
      name: 'view_ad_landing' as const,
      utmCampaign: '10',
      utmContent: '30',
      landingPath: '/lp/heungdeok-math',
      occurredAt: '2026-07-15T01:00:00.000Z',
    };
    await expect(service.collect(input, '203.0.113.10')).resolves.toEqual({
      accepted: true,
    });
    await expect(service.collect(input, '203.0.113.10')).resolves.toEqual({
      accepted: true,
    });
    expect(prisma.marketingEvent.create).toHaveBeenCalledTimes(2);
  });

  it('Meta 광고와 자체 행동 및 모든 리드 상태를 소재별로 집계한다', async () => {
    prisma.metaAdDailyInsight.findMany.mockResolvedValue([
      {
        date: '2026-07-15',
        campaignId: '10',
        campaignName: '흥덕',
        adId: '30',
        adName: '수업 영상',
        spendWon: 20000,
        impressions: 3200,
        linkClicks: 40,
      },
    ]);
    prisma.marketingEvent.findMany.mockResolvedValue([
      {
        name: 'view_ad_landing',
        sessionId: 's1',
        utmCampaign: '10',
        utmContent: '30',
        occurredAt: new Date('2026-07-15T01:00:00Z'),
      },
      {
        name: 'view_ad_landing',
        sessionId: 's1',
        utmCampaign: '10',
        utmContent: '30',
        occurredAt: new Date('2026-07-15T02:00:00Z'),
      },
      {
        name: 'lead_form_start',
        sessionId: 's1',
        utmCampaign: '10',
        utmContent: '30',
        occurredAt: new Date('2026-07-15T02:00:00Z'),
      },
    ]);
    prisma.lead.findMany.mockResolvedValue([
      {
        status: 'REGISTERED',
        utmCampaign: '10',
        utmContent: '30',
        createdAt: new Date('2026-07-15T03:00:00Z'),
      },
      {
        status: 'NO_RESPONSE',
        utmCampaign: '10',
        utmContent: '30',
        createdAt: new Date('2026-07-15T04:00:00Z'),
      },
    ]);
    prisma.metaSyncState.findUnique.mockResolvedValue({
      lastSuccessAt: new Date('2026-07-15T05:00:00Z'),
      lastError: null,
      isRunning: false,
    });

    const result = await service.dashboard({
      from: '2026-07-15',
      to: '2026-07-15',
    });
    expect(result.totals).toMatchObject({
      spendWon: 20000,
      impressions: 3200,
      linkClicks: 40,
      landingVisits: 1,
      leads: 2,
      registrations: 1,
      costPerLead: 10000,
      costPerRegistration: 20000,
    });
    expect(result.creatives[0]).toMatchObject({
      campaignId: '10',
      adId: '30',
      adName: '수업 영상',
      landingVisits: 1,
      leads: 2,
      registrations: 1,
    });
  });

  it('분모가 0인 비용과 전환율은 null이다', async () => {
    prisma.metaAdDailyInsight.findMany.mockResolvedValue([]);
    prisma.marketingEvent.findMany.mockResolvedValue([]);
    prisma.lead.findMany.mockResolvedValue([]);
    prisma.metaSyncState.findUnique.mockResolvedValue(null);
    const result = await service.dashboard({
      from: '2026-07-15',
      to: '2026-07-15',
    });
    expect(result.totals.costPerLead).toBeNull();
    expect(result.totals.landingToLeadRate).toBeNull();
    expect(result.meta.configured).toBe(true);
  });
});
