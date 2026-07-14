import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AdminNotificationsService } from './admin-notifications.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { NotificationService } from '../notifications/notification.service.js';

describe('AdminNotificationsService', () => {
  let service: AdminNotificationsService;
  let prisma: {
    adminNotification: {
      create: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
      update: jest.Mock;
      updateMany: jest.Mock;
    };
  };
  let notification: { sendAdminReservationReceived: jest.Mock };

  beforeEach(async () => {
    prisma = {
      adminNotification: {
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
    };
    notification = {
      sendAdminReservationReceived: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminNotificationsService,
        { provide: PrismaService, useValue: prisma },
        { provide: NotificationService, useValue: notification },
      ],
    }).compile();

    service = module.get<AdminNotificationsService>(AdminNotificationsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('notifyReservationCreated', () => {
    const reservation = {
      id: 'r1',
      childName: '민준',
      childAge: 5,
      parentName: '김엄마',
      parentEmail: 'parent@example.com',
      parentPhone: '010-1234-5678',
      preferredSlots: [{ dayOfWeek: 'MON', startMinute: 720, endMinute: 790 }],
    };

    it('신규 신청 인앱 알림을 생성하고 관리자 이메일을 발송한다', async () => {
      prisma.adminNotification.create.mockResolvedValue({ id: 'n1' });

      await service.notifyReservationCreated(reservation);

      expect(prisma.adminNotification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: 'RESERVATION_CREATED',
          reservationId: 'r1',
          title: expect.stringContaining('민준'),
        }),
      });
      expect(notification.sendAdminReservationReceived).toHaveBeenCalledWith(reservation);
    });

    it('DB 저장이나 이메일 발송이 실패해도 예외를 삼키고 신청 흐름을 막지 않는다', async () => {
      prisma.adminNotification.create.mockRejectedValue(new Error('db down'));

      await expect(service.notifyReservationCreated(reservation)).resolves.not.toThrow();
    });

    it('이메일 발송이 실패해도 예외를 삼킨다', async () => {
      prisma.adminNotification.create.mockResolvedValue({ id: 'n1' });
      notification.sendAdminReservationReceived.mockRejectedValue(new Error('smtp down'));

      await expect(service.notifyReservationCreated(reservation)).resolves.not.toThrow();
    });
  });

  describe('findAll', () => {
    it('생성일 최신순으로 전체 알림을 반환한다', async () => {
      const notifications = [{ id: 'n1' }];
      prisma.adminNotification.findMany.mockResolvedValue(notifications);

      const result = await service.findAll();

      expect(result).toBe(notifications);
      expect(prisma.adminNotification.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('unreadCount', () => {
    it('읽지 않은 알림 개수를 반환한다', async () => {
      prisma.adminNotification.count.mockResolvedValue(3);

      const result = await service.unreadCount();

      expect(result).toEqual({ count: 3 });
      expect(prisma.adminNotification.count).toHaveBeenCalledWith({
        where: { readAt: null },
      });
    });
  });

  describe('markRead', () => {
    it('알림을 읽음 처리한다', async () => {
      const updated = { id: 'n1', readAt: new Date() };
      prisma.adminNotification.update.mockResolvedValue(updated);

      await expect(service.markRead('n1')).resolves.toBe(updated);
      expect(prisma.adminNotification.update).toHaveBeenCalledWith({
        where: { id: 'n1' },
        data: { readAt: expect.any(Date) },
      });
    });

    it('없으면 NotFoundException을 던진다', async () => {
      prisma.adminNotification.update.mockRejectedValue({ code: 'P2025' });

      await expect(service.markRead('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('markAllRead', () => {
    it('읽지 않은 모든 알림을 읽음 처리한다', async () => {
      prisma.adminNotification.updateMany.mockResolvedValue({ count: 2 });

      await service.markAllRead();

      expect(prisma.adminNotification.updateMany).toHaveBeenCalledWith({
        where: { readAt: null },
        data: { readAt: expect.any(Date) },
      });
    });
  });
});
