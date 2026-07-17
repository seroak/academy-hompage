import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateMarketingEventDto } from './dto/create-marketing-event.dto.js';
import { QueryMarketingDashboardDto } from './dto/query-marketing-dashboard.dto.js';
import { MarketingEventRateLimiter } from './marketing-event-rate-limiter.service.js';
import { MetaInsightsClient } from './meta-insights.client.js';

const VALID = new Set([
  'CONTACTED',
  'CONSULTATION_BOOKED',
  'VISITED',
  'REGISTERED',
]);
const BOOKING = new Set(['CONSULTATION_BOOKED', 'VISITED', 'REGISTERED']);
const VISITED = new Set(['VISITED', 'REGISTERED']);
type SourceItem = { utmCampaign: string | null; utmContent: string | null };

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { code?: unknown }).code === 'P2002'
  );
}

type Metrics = {
  spendWon: number;
  impressions: number;
  linkClicks: number;
  landingVisits: number;
  ctaClicks: number;
  formStarts: number;
  leads: number;
  validLeads: number;
  bookings: number;
  visits: number;
  registrations: number;
};

function blankMetrics(): Metrics {
  return {
    spendWon: 0,
    impressions: 0,
    linkClicks: 0,
    landingVisits: 0,
    ctaClicks: 0,
    formStarts: 0,
    leads: 0,
    validLeads: 0,
    bookings: 0,
    visits: 0,
    registrations: 0,
  };
}
function ratio(numerator: number, denominator: number) {
  return denominator === 0
    ? null
    : Math.round((numerator / denominator) * 10000) / 100;
}
function cost(spend: number, count: number) {
  return count === 0 ? null : Math.round(spend / count);
}
function enrich(value: Metrics) {
  return {
    ...value,
    cpm: value.impressions
      ? Math.round((value.spendWon / value.impressions) * 1000)
      : null,
    cpc: cost(value.spendWon, value.linkClicks),
    ctr: ratio(value.linkClicks, value.impressions),
    costPerLead: cost(value.spendWon, value.leads),
    costPerValidLead: cost(value.spendWon, value.validLeads),
    costPerRegistration: cost(value.spendWon, value.registrations),
    clickToLandingRate: ratio(value.landingVisits, value.linkClicks),
    landingToLeadRate: ratio(value.leads, value.landingVisits),
    leadToValidRate: ratio(value.validLeads, value.leads),
    validToBookingRate: ratio(value.bookings, value.validLeads),
    bookingToVisitRate: ratio(value.visits, value.bookings),
    visitToRegistrationRate: ratio(value.registrations, value.visits),
  };
}
function range(query: QueryMarketingDashboardDto) {
  const to =
    query.to ??
    new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(
      new Date(),
    );
  const end = new Date(`${to}T23:59:59.999+09:00`);
  const from =
    query.from ??
    new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(
      new Date(end.getTime() - 6 * 86400000),
    );
  if (from > to)
    return {
      from: to,
      to: from,
      start: new Date(`${to}T00:00:00.000+09:00`),
      end: new Date(`${from}T23:59:59.999+09:00`),
    };
  return { from, to, start: new Date(`${from}T00:00:00.000+09:00`), end };
}
function key(item: SourceItem) {
  return `${item.utmCampaign ?? 'legacy'}::${item.utmContent ?? 'legacy'}`;
}

