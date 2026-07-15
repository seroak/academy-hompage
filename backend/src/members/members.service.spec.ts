import { Test, TestingModule } from '@nestjs/testing';
import { MembersService } from './members.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

describe('MembersService', () => {
  let service: MembersService;
  let prisma: {
    parentUser: { findMany: jest.Mock };
    $transaction: jest.Mock;
  };
  let tx: {
    reservation: { findMany: jest.Mock; count: jest.Mock; deleteMany: jest.Mock };
    reservationGroupSlot: { updateMany: jest.Mock };
    reservationGroup: { update: jest.Mock };
    parentSocialAccount: { deleteMany: jest.Mock };
    parentAuthSession: { deleteMany: jest.Mock };
    parentUser: { delete: jest.Mock };
  };

  beforeEach(async () => {
    tx = {
      reservation: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn(),
        deleteMany: jest.fn(),
      },
      reservationGroupSlot: { updateMany: jest.fn() },
      reservationGroup: { update: jest.fn() },
      parentSocialAccount: { deleteMany: jest.fn() },
      parentAuthSession: { deleteMany: jest.fn() },
      parentUser: { delete: jest.fn() },
    };
    prisma = {
      parentUser: { findMany: jest.fn() },
      $transaction: jest.fn((callback: (tx: unknown) => unknown) => callback(tx)),
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

  describe('remove', () => {
    it('그룹에 속한 신청이 없으면 신청/소셜계정/인증세션과 회원을 삭제한다', async () => {
      tx.reservation.findMany.mockResolvedValue([]);

      await service.remove('p1');

      expect(tx.reservation.findMany).toHaveBeenCalledWith({
        where: { parentUserId: 'p1', groupId: { not: null } },
        select: { id: true, groupId: true },
      });
      expect(tx.reservationGroupSlot.updateMany).not.toHaveBeenCalled();
      expect(tx.reservationGroup.update).not.toHaveBeenCalled();
      expect(tx.reservation.deleteMany).toHaveBeenCalledWith({
        where: { parentUserId: 'p1' },
      });
      expect(tx.parentSocialAccount.deleteMany).toHaveBeenCalledWith({
        where: { parentUserId: 'p1' },
      });
      expect(tx.parentAuthSession.deleteMany).toHaveBeenCalledWith({
        where: { parentUserId: 'p1' },
      });
      expect(tx.parentUser.delete).toHaveBeenCalledWith({ where: { id: 'p1' } });
    });

    it('그룹에 다른 멤버가 남아있으면 슬롯과 그룹 상태를 건드리지 않는다', async () => {
      tx.reservation.findMany.mockResolvedValue([{ id: 'r1', groupId: 'g1' }]);
      tx.reservation.count.mockResolvedValue(2);

      await service.remove('p1');

      expect(tx.reservation.count).toHaveBeenCalledWith({
        where: { groupId: 'g1', id: { notIn: ['r1'] } },
      });
      expect(tx.reservationGroupSlot.updateMany).not.toHaveBeenCalled();
      expect(tx.reservationGroup.update).not.toHaveBeenCalled();
    });

    it('그룹의 마지막 멤버라면 슬롯을 anchor로 남기고 그룹을 EMPTY로 전환한다', async () => {
      tx.reservation.findMany.mockResolvedValue([{ id: 'r1', groupId: 'g1' }]);
      tx.reservation.count.mockResolvedValue(0);

      await service.remove('p1');

      expect(tx.reservationGroupSlot.updateMany).toHaveBeenCalledWith({
        where: { groupId: 'g1', reservationId: { in: ['r1'] } },
        data: { reservationId: null },
      });
      expect(tx.reservationGroup.update).toHaveBeenCalledWith({
        where: { id: 'g1' },
        data: { status: 'EMPTY' },
      });
    });

    it('존재하지 않는 회원이면 NotFoundException을 던진다', async () => {
      tx.reservation.findMany.mockResolvedValue([]);
      tx.parentUser.delete.mockRejectedValue({ code: 'P2025' });

      await expect(service.remove('missing')).rejects.toThrow('ParentUser missing not found');
    });
  });
});
