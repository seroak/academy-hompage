import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { ReservationsService } from './reservations.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { NotificationService } from '../notifications/notification.service.js';

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
    child: { findFirst: jest.Mock };
  };
  let notification: { sendReservationReceived: jest.Mock };

  beforeEach(async () => {
    prisma = {
      reservation: {
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      parentUser: { findUnique: jest.fn() },
      child: { findFirst: jest.fn() },
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
      childId: 'child-1',
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
      prisma.child.findFirst.mockResolvedValue({ id: 'child-1', parentUserId: 'parent-1', name: '민준', age: 5 });
      prisma.reservation.create.mockResolvedValue(created);

      const result = await service.create(dto, 'parent-1');

      expect(result).toBe(created);
      expect(prisma.reservation.create).toHaveBeenCalledWith({
        data: {
          childName: dto.childName,
          childAge: dto.childAge,
          childId: 'child-1',
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

    it('다른 보호자의 자녀이거나 이름/나이가 일치하지 않으면 생성하지 않는다', async () => {
      prisma.parentUser.findUnique.mockResolvedValue({ id: 'parent-1' });
      prisma.child.findFirst.mockResolvedValue(null);

      await expect(service.create(dto, 'parent-1')).rejects.toThrow(NotFoundException);
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
      prisma.child.findFirst.mockResolvedValue({ id: 'child-1', parentUserId: 'parent-1', name: '민준', age: 5 });
      prisma.reservation.create.mockResolvedValue(created);

      await service.create(dtoWithRequest, 'parent-1');

      expect(prisma.reservation.create).toHaveBeenCalledWith({
        data: {
          childName: dto.childName,
          childAge: dto.childAge,
          childId: 'child-1',
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

    it('후보 시간이 확정된 그룹과 겹쳐도 정상 생성한다', async () => {
      const created = { id: '1', ...dto, status: 'WAITING' };
      prisma.parentUser.findUnique.mockResolvedValue({
        id: 'parent-1',
        name: '김엄마',
        email: 'parent@example.com',
      });
      prisma.child.findFirst.mockResolvedValue({ id: 'child-1', parentUserId: 'parent-1', name: '민준', age: 5 });
      prisma.reservation.create.mockResolvedValue(created);

      await expect(service.create(dto, 'parent-1')).resolves.toBe(created);
      expect(prisma.reservation.create).toHaveBeenCalled();
    });

    it('같은 자녀가 같은 요일·시간대에 겹치는 신청이 이미 있으면 ConflictException을 던지고 생성하지 않는다', async () => {
      prisma.parentUser.findUnique.mockResolvedValue({
        id: 'parent-1',
        name: '김엄마',
        email: 'parent@example.com',
      });
      prisma.child.findFirst.mockResolvedValue({ id: 'child-1', parentUserId: 'parent-1', name: '민준', age: 5 });
      prisma.reservation.findMany.mockResolvedValue([
        {
          id: 'existing-1',
          childId: 'child-1',
          status: 'WAITING',
          preferredSlots: [{ dayOfWeek: 'MON', startMinute: 750, endMinute: 800 }],
        },
      ]);

      await expect(service.create(dto, 'parent-1')).rejects.toThrow(ConflictException);
      expect(prisma.reservation.create).not.toHaveBeenCalled();
    });

    it('같은 자녀의 기존 신청이 있어도 시간이 겹치지 않으면 정상 생성한다', async () => {
      const created = { id: '1', ...dto, status: 'WAITING' };
      prisma.parentUser.findUnique.mockResolvedValue({
        id: 'parent-1',
        name: '김엄마',
        email: 'parent@example.com',
      });
      prisma.child.findFirst.mockResolvedValue({ id: 'child-1', parentUserId: 'parent-1', name: '민준', age: 5 });
      prisma.reservation.findMany.mockResolvedValue([
        {
          id: 'existing-1',
          childId: 'child-1',
          status: 'WAITING',
          preferredSlots: [{ dayOfWeek: 'TUE', startMinute: 780, endMinute: 850 }],
        },
      ]);
      prisma.reservation.create.mockResolvedValue(created);

      await expect(service.create(dto, 'parent-1')).resolves.toBe(created);
      expect(prisma.reservation.create).toHaveBeenCalled();
    });

    it('중복 조회는 childId와 취소 제외 조건으로 범위를 좁힌다(다른 자녀는 이 조건에서 자동 제외됨)', async () => {
      const created = { id: '1', ...dto, status: 'WAITING' };
      prisma.parentUser.findUnique.mockResolvedValue({
        id: 'parent-1',
        name: '김엄마',
        email: 'parent@example.com',
      });
      prisma.child.findFirst.mockResolvedValue({ id: 'child-1', parentUserId: 'parent-1', name: '민준', age: 5 });
      prisma.reservation.create.mockResolvedValue(created);

      await service.create(dto, 'parent-1');

      expect(prisma.reservation.findMany).toHaveBeenCalledWith({
        where: { childId: 'child-1', status: { not: 'CANCELLED' } },
        include: { preferredSlots: true },
      });
    });
  });

  describe('findMine', () => {
    it('학부모 본인의 취소되지 않은 신청을 최신순으로 반환한다', async () => {
      const reservations = [{ id: '1', childId: 'child-1' }];
      prisma.reservation.findMany.mockResolvedValue(reservations);

      const result = await service.findMine('parent-1');

      expect(result).toBe(reservations);
      expect(prisma.reservation.findMany).toHaveBeenCalledWith({
        where: { parentUserId: 'parent-1', status: { not: 'CANCELLED' } },
        include: { preferredSlots: true },
        orderBy: { createdAt: 'desc' },
      });
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

  describe('createWalkInReservation', () => {
    const dto = {
      childName: '지훈',
      childAge: 6,
      parentName: '최엄마',
      preferredSlots: [{ dayOfWeek: 'MON', startMinute: 720, endMinute: 730 }],
    };

    it('학부모 계정 없이 신청을 생성하고 접수 이메일은 보내지 않는다', async () => {
      const created = { id: '1', ...dto, parentEmail: '', status: 'WAITING' };
      prisma.reservation.create.mockResolvedValue(created);

      const result = await service.createWalkInReservation(dto);

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

      await service.createWalkInReservation(dtoWithEmail);

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
