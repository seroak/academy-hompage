import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { NotFoundException } from '@nestjs/common';
import { LeadsService } from './leads.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { TurnstileVerifier } from './turnstile-verifier.service.js';
import { LeadRateLimiter } from './lead-rate-limiter.service.js';

describe('LeadsService', () => {
  let service: LeadsService;
  let prisma: {
    lead: {
      findFirst: jest.Mock;
      create: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
      groupBy: jest.Mock;
      update: jest.Mock;
    };
  };
  let verifier: { verify: jest.Mock };
  let limiter: { consume: jest.Mock };

  const input = {
    guardianName: '김보호',
    phone: '010-1234-5678',
    childAge: 7,
    contactWindow: 'H15_16' as const,
    privacyConsent: true as const,
    privacyConsentVersion: '2026-07-15',
    turnstileToken: 'token',
    landingPath: '/lp/heungdeok-math',
    analyticsConsent: true,
    marketingConsent: true,
  };

  beforeEach(async () => {
    prisma = {
      lead: {
        findFirst: jest.fn(),
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        groupBy: jest.fn(),
        update: jest.fn(),
      },
    };
    verifier = { verify: jest.fn().mockResolvedValue(true) };
    limiter = { consume: jest.fn().mockReturnValue(true) };
    const module = await Test.createTestingModule({
      providers: [
        LeadsService,
        { provide: PrismaService, useValue: prisma },
        { provide: TurnstileVerifier, useValue: verifier },
        { provide: LeadRateLimiter, useValue: limiter },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((_key: string, fallback: unknown) => fallback),
          },
        },
      ],
    }).compile();
    service = module.get(LeadsService);
  });

  it('전화번호를 정규화하고 동의 시각과 유입 정보를 저장한다', async () => {
    prisma.lead.findFirst.mockResolvedValue(null);
    let createArg: { data: Record<string, unknown> } | undefined;
    prisma.lead.create.mockImplementation(
      (arg: { data: Record<string, unknown> }) => {
        createArg = arg;
        return Promise.resolve({ id: 'lead-1' });
      },
    );

    await expect(service.submit(input, '203.0.113.10')).resolves.toEqual({
      accepted: true,
    });

    expect(verifier.verify).toHaveBeenCalledWith('token', '203.0.113.10');
    expect(prisma.lead.create).toHaveBeenCalledTimes(1);
    if (!createArg) throw new Error('create was not called');
    expect(createArg.data).toMatchObject({
      guardianName: '김보호',
      phone: '01012345678',
      landingPath: '/lp/heungdeok-math',
    });
    expect(createArg.data.privacyConsentAt).toBeInstanceOf(Date);
  });

  it('30일 이내 같은 전화번호는 새로 저장하지 않지만 accepted를 반환한다', async () => {
    let findFirstArg:
      | {
          where: { phone: string; createdAt: { gte: unknown } };
          select: { id: boolean };
        }
      | undefined;
    prisma.lead.findFirst.mockImplementation(
      (arg: {
        where: { phone: string; createdAt: { gte: unknown } };
        select: { id: boolean };
      }) => {
        findFirstArg = arg;
        return Promise.resolve({ id: 'existing' });
      },
    );

    await expect(service.submit(input, '203.0.113.10')).resolves.toEqual({
      accepted: true,
    });

    expect(prisma.lead.findFirst).toHaveBeenCalledTimes(1);
    if (!findFirstArg) throw new Error('findFirst was not called');
    expect(findFirstArg.where.phone).toBe('01012345678');
    expect(findFirstArg.where.createdAt.gte).toBeInstanceOf(Date);
    expect(findFirstArg.select).toEqual({ id: true });
    expect(prisma.lead.create).not.toHaveBeenCalled();
  });

  it.each(['verification', 'rate-limit'])(
    '%s 실패를 노출하지 않고 accepted를 반환한다',
    async (failure) => {
      if (failure === 'verification') verifier.verify.mockResolvedValue(false);
      else limiter.consume.mockReturnValue(false);

      await expect(service.submit(input, '203.0.113.10')).resolves.toEqual({
        accepted: true,
      });
      expect(prisma.lead.create).not.toHaveBeenCalled();
    },
  );

  it('필터를 적용해 생성일 역순 페이지를 반환한다', async () => {
    let findManyArg:
      | {
          orderBy: { createdAt: string };
          skip: number;
          take: number;
          where: Record<string, unknown>;
        }
      | undefined;
    prisma.lead.findMany.mockImplementation(
      (arg: {
        orderBy: { createdAt: string };
        skip: number;
        take: number;
        where: Record<string, unknown>;
      }) => {
        findManyArg = arg;
        return Promise.resolve([{ id: 'lead-1' }]);
      },
    );
    prisma.lead.count.mockResolvedValue(21);

    const result = await service.findAll({
      status: 'NEW',
      campaign: 'summer',
      content: 'video-a',
      from: '2026-07-01',
      to: '2026-07-15',
      page: 2,
      pageSize: 10,
    });

    expect(result).toEqual({
      items: [{ id: 'lead-1' }],
      page: 2,
      pageSize: 10,
      total: 21,
      totalPages: 3,
    });
    expect(prisma.lead.findMany).toHaveBeenCalledTimes(1);
    if (!findManyArg) throw new Error('findMany was not called');
    expect(findManyArg).toMatchObject({
      orderBy: { createdAt: 'desc' },
      skip: 10,
      take: 10,
    });
    expect(findManyArg.where).toMatchObject({
      status: 'NEW',
      utmCampaign: 'summer',
      utmContent: 'video-a',
    });
  });

  it('제외 상태를 빼고 퍼널 단계별 수와 비율을 계산한다', async () => {
    prisma.lead.groupBy.mockResolvedValue([
      { status: 'NEW', _count: { _all: 4 } },
      { status: 'CONTACTED', _count: { _all: 3 } },
      { status: 'CONSULTATION_BOOKED', _count: { _all: 2 } },
      { status: 'VISITED', _count: { _all: 1 } },
      { status: 'REGISTERED', _count: { _all: 1 } },
      { status: 'NO_RESPONSE', _count: { _all: 9 } },
    ]);

    await expect(service.summary({ campaign: 'summer' })).resolves.toEqual({
      total: 11,
      valid: 7,
      booking: 4,
      visited: 2,
      registered: 1,
      validRate: 63.64,
      bookingRate: 57.14,
      visitRate: 50,
      registrationRate: 50,
    });
  });

  it('리드 상태와 관리자 메모를 수정한다', async () => {
    prisma.lead.update.mockResolvedValue({ id: 'lead-1', status: 'CONTACTED' });
    await service.update('lead-1', {
      status: 'CONTACTED',
      adminNote: '통화 완료',
    });
    expect(prisma.lead.update).toHaveBeenCalledWith({
      where: { id: 'lead-1' },
      data: { status: 'CONTACTED', adminNote: '통화 완료' },
    });
  });

  it('없는 리드 수정은 404로 변환한다', async () => {
    prisma.lead.update.mockRejectedValue({ code: 'P2025' });
    await expect(
      service.update('missing', { status: 'CONTACTED' }),
    ).rejects.toThrow(NotFoundException);
  });
});
