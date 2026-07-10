import { ReservationGroupQueryService } from './reservation-group-query.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

describe('ReservationGroupQueryService', () => {
  let service: ReservationGroupQueryService;
  let prisma: {
    reservationGroup: { findMany: jest.Mock; findUnique: jest.Mock };
    reservationGroupSlot: { findMany: jest.Mock };
  };

  beforeEach(() => {
    prisma = {
      reservationGroup: { findMany: jest.fn(), findUnique: jest.fn() },
      reservationGroupSlot: { findMany: jest.fn() },
    };
    service = new ReservationGroupQueryService(
      prisma as unknown as PrismaService,
    );
  });

  it('관리자 목록은 슬롯과 신청의 희망 시간을 포함해 최신순으로 조회한다', async () => {
    prisma.reservationGroup.findMany.mockResolvedValue([]);

    await service.findAll();

    expect(prisma.reservationGroup.findMany).toHaveBeenCalledWith({
      include: {
        slots: true,
        reservations: { include: { preferredSlots: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('공개 참여 가능 그룹은 개인정보 없이 정원 여유와 중복 제거된 슬롯만 반환한다', async () => {
    prisma.reservationGroup.findMany.mockResolvedValue([
      {
        id: 'g1',
        label: '월요일반',
        capacity: 2,
        minAge: 5,
        maxAge: 6,
        scheduleDayOfWeek: null,
        scheduleStartMinute: null,
        scheduleEndMinute: null,
        _count: { reservations: 1 },
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
        ],
      },
    ]);

    await expect(service.findJoinable()).resolves.toEqual([
      {
        id: 'g1',
        label: '월요일반',
        capacity: 2,
        filledCount: 1,
        minAge: 5,
        maxAge: 6,
        scheduleDayOfWeek: null,
        scheduleStartMinute: null,
        scheduleEndMinute: null,
        slots: [{ dayOfWeek: 'MON', startMinute: 720, endMinute: 730 }],
      },
    ]);
  });
});
