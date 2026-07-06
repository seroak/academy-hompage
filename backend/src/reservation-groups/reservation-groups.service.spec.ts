import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { ReservationGroupsService } from './reservation-groups.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notifications/notification.service';

describe('ReservationGroupsService', () => {
  let service: ReservationGroupsService;
  let prisma: {
    reservation: { findMany: jest.Mock; updateMany: jest.Mock };
    reservationGroup: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    $transaction: jest.Mock;
  };
  let notification: { sendGroupConfirmed: jest.Mock };

  beforeEach(async () => {
    prisma = {
      reservation: {
        findMany: jest.fn(),
        updateMany: jest.fn(),
      },
      reservationGroup: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      $transaction: jest.fn(async (callback: (tx: unknown) => unknown) => callback(prisma)),
    };
    notification = { sendGroupConfirmed: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReservationGroupsService,
        { provide: PrismaService, useValue: prisma },
        { provide: NotificationService, useValue: notification },
      ],
    }).compile();

    service = module.get<ReservationGroupsService>(ReservationGroupsService);
  });

  describe('create', () => {
    const dto = {
      label: '월수금 12시반',
      dayOfWeek: 'MON',
      hour: 12,
      reservationIds: ['r1', 'r2'],
    };
    const waitingReservations = [
      { id: 'r1', status: 'WAITING', childName: '민준', parentName: '김엄마', parentEmail: 'a@example.com' },
      { id: 'r2', status: 'WAITING', childName: '서연', parentName: '이엄마', parentEmail: 'b@example.com' },
    ];

    it('그룹을 생성하고 신청들을 GROUPED로 전환한 뒤 확정 이메일을 발송한다', async () => {
      prisma.reservation.findMany.mockResolvedValue(waitingReservations);
      const createdGroup = { id: 'g1', label: dto.label, dayOfWeek: dto.dayOfWeek, hour: dto.hour, status: 'CONFIRMED' };
      prisma.reservationGroup.create.mockResolvedValue(createdGroup);
      prisma.reservation.updateMany.mockResolvedValue({ count: 2 });

      const result = await service.create(dto);

      expect(result).toBe(createdGroup);
      expect(prisma.reservationGroup.create).toHaveBeenCalledWith({
        data: { label: dto.label, dayOfWeek: dto.dayOfWeek, hour: dto.hour },
      });
      expect(prisma.reservation.updateMany).toHaveBeenCalledWith({
        where: { id: { in: dto.reservationIds } },
        data: { status: 'GROUPED', groupId: 'g1' },
      });
      expect(notification.sendGroupConfirmed).toHaveBeenCalledTimes(2);
      expect(notification.sendGroupConfirmed).toHaveBeenCalledWith(waitingReservations[0], createdGroup);
      expect(notification.sendGroupConfirmed).toHaveBeenCalledWith(waitingReservations[1], createdGroup);
    });

    it('reservationIds 중 존재하지 않는 것이 있으면 ConflictException을 던진다', async () => {
      prisma.reservation.findMany.mockResolvedValue([waitingReservations[0]]);

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
      expect(prisma.reservationGroup.create).not.toHaveBeenCalled();
    });

    it('WAITING이 아닌 신청이 포함되어 있으면 ConflictException을 던진다', async () => {
      prisma.reservation.findMany.mockResolvedValue([
        waitingReservations[0],
        { ...waitingReservations[1], status: 'GROUPED' },
      ]);

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
      expect(prisma.reservationGroup.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('그룹 목록을 신청 포함해 반환한다', async () => {
      const groups = [{ id: 'g1', reservations: [] }];
      prisma.reservationGroup.findMany.mockResolvedValue(groups);

      const result = await service.findAll();

      expect(result).toBe(groups);
      expect(prisma.reservationGroup.findMany).toHaveBeenCalledWith({
        include: { reservations: true },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('findOne', () => {
    it('존재하면 반환한다', async () => {
      const group = { id: 'g1' };
      prisma.reservationGroup.findUnique.mockResolvedValue(group);

      await expect(service.findOne('g1')).resolves.toBe(group);
    });

    it('없으면 NotFoundException을 던진다', async () => {
      prisma.reservationGroup.findUnique.mockResolvedValue(null);

      await expect(service.findOne('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('그룹 정보를 수정한다', async () => {
      const updated = { id: 'g1', label: '변경됨' };
      prisma.reservationGroup.update.mockResolvedValue(updated);

      await expect(service.update('g1', { label: '변경됨' })).resolves.toBe(updated);
    });

    it('없으면 NotFoundException을 던진다', async () => {
      prisma.reservationGroup.update.mockRejectedValue({ code: 'P2025' });

      await expect(service.update('missing', {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('그룹을 취소하고 소속 신청을 WAITING으로 되돌린다', async () => {
      prisma.reservation.updateMany.mockResolvedValue({ count: 2 });
      prisma.reservationGroup.delete.mockResolvedValue({ id: 'g1' });

      await service.remove('g1');

      expect(prisma.reservation.updateMany).toHaveBeenCalledWith({
        where: { groupId: 'g1' },
        data: { groupId: null, status: 'WAITING' },
      });
      expect(prisma.reservationGroup.delete).toHaveBeenCalledWith({ where: { id: 'g1' } });
    });

    it('없으면 NotFoundException을 던진다', async () => {
      prisma.reservation.updateMany.mockResolvedValue({ count: 0 });
      prisma.reservationGroup.delete.mockRejectedValue({ code: 'P2025' });

      await expect(service.remove('missing')).rejects.toThrow(NotFoundException);
    });
  });
});
