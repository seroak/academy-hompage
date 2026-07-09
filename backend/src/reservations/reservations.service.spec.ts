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
    parentUser: { findUnique: jest.Mock };
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
      parentUser: { findUnique: jest.fn() },
    };
    notification = {
      sendReservationReceived: jest.fn().mockResolvedValue(undefined),
    };

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
        include: { preferredSlots: true },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('status/age/dayOfWeek 필터를 where 절로 조립한다', async () => {
      prisma.reservation.findMany.mockResolvedValue([]);

      await service.findAll({
        status: 'WAITING',
        age: 5,
        dayOfWeek: 'MON',
      });

      expect(prisma.reservation.findMany).toHaveBeenCalledWith({
        where: {
          status: 'WAITING',
          childAge: 5,
          preferredSlots: { some: { dayOfWeek: 'MON' } },
        },
        include: { preferredSlots: true },
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

      await expect(service.findOne('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    const dto = {
      childName: '민준',
      childAge: 5,
      parentName: '김엄마',
      parentEmail: 'parent@example.com',
      preferredSlots: [
        { dayOfWeek: 'MON', startMinute: 720, endMinute: 790 },
        { dayOfWeek: 'WED', startMinute: 900, endMinute: 970 },
      ],
    };

    it('신청과 여러 후보 시간을 생성하고 접수 이메일을 발송한다', async () => {
      const created = { id: '1', ...dto, status: 'WAITING' };
      prisma.parentUser.findUnique.mockResolvedValue({
        id: 'parent-1',
        name: '김엄마',
        email: 'parent@example.com',
      });
      prisma.reservation.create.mockResolvedValue(created);

      const result = await service.create(dto, 'parent-1');

      expect(result).toBe(created);
      expect(prisma.reservation.create).toHaveBeenCalledWith({
        data: {
          childName: dto.childName,
          childAge: dto.childAge,
          parentName: dto.parentName,
          parentEmail: dto.parentEmail,
          parentUserId: 'parent-1',
          preferredSlots: {
            create: dto.preferredSlots,
          },
        },
        include: { preferredSlots: true },
      });
      expect(notification.sendReservationReceived).toHaveBeenCalledWith(
        created,
      );
    });

    it('학부모 계정이 없으면 NotFoundException을 던진다', async () => {
      prisma.parentUser.findUnique.mockResolvedValue(null);

      await expect(service.create(dto, 'missing-parent')).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.reservation.create).not.toHaveBeenCalled();
    });

    it('requestedGroupId가 함께 전달되면 합류 희망으로 저장한다', async () => {
      const dtoWithRequest = { ...dto, requestedGroupId: 'g1' };
      const created = { id: '1', ...dtoWithRequest, status: 'WAITING' };
      prisma.parentUser.findUnique.mockResolvedValue({
        id: 'parent-1',
        name: '김엄마',
        email: 'parent@example.com',
      });
      prisma.reservation.create.mockResolvedValue(created);

      await service.create(dtoWithRequest, 'parent-1');

      expect(prisma.reservation.create).toHaveBeenCalledWith({
        data: {
          childName: dto.childName,
          childAge: dto.childAge,
          parentName: dto.parentName,
          parentEmail: dto.parentEmail,
          parentUserId: 'parent-1',
          requestedGroupId: 'g1',
          preferredSlots: {
            create: dto.preferredSlots,
          },
        },
        include: { preferredSlots: true },
      });
    });

    it('levelTestResultId가 함께 전달되면 레벨테스트 결과와 연결해 저장한다', async () => {
      const dtoWithLevelTest = { ...dto, levelTestResultId: 'lt-1' };
      const created = { id: '1', ...dtoWithLevelTest, status: 'WAITING' };
      prisma.parentUser.findUnique.mockResolvedValue({
        id: 'parent-1',
        name: '김엄마',
        email: 'parent@example.com',
      });
      prisma.reservation.create.mockResolvedValue(created);

      await service.create(dtoWithLevelTest, 'parent-1');

      expect(prisma.reservation.create).toHaveBeenCalledWith({
        data: {
          childName: dto.childName,
          childAge: dto.childAge,
          parentName: dto.parentName,
          parentEmail: dto.parentEmail,
          parentUserId: 'parent-1',
          levelTestResultId: 'lt-1',
          preferredSlots: {
            create: dto.preferredSlots,
          },
        },
        include: { preferredSlots: true },
      });
    });

    it('후보 시간이 확정된 그룹과 겹쳐도 정상 생성한다', async () => {
      const created = { id: '1', ...dto, status: 'WAITING' };
      prisma.parentUser.findUnique.mockResolvedValue({
        id: 'parent-1',
        name: '김엄마',
        email: 'parent@example.com',
      });
      prisma.reservation.create.mockResolvedValue(created);

      await expect(service.create(dto, 'parent-1')).resolves.toBe(created);
      expect(prisma.reservation.create).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('신청을 수정한다', async () => {
      const updated = { id: '1', status: 'CANCELLED' };
      prisma.reservation.update.mockResolvedValue(updated);

      await expect(service.update('1', { status: 'CANCELLED' })).resolves.toBe(
        updated,
      );
    });

    it('후보 시간이 포함되면 기존 후보 시간을 새 목록으로 교체한다', async () => {
      const updated = {
        id: '1',
        preferredSlots: [
          { dayOfWeek: 'TUE', startMinute: 780, endMinute: 850 },
          { dayOfWeek: 'THU', startMinute: 960, endMinute: 1050 },
        ],
      };
      prisma.reservation.update.mockResolvedValue(updated);

      await expect(
        service.update('1', {
          preferredSlots: [
            { dayOfWeek: 'TUE', startMinute: 780, endMinute: 850 },
            { dayOfWeek: 'THU', startMinute: 960, endMinute: 1050 },
          ],
        }),
      ).resolves.toBe(updated);

      expect(prisma.reservation.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          preferredSlots: {
            deleteMany: {},
            create: [
              { dayOfWeek: 'TUE', startMinute: 780, endMinute: 850 },
              { dayOfWeek: 'THU', startMinute: 960, endMinute: 1050 },
            ],
          },
        },
        include: { preferredSlots: true },
      });
    });

    it('없으면 NotFoundException을 던진다', async () => {
      prisma.reservation.update.mockRejectedValue({ code: 'P2025' });

      await expect(service.update('missing', {})).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createWalkIn', () => {
    const dto = {
      childName: '지훈',
      childAge: 6,
      parentName: '최엄마',
      preferredSlots: [{ dayOfWeek: 'MON', startMinute: 720, endMinute: 730 }],
    };

    it('학부모 계정 없이 신청을 생성하고 접수 이메일은 보내지 않는다', async () => {
      const created = { id: '1', ...dto, parentEmail: '', status: 'WAITING' };
      prisma.reservation.create.mockResolvedValue(created);

      const result = await service.createWalkIn(dto);

      expect(result).toBe(created);
      expect(prisma.reservation.create).toHaveBeenCalledWith({
        data: {
          childName: dto.childName,
          childAge: dto.childAge,
          parentName: dto.parentName,
          parentEmail: '',
          preferredSlots: { create: dto.preferredSlots },
        },
        include: { preferredSlots: true },
      });
      expect(notification.sendReservationReceived).not.toHaveBeenCalled();
      expect(prisma.parentUser.findUnique).not.toHaveBeenCalled();
    });

    it('이메일이 주어지면 그대로 저장한다', async () => {
      const dtoWithEmail = { ...dto, parentEmail: 'walkin@example.com' };
      const created = { id: '2', ...dtoWithEmail, status: 'WAITING' };
      prisma.reservation.create.mockResolvedValue(created);

      await service.createWalkIn(dtoWithEmail);

      expect(prisma.reservation.create).toHaveBeenCalledWith({
        data: {
          childName: dto.childName,
          childAge: dto.childAge,
          parentName: dto.parentName,
          parentEmail: 'walkin@example.com',
          preferredSlots: { create: dto.preferredSlots },
        },
        include: { preferredSlots: true },
      });
    });
  });

  describe('remove', () => {
    it('신청을 삭제한다', async () => {
      prisma.reservation.delete.mockResolvedValue({ id: '1' });

      await service.remove('1');

      expect(prisma.reservation.delete).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });

    it('없으면 NotFoundException을 던진다', async () => {
      prisma.reservation.delete.mockRejectedValue({ code: 'P2025' });

      await expect(service.remove('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
