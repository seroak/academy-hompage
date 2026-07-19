import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { isPrismaNotFoundError } from '../common/prisma-errors.js';
import { CreateLeadDto } from './dto/create-lead.dto.js';
import { QueryLeadSummaryDto, QueryLeadsDto } from './dto/query-leads.dto.js';
import { UpdateLeadDto } from './dto/update-lead.dto.js';
import { LeadRateLimiter } from './lead-rate-limiter.service.js';
import { TurnstileVerifier } from './turnstile-verifier.service.js';

const VALID_STATUSES = [
  'CONTACTED',
  'CONSULTATION_BOOKED',
  'VISITED',
  'REGISTERED',
] as const;
const BOOKING_STATUSES = [
  'CONSULTATION_BOOKED',
  'VISITED',
  'REGISTERED',
] as const;
const VISITED_STATUSES = ['VISITED', 'REGISTERED'] as const;
const INCLUDED_STATUSES = ['NEW', ...VALID_STATUSES] as const;

@Injectable()
export class LeadsService {
  private readonly logger = new Logger(LeadsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly verifier: TurnstileVerifier,
    private readonly rateLimiter: LeadRateLimiter,
    private readonly config: ConfigService,
  ) {}

  async submit(input: CreateLeadDto, ip: string): Promise<{ accepted: true }> {
    if (!this.rateLimiter.consume(ip)) {
      this.logger.warn(`레이트리밋 초과로 리드 제출을 무시했습니다. ip=${ip}`);
      return { accepted: true };
    }

    try {
      if (!(await this.verifier.verify(input.turnstileToken, ip))) {
        this.logger.warn(`Turnstile 검증 실패로 리드 제출을 저장하지 않았습니다. ip=${ip}`);
        return { accepted: true };
      }

      const phone = input.phone.replace(/\D/g, '');
      const dedupDays = this.positiveInteger('LEAD_DEDUP_DAYS', 30);
      const duplicateSince = new Date(
        Date.now() - dedupDays * 24 * 60 * 60 * 1000,
      );
      const duplicate = await this.prisma.lead.findFirst({
        where: { phone, createdAt: { gte: duplicateSince } },
        select: { id: true },
      });
      if (duplicate) {
        this.logger.warn(
          `${dedupDays}일 이내 중복 전화번호로 리드 제출을 저장하지 않았습니다. ip=${ip}`,
        );
        return { accepted: true };
      }

      await this.prisma.lead.create({
        data: {
          guardianName: input.guardianName,
          phone,
          childAge: input.childAge,
          contactWindow: input.contactWindow,
          utmSource: input.utmSource,
          utmMedium: input.utmMedium,
          utmCampaign: input.utmCampaign,
          utmContent: input.utmContent,
          utmTerm: input.utmTerm,
          fbclid: input.fbclid,
          landingPath: input.landingPath,
          referrer: input.referrer,
          privacyConsentVersion: input.privacyConsentVersion,
          privacyConsentAt: new Date(),
          analyticsConsent: input.analyticsConsent,
          marketingConsent: input.marketingConsent,
        },
      });
    } catch (error) {
      this.logger.error(
        '리드 제출 처리 실패',
        error instanceof Error ? error.stack : undefined,
      );
    }

    return { accepted: true };
  }

  async findAll(query: QueryLeadsDto) {
    const where = this.buildFilter(query);
    const [items, total] = await Promise.all([
      this.prisma.lead.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.lead.count({ where }),
    ]);

    return {
      items,
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.ceil(total / query.pageSize),
    };
  }

  async summary(query: QueryLeadSummaryDto) {
    const where = this.buildFilter(query);
    const grouped = await this.prisma.lead.groupBy({
      by: ['status'],
      where,
      _count: { _all: true },
    });
    const counts = new Map(
      grouped.map((item) => [item.status, item._count._all]),
    );
    const count = (statuses: readonly string[]) =>
      statuses.reduce(
        (sum, status) => sum + (counts.get(status as never) ?? 0),
        0,
      );

    const total = count(INCLUDED_STATUSES);
    const valid = count(VALID_STATUSES);
    const booking = count(BOOKING_STATUSES);
    const visited = count(VISITED_STATUSES);
    const registered = counts.get('REGISTERED') ?? 0;

    return {
      total,
      valid,
      booking,
      visited,
      registered,
      validRate: this.percentage(valid, total),
      bookingRate: this.percentage(booking, valid),
      visitRate: this.percentage(visited, booking),
      registrationRate: this.percentage(registered, visited),
    };
  }

  async update(id: string, input: UpdateLeadDto) {
    try {
      return await this.prisma.lead.update({
        where: { id },
        data: { status: input.status, adminNote: input.adminNote },
      });
    } catch (error) {
      if (isPrismaNotFoundError(error))
        throw new NotFoundException(`Lead ${id} not found`);
      throw error;
    }
  }

  async remove(id: string) {
    try {
      await this.prisma.lead.delete({ where: { id } });
    } catch (error) {
      if (isPrismaNotFoundError(error))
        throw new NotFoundException(`Lead ${id} not found`);
      throw error;
    }
  }

  private buildFilter(
    query: QueryLeadSummaryDto & { status?: QueryLeadsDto['status'] },
  ): Prisma.LeadWhereInput {
    const createdAt: Prisma.DateTimeFilter = {};
    if (query.from) createdAt.gte = new Date(`${query.from}T00:00:00.000Z`);
    if (query.to) createdAt.lte = new Date(`${query.to}T23:59:59.999Z`);

    return {
      status: query.status,
      utmCampaign: query.campaign,
      utmContent: query.content,
      createdAt: Object.keys(createdAt).length > 0 ? createdAt : undefined,
    };
  }

  private positiveInteger(key: string, fallback: number): number {
    const raw = Number(this.config.get<string | number>(key, fallback));
    return Number.isInteger(raw) && raw > 0 ? raw : fallback;
  }

  private percentage(numerator: number, denominator: number): number {
    if (denominator === 0) return 0;
    return Math.round((numerator / denominator) * 10_000) / 100;
  }
}
