import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { ReservationGroupsService } from './reservation-groups.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notifications/notification.service';

describe('ReservationGroupsService', () => {
  let service: ReservationGroupsService;
  let prisma: {
    reservation: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      updateMany: jest.Mock;
      update: jest.Mock;
      count: jest.Mock;
    };
    reservationGroup: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    reservationGroupSlot: {
      createManyAndReturn: jest.Mock;
      findMany: jest.Mock;
      deleteMany: jest.Mock;
    };
    $transaction: jest.Mock;
  };
  let notification: { sendGroupConfirmed: jest.Mock; sendGroupMemberRemoved: jest.Mock };

  beforeEach(async () => {
    prisma = {
      reservation: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        updateMany: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
      reservationGroup: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      reservationGroupSlot: {
        createManyAndReturn: jest.fn(),
        findMany: jest.fn(),
        deleteMany: jest.fn(),
      },
      $transaction: jest.fn(async (callback: (tx: unknown) => unknown) =>
        callback(prisma),
      ),
    };
    notification = {
      sendGroupConfirmed: jest.fn().mockResolvedValue(undefined),
      sendGroupMemberRemoved: jest.fn().mockResolvedValue(undefined),
    };

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
      capacity: 4,
      slots: [
        {
          reservationId: 'r1',
          dayOfWeek: 'MON',
          startMinute: 720,
          endMinute: 730,
        },
        {
          reservationId: 'r2',
          dayOfWeek: 'MON',
          startMinute: 720,
          endMinute: 730,
        },
        {
          reservationId: 'r2',
          dayOfWeek: 'WED',
          startMinute: 900,
          endMinute: 910,
        },
      ],
    };
    const waitingReservations = [
      {
        id: 'r1',
        status: 'WAITING',
        childName: '민준',
        childAge: 5,
        parentName: '김엄마',
        parentEmail: 'a@example.com',
        preferredSlots: [
          { dayOfWeek: 'MON', startMinute: 720, endMinute: 800 },
        ],
      },
      {
        id: 'r2',
        status: 'WAITING',
        childName: '서연',
        childAge: 6,
        parentName: '이엄마',
        parentEmail: 'b@example.com',
        preferredSlots: [
          { dayOfWeek: 'MON', startMinute: 700, endMinute: 800 },
          { dayOfWeek: 'WED', startMinute: 900, endMinute: 970 },
        ],
      },
    ];

    it('그룹과 슬롯들을 생성하고 신청들을 GROUPED로 전환한 뒤 신청별 확정 이메일을 발송한다', async () => {
      prisma.reservation.findMany.mockResolvedValue(waitingReservations);
      const createdGroup = {
        id: 'g1',
        label: dto.label,
        status: 'CONFIRMED',
        capacity: 4,
        minAge: 5,
        maxAge: 6,
      };
      const createdSlots = dto.slots.map((slot, index) => ({
        id: `slot-${index}`,
        groupId: 'g1',
        ...slot,
      }));
      prisma.reservationGroup.create.mockResolvedValue(createdGroup);
      prisma.reservationGroupSlot.createManyAndReturn.mockResolvedValue(
        createdSlots,
      );
      prisma.reservation.updateMany.mockResolvedValue({ count: 2 });

      const result = await service.create(dto);

      const expectedGroup = { ...createdGroup, slots: createdSlots };
      expect(result).toEqual(expectedGroup);
      expect(prisma.reservationGroup.create).toHaveBeenCalledWith({
        data: { label: dto.label, capacity: 4, minAge: 5, maxAge: 6 },
      });
      expect(
        prisma.reservationGroupSlot.createManyAndReturn,
      ).toHaveBeenCalledWith({
        data: dto.slots.map((slot) => ({ ...slot, groupId: 'g1' })),
      });
      expect(prisma.reservation.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ['r1', 'r2'] } },
        data: { status: 'GROUPED', groupId: 'g1' },
      });
      expect(notification.sendGroupConfirmed).toHaveBeenCalledTimes(2);
      expect(notification.sendGroupConfirmed).toHaveBeenCalledWith(
        waitingReservations[0],
        expectedGroup,
        [
          {
            reservationId: 'r1',
            dayOfWeek: 'MON',
            startMinute: 720,
            endMinute: 730,
          },
        ],
      );
      expect(notification.sendGroupConfirmed).toHaveBeenCalledWith(
        waitingReservations[1],
        expectedGroup,
        [
          {
            reservationId: 'r2',
            dayOfWeek: 'MON',
            startMinute: 720,
            endMinute: 730,
          },
          {
            reservationId: 'r2',
            dayOfWeek: 'WED',
            startMinute: 900,
            endMinute: 910,
          },
        ],
      );
    });

    it('슬롯이 해당 신청의 후보 시간 범위 밖이면 ConflictException을 던진다', async () => {
      prisma.reservation.findMany.mockResolvedValue([
        waitingReservations[0],
        {
          ...waitingReservations[1],
          preferredSlots: [
            { dayOfWeek: 'WED', startMinute: 900, endMinute: 970 },
          ],
        },
      ]);

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
      expect(prisma.reservationGroup.create).not.toHaveBeenCalled();
    });

    it('슬롯이 후보 시간 범위와 부분만 겹치면 ConflictException을 던진다', async () => {
      prisma.reservation.findMany.mockResolvedValue([
        waitingReservations[0],
        {
          ...waitingReservations[1],
          preferredSlots: [
            { dayOfWeek: 'MON', startMinute: 720, endMinute: 725 },
          ],
        },
      ]);

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
      expect(prisma.reservationGroup.create).not.toHaveBeenCalled();
    });

    it('슬롯에 등장하는 신청 중 존재하지 않는 것이 있으면 ConflictException을 던진다', async () => {
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

    it('정원이 선택된 인원 수보다 적으면 ConflictException을 던진다', async () => {
      prisma.reservation.findMany.mockResolvedValue(waitingReservations);

      await expect(service.create({ ...dto, capacity: 1 })).rejects.toThrow(
        ConflictException,
      );
      expect(prisma.reservationGroup.create).not.toHaveBeenCalled();
    });

    it('minAge/maxAge를 지정하지 않으면 선택된 신청들의 나이 범위로 채워 그룹을 생성한다', async () => {
      prisma.reservation.findMany.mockResolvedValue(waitingReservations);
      const createdGroup = {
        id: 'g3',
        label: dto.label,
        status: 'CONFIRMED',
        capacity: 4,
        minAge: 5,
        maxAge: 6,
      };
      const createdSlots = dto.slots.map((slot, index) => ({
        id: `slot-${index}`,
        groupId: 'g3',
        ...slot,
      }));
      prisma.reservationGroup.create.mockResolvedValue(createdGroup);
      prisma.reservationGroupSlot.createManyAndReturn.mockResolvedValue(
        createdSlots,
      );
      prisma.reservation.updateMany.mockResolvedValue({ count: 2 });

      await service.create(dto);

      expect(prisma.reservationGroup.create).toHaveBeenCalledWith({
        data: { label: dto.label, capacity: 4, minAge: 5, maxAge: 6 },
      });
    });

    it('같은 신청·같은 요일 슬롯 사이에 빈 시간이 있으면 ConflictException을 던진다', async () => {
      prisma.reservation.findMany.mockResolvedValue([waitingReservations[0]]);
      const gappedDto = {
        label: '월요일반',
        capacity: 4,
        slots: [
          {
            reservationId: 'r1',
            dayOfWeek: 'MON',
            startMinute: 720,
            endMinute: 730,
          },
          {
            reservationId: 'r1',
            dayOfWeek: 'MON',
            startMinute: 750,
            endMinute: 760,
          },
        ],
      };

      await expect(service.create(gappedDto)).rejects.toThrow(
        ConflictException,
      );
      expect(prisma.reservationGroup.create).not.toHaveBeenCalled();
    });

    it('같은 신청·같은 요일의 인접한 슬롯 여러 개는 정상적으로 그룹을 생성한다', async () => {
      prisma.reservation.findMany.mockResolvedValue([waitingReservations[0]]);
      const adjacentDto = {
        label: '월요일반',
        capacity: 4,
        slots: [
          {
            reservationId: 'r1',
            dayOfWeek: 'MON',
            startMinute: 720,
            endMinute: 730,
          },
          {
            reservationId: 'r1',
            dayOfWeek: 'MON',
            startMinute: 730,
            endMinute: 740,
          },
        ],
      };
      const createdGroup = {
        id: 'g2',
        label: adjacentDto.label,
        status: 'CONFIRMED',
        capacity: 4,
        minAge: 5,
        maxAge: 5,
      };
      const createdSlots = adjacentDto.slots.map((slot, index) => ({
        id: `slot-${index}`,
        groupId: 'g2',
        ...slot,
      }));
      prisma.reservationGroup.create.mockResolvedValue(createdGroup);
      prisma.reservationGroupSlot.createManyAndReturn.mockResolvedValue(
        createdSlots,
      );
      prisma.reservation.updateMany.mockResolvedValue({ count: 1 });

      await expect(service.create(adjacentDto)).resolves.toEqual({
        ...createdGroup,
        slots: createdSlots,
      });
      expect(prisma.reservationGroup.create).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('그룹 목록을 슬롯·신청 포함해 반환한다', async () => {
      const groups = [{ id: 'g1', slots: [], reservations: [] }];
      prisma.reservationGroup.findMany.mockResolvedValue(groups);

      const result = await service.findAll();

      expect(result).toBe(groups);
      expect(prisma.reservationGroup.findMany).toHaveBeenCalledWith({
        include: {
          slots: true,
          reservations: { include: { preferredSlots: true } },
        },
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

      await expect(service.findOne('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('그룹 정보를 수정한다', async () => {
      const updated = { id: 'g1', label: '변경됨' };
      prisma.reservationGroup.update.mockResolvedValue(updated);

      await expect(service.update('g1', { label: '변경됨' })).resolves.toBe(
        updated,
      );
    });

    it('응답에 slots·reservations를 포함해 프론트 스키마 파싱이 가능하게 한다', async () => {
      const updated = { id: 'g1', label: '변경됨', slots: [], reservations: [] };
      prisma.reservationGroup.update.mockResolvedValue(updated);

      await service.update('g1', { label: '변경됨' });

      expect(prisma.reservationGroup.update).toHaveBeenCalledWith(
        expect.objectContaining({
          include: {
            slots: true,
            reservations: { include: { preferredSlots: true } },
          },
        }),
      );
    });

    it('없으면 NotFoundException을 던진다', async () => {
      prisma.reservationGroup.update.mockRejectedValue({ code: 'P2025' });

      await expect(service.update('missing', {})).rejects.toThrow(
        NotFoundException,
      );
    });

    it('정원을 현재 인원 수 미만으로 줄이면 ConflictException을 던진다', async () => {
      prisma.reservation.findMany.mockResolvedValue([
        { id: 'r1', childAge: 5 },
        { id: 'r2', childAge: 6 },
      ]);

      await expect(
        service.update('g1', { capacity: 1 }),
      ).rejects.toThrow(ConflictException);
      expect(prisma.reservationGroup.update).not.toHaveBeenCalled();
    });

    it('최소 연령을 기존 멤버의 나이보다 높게 설정하면 ConflictException을 던진다', async () => {
      prisma.reservation.findMany.mockResolvedValue([
        { id: 'r1', childAge: 5 },
        { id: 'r2', childAge: 6 },
      ]);

      await expect(
        service.update('g1', { minAge: 6 }),
      ).rejects.toThrow(ConflictException);
      expect(prisma.reservationGroup.update).not.toHaveBeenCalled();
    });

    it('최대 연령을 기존 멤버의 나이보다 낮게 설정하면 ConflictException을 던진다', async () => {
      prisma.reservation.findMany.mockResolvedValue([
        { id: 'r1', childAge: 5 },
        { id: 'r2', childAge: 6 },
      ]);

      await expect(
        service.update('g1', { maxAge: 5 }),
      ).rejects.toThrow(ConflictException);
      expect(prisma.reservationGroup.update).not.toHaveBeenCalled();
    });

    it('정원·연령 조건을 만족하면 정상적으로 수정한다', async () => {
      prisma.reservation.findMany.mockResolvedValue([
        { id: 'r1', childAge: 5 },
        { id: 'r2', childAge: 6 },
      ]);
      const updated = { id: 'g1', capacity: 5, minAge: 4, maxAge: 7 };
      prisma.reservationGroup.update.mockResolvedValue(updated);

      await expect(
        service.update('g1', { capacity: 5, minAge: 4, maxAge: 7 }),
      ).resolves.toBe(updated);
    });
  });

  describe('findConfirmedSlots', () => {
    it('CONFIRMED 그룹에 속한 슬롯만 요일·시작 순으로 반환한다', async () => {
      const slots = [
        { dayOfWeek: 'MON', startMinute: 720, endMinute: 730 },
        { dayOfWeek: 'WED', startMinute: 900, endMinute: 910 },
      ];
      prisma.reservationGroupSlot.findMany.mockResolvedValue(slots);

      const result = await service.findConfirmedSlots();

      expect(result).toBe(slots);
      expect(prisma.reservationGroupSlot.findMany).toHaveBeenCalledWith({
        where: { group: { status: 'CONFIRMED' } },
        select: { dayOfWeek: true, startMinute: true, endMinute: true },
        orderBy: [{ dayOfWeek: 'asc' }, { startMinute: 'asc' }],
      });
    });
  });

  describe('addMember', () => {
    const group = {
      id: 'g1',
      label: '월요일반',
      status: 'CONFIRMED',
      capacity: 4,
      minAge: 5,
      maxAge: 6,
      slots: [
        {
          id: 's1',
          groupId: 'g1',
          reservationId: 'r1',
          dayOfWeek: 'MON',
          startMinute: 720,
          endMinute: 730,
        },
      ],
    };
    const newMember = {
      id: 'r3',
      status: 'WAITING',
      childName: '지훈',
      childAge: 6,
      parentName: '최엄마',
      parentEmail: 'c@example.com',
      preferredSlots: [{ dayOfWeek: 'MON', startMinute: 700, endMinute: 800 }],
    };
    const dto = {
      reservationId: 'r3',
      slots: [{ dayOfWeek: 'MON', startMinute: 720, endMinute: 730 }],
    };

    it('정원·나이·시간 조건을 만족하면 신청을 그룹에 편입하고 확정 이메일을 발송한다', async () => {
      prisma.reservationGroup.findUnique.mockResolvedValue(group);
      prisma.reservation.findUnique.mockResolvedValue(newMember);
      prisma.reservation.count.mockResolvedValue(1);
      const createdSlots = [
        {
          id: 's2',
          groupId: 'g1',
          reservationId: 'r3',
          dayOfWeek: 'MON',
          startMinute: 720,
          endMinute: 730,
        },
      ];
      prisma.reservationGroupSlot.createManyAndReturn.mockResolvedValue(
        createdSlots,
      );
      prisma.reservation.update.mockResolvedValue({
        ...newMember,
        status: 'GROUPED',
        groupId: 'g1',
      });

      const result = await service.addMember('g1', dto);

      const expectedGroup = {
        ...group,
        slots: [...group.slots, ...createdSlots],
      };
      expect(result).toEqual(expectedGroup);
      expect(
        prisma.reservationGroupSlot.createManyAndReturn,
      ).toHaveBeenCalledWith({
        data: [
          {
            dayOfWeek: 'MON',
            startMinute: 720,
            endMinute: 730,
            reservationId: 'r3',
            groupId: 'g1',
          },
        ],
      });
      expect(prisma.reservation.update).toHaveBeenCalledWith({
        where: { id: 'r3' },
        data: { status: 'GROUPED', groupId: 'g1', requestedGroupId: null },
      });
      expect(notification.sendGroupConfirmed).toHaveBeenCalledWith(
        newMember,
        expectedGroup,
        [
          {
            dayOfWeek: 'MON',
            startMinute: 720,
            endMinute: 730,
            reservationId: 'r3',
          },
        ],
      );
    });

    it('그룹이 없으면 NotFoundException을 던진다', async () => {
      prisma.reservationGroup.findUnique.mockResolvedValue(null);

      await expect(service.addMember('missing', dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('그룹이 CONFIRMED 상태가 아니면 ConflictException을 던진다', async () => {
      prisma.reservationGroup.findUnique.mockResolvedValue({
        ...group,
        status: 'CANCELLED',
      });

      await expect(service.addMember('g1', dto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('신청이 없으면 NotFoundException을 던진다', async () => {
      prisma.reservationGroup.findUnique.mockResolvedValue(group);
      prisma.reservation.findUnique.mockResolvedValue(null);

      await expect(service.addMember('g1', dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('신청이 WAITING이 아니면 ConflictException을 던진다', async () => {
      prisma.reservationGroup.findUnique.mockResolvedValue(group);
      prisma.reservation.findUnique.mockResolvedValue({
        ...newMember,
        status: 'GROUPED',
      });

      await expect(service.addMember('g1', dto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('정원이 가득 찼으면 ConflictException을 던진다', async () => {
      prisma.reservationGroup.findUnique.mockResolvedValue(group);
      prisma.reservation.findUnique.mockResolvedValue(newMember);
      prisma.reservation.count.mockResolvedValue(4);

      await expect(service.addMember('g1', dto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('신청의 나이가 그룹 나이대 밖이면 ConflictException을 던진다', async () => {
      prisma.reservationGroup.findUnique.mockResolvedValue(group);
      prisma.reservation.findUnique.mockResolvedValue({
        ...newMember,
        childAge: 9,
      });
      prisma.reservation.count.mockResolvedValue(1);

      await expect(service.addMember('g1', dto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('슬롯이 신청의 후보 시간 범위 밖이면 ConflictException을 던진다', async () => {
      prisma.reservationGroup.findUnique.mockResolvedValue(group);
      prisma.reservation.findUnique.mockResolvedValue({
        ...newMember,
        preferredSlots: [
          { dayOfWeek: 'WED', startMinute: 900, endMinute: 970 },
        ],
      });
      prisma.reservation.count.mockResolvedValue(1);

      await expect(service.addMember('g1', dto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('슬롯이 그룹의 기존 시간대와 겹치지 않으면 ConflictException을 던진다', async () => {
      prisma.reservationGroup.findUnique.mockResolvedValue(group);
      prisma.reservation.findUnique.mockResolvedValue({
        ...newMember,
        preferredSlots: [
          { dayOfWeek: 'THU', startMinute: 720, endMinute: 800 },
        ],
      });
      prisma.reservation.count.mockResolvedValue(1);

      await expect(
        service.addMember('g1', {
          reservationId: 'r3',
          slots: [{ dayOfWeek: 'THU', startMinute: 720, endMinute: 730 }],
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('추가할 슬롯 사이에 빈 시간이 있으면 ConflictException을 던진다', async () => {
      prisma.reservationGroup.findUnique.mockResolvedValue({
        ...group,
        slots: [
          {
            id: 's1',
            groupId: 'g1',
            reservationId: 'r1',
            dayOfWeek: 'MON',
            startMinute: 720,
            endMinute: 800,
          },
        ],
      });
      prisma.reservation.findUnique.mockResolvedValue({
        ...newMember,
        preferredSlots: [
          { dayOfWeek: 'MON', startMinute: 700, endMinute: 800 },
        ],
      });
      prisma.reservation.count.mockResolvedValue(1);

      await expect(
        service.addMember('g1', {
          reservationId: 'r3',
          slots: [
            { dayOfWeek: 'MON', startMinute: 720, endMinute: 730 },
            { dayOfWeek: 'MON', startMinute: 750, endMinute: 760 },
          ],
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findJoinable', () => {
    it('정원이 남은 CONFIRMED 그룹만 개인정보 없이 반환하고 슬롯을 중복 제거한다', async () => {
      const groups = [
        {
          id: 'g1',
          label: '월요일반',
          capacity: 4,
          minAge: 5,
          maxAge: 6,
          _count: { reservations: 2 },
          slots: [
            {
              id: 's1',
              dayOfWeek: 'MON',
              startMinute: 720,
              endMinute: 730,
              reservationId: 'r1',
            },
            {
              id: 's2',
              dayOfWeek: 'MON',
              startMinute: 720,
              endMinute: 730,
              reservationId: 'r2',
            },
          ],
        },
        {
          id: 'g2',
          label: '가득찬반',
          capacity: 2,
          minAge: 4,
          maxAge: 5,
          _count: { reservations: 2 },
          slots: [
            {
              id: 's3',
              dayOfWeek: 'WED',
              startMinute: 900,
              endMinute: 910,
              reservationId: 'r3',
            },
          ],
        },
      ];
      prisma.reservationGroup.findMany.mockResolvedValue(groups);

      const result = await service.findJoinable();

      expect(prisma.reservationGroup.findMany).toHaveBeenCalledWith({
        where: { status: 'CONFIRMED' },
        include: { slots: true, _count: { select: { reservations: true } } },
      });
      expect(result).toEqual([
        {
          id: 'g1',
          label: '월요일반',
          capacity: 4,
          filledCount: 2,
          minAge: 5,
          maxAge: 6,
          slots: [{ dayOfWeek: 'MON', startMinute: 720, endMinute: 730 }],
        },
      ]);
    });
  });

  describe('removeMember', () => {
    const group = {
      id: 'g1',
      label: '월요일반',
      status: 'CONFIRMED',
      capacity: 4,
      minAge: 5,
      maxAge: 6,
      reservations: [
        { id: 'r1', childName: '민준', parentName: '김엄마', parentEmail: 'a@example.com' },
      ],
    };

    it('멤버를 그룹에서 빼고 신청을 WAITING으로 되돌린 뒤 알림을 보낸다', async () => {
      prisma.reservationGroup.findUnique.mockResolvedValue(group);
      prisma.reservationGroupSlot.deleteMany.mockResolvedValue({ count: 1 });
      prisma.reservation.update.mockResolvedValue({
        ...group.reservations[0],
        groupId: null,
        status: 'WAITING',
      });

      await service.removeMember('g1', 'r1');

      expect(prisma.reservationGroupSlot.deleteMany).toHaveBeenCalledWith({
        where: { groupId: 'g1', reservationId: 'r1' },
      });
      expect(prisma.reservation.update).toHaveBeenCalledWith({
        where: { id: 'r1' },
        data: { groupId: null, status: 'WAITING' },
      });
      expect(notification.sendGroupMemberRemoved).toHaveBeenCalledWith(
        group.reservations[0],
        group,
      );
    });

    it('그룹이 없으면 NotFoundException을 던진다', async () => {
      prisma.reservationGroup.findUnique.mockResolvedValue(null);

      await expect(service.removeMember('missing', 'r1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('신청이 그 그룹의 멤버가 아니면 NotFoundException을 던진다', async () => {
      prisma.reservationGroup.findUnique.mockResolvedValue(group);

      await expect(service.removeMember('g1', 'r9')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('replaceMemberSlots', () => {
    const group = {
      id: 'g1',
      label: '월요일반',
      status: 'CONFIRMED',
      capacity: 4,
      minAge: 5,
      maxAge: 6,
      slots: [
        {
          id: 's1',
          groupId: 'g1',
          reservationId: 'r1',
          dayOfWeek: 'MON',
          startMinute: 720,
          endMinute: 730,
        },
      ],
    };
    const member = {
      id: 'r1',
      groupId: 'g1',
      childName: '민준',
      preferredSlots: [{ dayOfWeek: 'MON', startMinute: 700, endMinute: 800 }],
    };
    const dto = {
      slots: [{ dayOfWeek: 'MON', startMinute: 740, endMinute: 750 }],
    };

    it('기존 슬롯을 지우고 새 슬롯으로 교체한다', async () => {
      prisma.reservationGroup.findUnique.mockResolvedValue(group);
      prisma.reservation.findUnique.mockResolvedValue(member);
      prisma.reservationGroupSlot.deleteMany.mockResolvedValue({ count: 1 });
      const createdSlots = [
        {
          id: 's2',
          groupId: 'g1',
          reservationId: 'r1',
          dayOfWeek: 'MON',
          startMinute: 740,
          endMinute: 750,
        },
      ];
      prisma.reservationGroupSlot.createManyAndReturn.mockResolvedValue(
        createdSlots,
      );

      const result = await service.replaceMemberSlots('g1', 'r1', dto);

      expect(prisma.reservationGroupSlot.deleteMany).toHaveBeenCalledWith({
        where: { groupId: 'g1', reservationId: 'r1' },
      });
      expect(
        prisma.reservationGroupSlot.createManyAndReturn,
      ).toHaveBeenCalledWith({
        data: [
          {
            dayOfWeek: 'MON',
            startMinute: 740,
            endMinute: 750,
            reservationId: 'r1',
            groupId: 'g1',
          },
        ],
      });
      expect(result).toEqual({ ...group, slots: createdSlots });
    });

    it('그룹이 없으면 NotFoundException을 던진다', async () => {
      prisma.reservationGroup.findUnique.mockResolvedValue(null);

      await expect(
        service.replaceMemberSlots('missing', 'r1', dto),
      ).rejects.toThrow(NotFoundException);
    });

    it('그룹이 CONFIRMED가 아니면 ConflictException을 던진다', async () => {
      prisma.reservationGroup.findUnique.mockResolvedValue({
        ...group,
        status: 'CANCELLED',
      });

      await expect(
        service.replaceMemberSlots('g1', 'r1', dto),
      ).rejects.toThrow(ConflictException);
    });

    it('신청이 없으면 NotFoundException을 던진다', async () => {
      prisma.reservationGroup.findUnique.mockResolvedValue(group);
      prisma.reservation.findUnique.mockResolvedValue(null);

      await expect(
        service.replaceMemberSlots('g1', 'r1', dto),
      ).rejects.toThrow(NotFoundException);
    });

    it('신청이 그 그룹의 멤버가 아니면 ConflictException을 던진다', async () => {
      prisma.reservationGroup.findUnique.mockResolvedValue(group);
      prisma.reservation.findUnique.mockResolvedValue({
        ...member,
        groupId: 'other-group',
      });

      await expect(
        service.replaceMemberSlots('g1', 'r1', dto),
      ).rejects.toThrow(ConflictException);
    });

    it('슬롯이 신청의 후보 시간 범위 밖이면 ConflictException을 던진다', async () => {
      prisma.reservationGroup.findUnique.mockResolvedValue(group);
      prisma.reservation.findUnique.mockResolvedValue({
        ...member,
        preferredSlots: [{ dayOfWeek: 'WED', startMinute: 900, endMinute: 970 }],
      });

      await expect(
        service.replaceMemberSlots('g1', 'r1', dto),
      ).rejects.toThrow(ConflictException);
    });

    it('새 슬롯 사이에 빈 시간이 있으면 ConflictException을 던진다', async () => {
      prisma.reservationGroup.findUnique.mockResolvedValue(group);
      prisma.reservation.findUnique.mockResolvedValue({
        ...member,
        preferredSlots: [{ dayOfWeek: 'MON', startMinute: 700, endMinute: 800 }],
      });

      await expect(
        service.replaceMemberSlots('g1', 'r1', {
          slots: [
            { dayOfWeek: 'MON', startMinute: 720, endMinute: 730 },
            { dayOfWeek: 'MON', startMinute: 750, endMinute: 760 },
          ],
        }),
      ).rejects.toThrow(ConflictException);
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
      expect(prisma.reservationGroup.delete).toHaveBeenCalledWith({
        where: { id: 'g1' },
      });
    });

    it('없으면 NotFoundException을 던진다', async () => {
      prisma.reservation.updateMany.mockResolvedValue({ count: 0 });
      prisma.reservationGroup.delete.mockRejectedValue({ code: 'P2025' });

      await expect(service.remove('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
