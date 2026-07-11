import { ReservationGroupLifecycleService } from './reservation-group-lifecycle.service.js';

describe('ReservationGroupLifecycleService', () => {
  it('슬롯 없이 그룹을 만들면 EMPTY 상태로 저장한다', async () => {
    const tx = {
      reservation: {
        findMany: jest.fn().mockResolvedValue([]),
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      reservationGroup: {
        create: jest.fn().mockResolvedValue({ id: 'g1' }),
        findUnique: jest.fn().mockResolvedValue({
          id: 'g1',
          label: '빈 반',
          capacity: 4,
          status: 'EMPTY',
          slots: [],
          reservations: [],
        }),
      },
      reservationGroupSlot: { createManyAndReturn: jest.fn().mockResolvedValue([]) },
    };
    const transaction = { run: jest.fn((operation) => operation(tx)) };
    const validator = {
      validateCapacity: jest.fn(),
      resolveSchedule: jest.fn().mockReturnValue(null),
      assertNoGaps: jest.fn(),
    };
    const service = new ReservationGroupLifecycleService(
      transaction as never,
      { sendGroupConfirmed: jest.fn() } as never,
      validator as never,
    );

    await service.create({ label: '빈 반', capacity: 4, slots: [] } as never);

    expect(tx.reservationGroup.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ label: '빈 반', capacity: 4, status: 'EMPTY' }),
    });
  });

  it('그룹을 만들면 재조회한 신청 목록을 포함해 반환한다', async () => {
    const reservation = {
      id: 'r1',
      status: 'WAITING',
      childAge: 6,
      preferredSlots: [
        { dayOfWeek: 'MON', startMinute: 600, endMinute: 660 },
      ],
    };
    const createdSlot = {
      id: 's1',
      groupId: 'g1',
      reservationId: 'r1',
      dayOfWeek: 'MON',
      startMinute: 600,
      endMinute: 660,
    };
    const fullGroup = {
      id: 'g1',
      label: '반',
      capacity: 4,
      status: 'CONFIRMED',
      slots: [createdSlot],
      reservations: [reservation],
    };
    const tx = {
      reservation: {
        findMany: jest.fn().mockResolvedValue([reservation]),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      reservationGroup: {
        create: jest.fn().mockResolvedValue({ id: 'g1' }),
        findUnique: jest.fn().mockResolvedValue(fullGroup),
      },
      reservationGroupSlot: {
        createManyAndReturn: jest.fn().mockResolvedValue([createdSlot]),
      },
    };
    const transaction = { run: jest.fn((operation) => operation(tx)) };
    const validator = {
      validateReservationStatus: jest.fn(),
      validateCapacity: jest.fn(),
      resolveSchedule: jest.fn().mockReturnValue(null),
      validateSlotsWithinPreferred: jest.fn(),
      assertNoGaps: jest.fn(),
    };
    const service = new ReservationGroupLifecycleService(
      transaction as never,
      { sendGroupConfirmed: jest.fn() } as never,
      validator as never,
    );

    const dto = {
      label: '반',
      capacity: 4,
      slots: [
        { reservationId: 'r1', dayOfWeek: 'MON', startMinute: 600, endMinute: 660 },
      ],
    };
    const result = await service.create(dto as never);

    expect(tx.reservationGroup.findUnique).toHaveBeenCalledWith({
      where: { id: 'g1' },
      include: {
        slots: true,
        reservations: { include: { preferredSlots: true } },
      },
    });
    expect(result.reservations).toEqual([reservation]);
  });

  it('그룹 삭제에서 신청 상태 복원과 그룹 삭제를 하나의 직렬화 트랜잭션으로 실행한다', async () => {
    const tx = {
      reservation: { updateMany: jest.fn().mockResolvedValue({ count: 2 }) },
      reservationGroup: { delete: jest.fn().mockResolvedValue({ id: 'g1' }) },
    };
    const transaction = { run: jest.fn((operation) => operation(tx)) };
    const service = new ReservationGroupLifecycleService(
      transaction as never,
      {} as never,
      {} as never,
    );

    await service.remove('g1');

    expect(transaction.run).toHaveBeenCalledTimes(1);
    expect(tx.reservation.updateMany).toHaveBeenCalledWith({
      where: { groupId: 'g1' },
      data: { groupId: null, status: 'WAITING' },
    });
    expect(tx.reservationGroup.delete).toHaveBeenCalledWith({
      where: { id: 'g1' },
    });
  });
});
