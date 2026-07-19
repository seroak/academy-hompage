import { MarketingService } from './marketing.service.js';

describe('MarketingService', () => {
  const prisma = {
    marketingEvent: { create: jest.fn(), findMany: jest.fn() },
    metaAdDailyInsight: { findMany: jest.fn() },
    metaAdCreative: { findMany: jest.fn().mockResolvedValue([]) },
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
      {
        name: 'lead_submit_attempt',
        sessionId: 's1',
        utmCampaign: '10',
        utmContent: '30',
        occurredAt: new Date('2026-07-15T02:01:00Z'),
      },
      {
        name: 'lead_submit_blocked',
        sessionId: 's1',
        utmCampaign: '10',
        utmContent: '30',
        occurredAt: new Date('2026-07-15T02:02:00Z'),
      },
      {
        name: 'lead_submit_error',
        sessionId: 's1',
        utmCampaign: '10',
        utmContent: '30',
        occurredAt: new Date('2026-07-15T02:03:00Z'),
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
    prisma.metaAdCreative.findMany.mockResolvedValueOnce([
      {
        adId: '30',
        imageUrl: 'https://example.com/30.jpg',
        thumbnailUrl: 'https://example.com/30-thumb.jpg',
      },
    ]);

    const result = await service.dashboard({
      from: '2026-07-15',
      to: '2026-07-15',
    });
    expect(result.totals).toMatchObject({
      spendWon: 20000,
      impressions: 3200,
      linkClicks: 40,
      landingVisits: 1,
      submitAttempts: 1,
      submitBlocked: 1,
      submitErrors: 1,
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
      imageUrl: 'https://example.com/30.jpg',
      thumbnailUrl: 'https://example.com/30-thumb.jpg',
      ctr: 1.25,
    });
    expect(prisma.metaAdCreative.findMany).toHaveBeenCalledWith({
      where: { adId: { in: ['30'] } },
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
    expect(prisma.metaAdCreative.findMany).not.toHaveBeenCalled();
  });

  it('시작일이 종료일보다 늦으면 두 값을 뒤바꿔 처리한다', async () => {
    prisma.metaAdDailyInsight.findMany.mockResolvedValue([]);
    prisma.marketingEvent.findMany.mockResolvedValue([]);
    prisma.lead.findMany.mockResolvedValue([]);
    prisma.metaSyncState.findUnique.mockResolvedValue(null);
    const result = await service.dashboard({
      from: '2026-07-16',
      to: '2026-07-15',
    });
    expect(result.range).toEqual({ from: '2026-07-15', to: '2026-07-16' });
  });

  it('날짜별 집계는 각 날짜의 광고비·랜딩 방문·상담·등록을 정확히 채운다', async () => {
    prisma.metaAdDailyInsight.findMany.mockResolvedValue([
      {
        date: '2026-07-14',
        campaignId: '10',
        campaignName: '흥덕',
        adId: '30',
        adName: '수업 영상',
        spendWon: 5000,
        impressions: 100,
        linkClicks: 2,
      },
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
        occurredAt: new Date('2026-07-14T01:00:00Z'),
      },
    ]);
    prisma.lead.findMany.mockResolvedValue([
      {
        status: 'REGISTERED',
        utmCampaign: '10',
        utmContent: '30',
        createdAt: new Date('2026-07-15T03:00:00Z'),
      },
    ]);
    prisma.metaSyncState.findUnique.mockResolvedValue(null);

    const result = await service.dashboard({
      from: '2026-07-14',
      to: '2026-07-15',
    });
    expect(result.daily).toEqual([
      { date: '2026-07-14', spendWon: 5000, landingVisits: 1, leads: 0, registrations: 0 },
      { date: '2026-07-15', spendWon: 20000, landingVisits: 0, leads: 1, registrations: 1 },
    ]);
  });
});
