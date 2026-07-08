import { Test, TestingModule } from '@nestjs/testing';
import { MembersService } from './members.service';
import { PrismaService } from '../prisma/prisma.service';

describe('MembersService', () => {
  let service: MembersService;
  let prisma: {
    parentUser: { findMany: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      parentUser: { findMany: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [MembersService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<MembersService>(MembersService);
  });

  describe('findAll', () => {
    it('가입일 최신순으로 조회하고 소셜 계정/신청 내역을 함께 include한다', async () => {
      prisma.parentUser.findMany.mockResolvedValue([]);

      await service.findAll();

      expect(prisma.parentUser.findMany).toHaveBeenCalledWith({
        include: {
          socialAccounts: { select: { provider: true } },
          reservations: {
            include: { preferredSlots: true },
            orderBy: { createdAt: 'desc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('passwordHash를 노출하지 않고 hasPassword로 변환한다', async () => {
      prisma.parentUser.findMany.mockResolvedValue([
        {
          id: 'p1',
          name: '김엄마',
          email: 'mom@example.com',
          passwordHash: 'hashed-secret',
          createdAt: new Date('2026-01-01'),
          socialAccounts: [],
          reservations: [],
        },
      ]);

      const result = await service.findAll();

      expect(result).toEqual([
        {
          id: 'p1',
          name: '김엄마',
          email: 'mom@example.com',
          createdAt: new Date('2026-01-01'),
          hasPassword: true,
          socialProviders: [],
          reservations: [],
        },
      ]);
      expect(JSON.stringify(result)).not.toContain('hashed-secret');
    });

    it('소셜 계정만 있고 비밀번호가 없으면 hasPassword는 false, socialProviders는 provider 배열이다', async () => {
      prisma.parentUser.findMany.mockResolvedValue([
        {
          id: 'p2',
          name: '박엄마',
          email: 'park@example.com',
          passwordHash: null,
          createdAt: new Date('2026-01-02'),
          socialAccounts: [{ provider: 'KAKAO' }],
          reservations: [{ id: 'r1', childName: '민준', childAge: 5 }],
        },
      ]);

      const result = await service.findAll();

      expect(result[0]).toEqual({
        id: 'p2',
        name: '박엄마',
        email: 'park@example.com',
        createdAt: new Date('2026-01-02'),
        hasPassword: false,
        socialProviders: ['KAKAO'],
        reservations: [{ id: 'r1', childName: '민준', childAge: 5 }],
      });
    });
  });
});