@Injectable()
export class MarketingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly limiter: MarketingEventRateLimiter,
    private readonly metaClient: MetaInsightsClient,
  ) {}

  async collect(input: CreateMarketingEventDto, ip: string) {
    if (!this.limiter.consume(ip)) return { accepted: true as const };
    try {
      await this.prisma.marketingEvent.create({
        data: { ...input, occurredAt: new Date(input.occurredAt) },
      });
    } catch (error) {
      if (!isUniqueConstraintError(error)) throw error;
    }
    return { accepted: true as const };
  }

  async dashboard(query: QueryMarketingDashboardDto) {
    const dates = range(query);
    const campaignFilter = query.campaignId
      ? { utmCampaign: query.campaignId }
      : {};
    const insights = await this.prisma.metaAdDailyInsight.findMany({
      where: {
        date: { gte: dates.from, lte: dates.to },
        campaignId: query.campaignId,
      },
    });
    const insightAdIds = [...new Set(insights.map((item) => item.adId))];
    const creativeImages =
      insightAdIds.length > 0
        ? await this.prisma.metaAdCreative.findMany({
            where: { adId: { in: insightAdIds } },
          })
        : [];
    const [events, leads, sync] = await Promise.all([
      this.prisma.marketingEvent.findMany({
        where: {
          occurredAt: { gte: dates.start, lte: dates.end },
          ...campaignFilter,
        },
      }),
      this.prisma.lead.findMany({
        where: {
          createdAt: { gte: dates.start, lte: dates.end },
          ...campaignFilter,
        },
        select: {
          status: true,
          utmCampaign: true,
          utmContent: true,
          createdAt: true,
        },
      }),
      this.prisma.metaSyncState.findUnique({ where: { id: 'meta' } }),
    ]);
    const groups = new Map<
      string,
      Metrics & {
        campaignId: string;
        campaignName: string;
        adId: string;
        adName: string;
      }
    >();
    const ensure = (
      campaignId: string | null,
      adId: string | null,
      campaignName?: string,
      adName?: string,
    ) => {
      const id = `${campaignId ?? 'legacy'}::${adId ?? 'legacy'}`;
      if (!groups.has(id))
        groups.set(id, {
          ...blankMetrics(),
          campaignId: campaignId ?? 'legacy',
          campaignName: campaignName ?? '기존 UTM',
          adId: adId ?? 'legacy',
          adName: adName ?? adId ?? '기존 UTM',
        });
      return groups.get(id)!;
    };
    for (const item of insights) {
      const group = ensure(
        item.campaignId,
        item.adId,
        item.campaignName,
        item.adName,
      );
      group.spendWon += item.spendWon;
      group.impressions += item.impressions;
      group.linkClicks += item.linkClicks;
    }
    const sessions = new Map<string, Set<string>>();
    for (const item of events) {
      const group = ensure(item.utmCampaign, item.utmContent);
      const groupKey = key(item);
      if (item.name === 'view_ad_landing') {
        const values = sessions.get(groupKey) ?? new Set<string>();
        values.add(item.sessionId);
        sessions.set(groupKey, values);
      } else if (item.name === 'consultation_cta_click') group.ctaClicks += 1;
      else if (item.name === 'lead_form_start') group.formStarts += 1;
    }
    for (const [groupKey, values] of sessions) {
      const [campaignId, adId] = groupKey.split('::');
      ensure(
        campaignId === 'legacy' ? null : campaignId,
        adId === 'legacy' ? null : adId,
      ).landingVisits = values.size;
    }
    for (const lead of leads) {
      const group = ensure(lead.utmCampaign, lead.utmContent);
      group.leads += 1;
      if (VALID.has(lead.status)) group.validLeads += 1;
      if (BOOKING.has(lead.status)) group.bookings += 1;
      if (VISITED.has(lead.status)) group.visits += 1;
      if (lead.status === 'REGISTERED') group.registrations += 1;
    }
    const totals = blankMetrics();
    for (const group of groups.values())
      for (const field of Object.keys(totals) as (keyof Metrics)[])
        totals[field] += group[field];
    const imagesByAdId = new Map(
      creativeImages.map((item) => [
        item.adId,
        { imageUrl: item.imageUrl, thumbnailUrl: item.thumbnailUrl },
      ]),
    );
    const creatives = [...groups.values()]
      .map((group) => ({
        campaignId: group.campaignId,
        campaignName: group.campaignName,
        adId: group.adId,
        adName: group.adName,
        imageUrl: imagesByAdId.get(group.adId)?.imageUrl ?? null,
        thumbnailUrl: imagesByAdId.get(group.adId)?.thumbnailUrl ?? null,
        ...enrich(group),
      }))
      .sort((a, b) => b.spendWon - a.spendWon);
    const seoulDate = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Seoul',
    });
    type DayBucket = {
      spendWon: number;
      landingSessions: Set<string>;
      leads: number;
      registrations: number;
    };
    const dayBuckets = new Map<string, DayBucket>();
    const ensureDay = (date: string) => {
      if (!dayBuckets.has(date))
        dayBuckets.set(date, {
          spendWon: 0,
          landingSessions: new Set(),
          leads: 0,
          registrations: 0,
        });
      return dayBuckets.get(date)!;
    };
    for (const item of insights) ensureDay(item.date).spendWon += item.spendWon;
    for (const item of events) {
      if (item.name !== 'view_ad_landing') continue;
      ensureDay(seoulDate.format(item.occurredAt)).landingSessions.add(
        item.sessionId,
      );
    }
    for (const lead of leads) {
      const bucket = ensureDay(seoulDate.format(lead.createdAt));
      bucket.leads += 1;
      if (lead.status === 'REGISTERED') bucket.registrations += 1;
    }
    const daily = Array.from(
      {
        length:
          Math.floor((dates.end.getTime() - dates.start.getTime()) / 86400000) +
          1,
      },
      (_, index) => {
        const date = seoulDate.format(
          new Date(dates.start.getTime() + index * 86400000),
        );
        const bucket = dayBuckets.get(date);
        return {
          date,
          spendWon: bucket?.spendWon ?? 0,
          landingVisits: bucket?.landingSessions.size ?? 0,
          leads: bucket?.leads ?? 0,
          registrations: bucket?.registrations ?? 0,
        };
      },
    );
    return {
      range: { from: dates.from, to: dates.to },
      totals: enrich(totals),
      creatives,
      daily,
      newLeads: leads.filter((lead) => lead.status === 'NEW').length,
      meta: {
        configured: this.metaClient.isConfigured(),
        isRunning: sync?.isRunning ?? false,
        lastSuccessAt: sync?.lastSuccessAt?.toISOString() ?? null,
        lastError: sync?.lastError ?? null,
      },
    };
  }
}
