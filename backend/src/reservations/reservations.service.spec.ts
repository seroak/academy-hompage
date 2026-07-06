import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notifications/notification.service';

describe('ReservationsService', () => {
  let service: ReservationsService;
  let prisma: {
    reservation: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };
  let notification: { sendReservationReceived: jest.Mock };

  beforeEach(async () => {
    prisma = {
      reservation: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };
    notification = { sendReservationReceived: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReservationsService,
        { provide: PrismaService, useValue: prisma },
        { provide: NotificationService, useValue: notification },
      ],
    }).compile();

    service = module.get<ReservationsService>(ReservationsService);
  });

  describe('findAll', () => {
    it('필터 없이 전체 목록을 최신순으로 반환한다', async () => {
      const reservations = [{ id: '1' }];
      prisma.reservation.findMany.mockResolvedValue(reservations);

      const result = await service.findAll({});

      expect(result).toBe(reservations);
      expect(prisma.reservation.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { createdAt: 'desc' },
      });
    });

    it('status/age/dayOfWeek/hour 필터를 where 절로 조립한다', async () => {
      prisma.reservation.findMany.mockResolvedValue([]);

      await service.findAll({
        status: 'WAITING',
        age: 5,
        dayOfWeek: 'MON',
        hour: 12,
      });

      expect(prisma.reservation.findMany).toHaveBeenCalledWith({
        where: {
          status: 'WAITING',
          childAge: 5,
          preferredDayOfWeek: 'MON',
          preferredHour: 12,
        },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('findOne', () => {
    it('존재하면 반환한다', async () => {
      const reservation = { id: '1' };
      prisma.reservation.findUnique.mockResolvedValue(reservation);

      await expect(service.findOne('1')).resolves.toBe(reservation);
    });

    it('없으면 NotFoundException을 던진다', async () => {
      prisma.reservation.findUnique.mockResolvedValue(null);

      await expect(service.findOne('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    const dto = {
      childName: '민준',
      childAge: 5,
      parentName: '김엄마',
      parentEmail: 'parent@example.com',
      preferredDayOfWeek: 'MON',
      preferredHour: 12,
    };

    it('신청을 생성하고 접수 이메일을 발송한다', async () => {
      const created = { id: '1', ...dto, status: 'WAITING' };
      prisma.reservation.create.mockResolvedValue(created);

      const result = await service.create(dto);

      expect(result).toBe(created);
      expect(prisma.reservation.create).toHaveBeenCalledWith({ data: dto });
      expect(notification.sendReservationReceived).toHaveBeenCalledWith(created);
    });
  });

  describe('update', () => {
    it('신청을 수정한다', async () => {
      const updated = { id: '1', status: 'CANCELLED' };
      prisma.reservation.update.mockResolvedValue(updated);

      await expect(service.update('1', { status: 'CANCELLED' })).resolves.toBe(updated);
    });

    it('없으면 NotFoundException을 던진다', async () => {
      prisma.reservation.update.mockRejectedValue({ code: 'P2025' });

      await expect(service.update('missing', {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('신청을 삭제한다', async () => {
      prisma.reservation.delete.mockResolvedValue({ id: '1' });

      await service.remove('1');

      expect(prisma.reservation.delete).toHaveBeenCalledWith({ where: { id: '1' } });
    });

    it('없으면 NotFoundException을 던진다', async () => {
      prisma.reservation.delete.mockRejectedValue({ code: 'P2025' });

      await expect(service.remove('missing')).rejects.toThrow(NotFoundException);
    });
  });
});
