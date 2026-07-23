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

  it('schedule이 지정된 그룹을 만들 때 다른 그룹의 시간과 겹치면 검증기가 예외를 던지면 그대로 전파한다', async () => {
    const tx = {
      reservation: { findMany: jest.fn().mockResolvedValue([]) },
      reservationGroup: {
        findMany: jest.fn().mockResolvedValue([
          { label: '기존 반', scheduleDayOfWeek: null, scheduleStartMinute: null, scheduleEndMinute: null, slots: [{ dayOfWeek: 'TUE', startMinute: 1010, endMinute: 1060 }] },
        ]),
        create: jest.fn(),
      },
      reservationGroupSlot: { createManyAndReturn: jest.fn() },
    };
    const transaction = { run: jest.fn((operation) => operation(tx)) };
    const validator = {
      validateCapacity: jest.fn(),
      resolveSchedule: jest.fn().mockReturnValue({ dayOfWeek: 'TUE', startMinute: 1050, endMinute: 1120 }),
      validateScheduleOverlap: jest.fn(() => {
        throw new Error('시간 겹침');
      }),
      assertNoGaps: jest.fn(),
    };
    const service = new ReservationGroupLifecycleService(
      transaction as never,
      { sendGroupConfirmed: jest.fn() } as never,
      validator as never,
    );

    await expect(
      service.create({
        label: '빈 반',
        capacity: 4,
        slots: [],
        scheduleDayOfWeek: 'TUE',
        scheduleStartMinute: 1050,
        scheduleEndMinute: 1120,
      } as never),
    ).rejects.toThrow('시간 겹침');

    expect(validator.validateScheduleOverlap).toHaveBeenCalledWith(
      'TUE',
      1050,
      1120,
      [{ label: '기존 반', scheduleDayOfWeek: null, scheduleStartMinute: null, scheduleEndMinute: null, slots: [{ dayOfWeek: 'TUE', startMinute: 1010, endMinute: 1060 }] }],
    );
    expect(tx.reservationGroup.create).not.toHaveBeenCalled();
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

  it('그룹 스케줄을 변경하면 멤버 슬롯도 새 스케줄로 함께 교체한다', async () => {
    const member = {
      id: 'r1',
      status: 'GROUPED',
      preferredSlots: [{ dayOfWeek: 'TUE', startMinute: 780, endMinute: 900 }],
    };
    const existingGroup = {
      id: 'g1',
      scheduleDayOfWeek: 'MON',
      scheduleStartMinute: 780,
      scheduleEndMinute: 840,
      slots: [
        { id: 's1', reservationId: 'r1', dayOfWeek: 'MON', startMinute: 780, endMinute: 840 },
      ],
    };
    const updatedGroup = { ...existingGroup, scheduleDayOfWeek: 'TUE' };
    const tx = {
      reservationGroup: {
        findUnique: jest.fn().mockResolvedValue(existingGroup),
        update: jest.fn().mockResolvedValue(updatedGroup),
        findMany: jest.fn().mockResolvedValue([]),
      },
      reservation: {
        findMany: jest.fn().mockResolvedValue([member]),
      },
      reservationGroupSlot: {
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
        createManyAndReturn: jest.fn().mockResolvedValue([]),
      },
    };
    const transaction = { run: jest.fn((operation) => operation(tx)) };
    const validator = {
      validateSlotsWithinPreferred: jest.fn(),
      validateScheduleOverlap: jest.fn(),
    };
    const service = new ReservationGroupLifecycleService(
      transaction as never,
      {} as never,
      validator as never,
    );

    await service.update('g1', {
      scheduleDayOfWeek: 'TUE',
      scheduleStartMinute: 780,
      scheduleEndMinute: 840,
    } as never);

    expect(validator.validateSlotsWithinPreferred).toHaveBeenCalledWith(
      [{ dayOfWeek: 'TUE', startMinute: 780, endMinute: 840 }],
      member.preferredSlots,
    );
    expect(tx.reservationGroupSlot.deleteMany).toHaveBeenCalledWith({
      where: { groupId: 'g1' },
    });
    expect(tx.reservationGroupSlot.createManyAndReturn).toHaveBeenCalledWith({
      data: [
        { dayOfWeek: 'TUE', startMinute: 780, endMinute: 840, groupId: 'g1', reservationId: 'r1' },
      ],
    });
    expect(tx.reservationGroup.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'g1' } }),
    );
  });

  it('그룹 스케줄을 변경할 때 다른 그룹과 겹치면 자기 자신은 제외하고 검증한다', async () => {
    const existingGroup = {
      id: 'g1',
      scheduleDayOfWeek: 'MON',
      scheduleStartMinute: 780,
      scheduleEndMinute: 840,
      slots: [],
    };
    const tx = {
      reservationGroup: { findUnique: jest.fn().mockResolvedValue(existingGroup), findMany: jest.fn().mockResolvedValue([]) },
      reservation: { findMany: jest.fn().mockResolvedValue([]) },
      reservationGroupSlot: { deleteMany: jest.fn(), createManyAndReturn: jest.fn() },
    };
    const transaction = { run: jest.fn((operation) => operation(tx)) };
    const validator = {
      validateSlotsWithinPreferred: jest.fn(),
      validateScheduleOverlap: jest.fn(() => {
        throw new Error('시간 겹침');
      }),
    };
    const service = new ReservationGroupLifecycleService(
      transaction as never,
      {} as never,
      validator as never,
    );

    await expect(
      service.update('g1', {
        scheduleDayOfWeek: 'TUE',
        scheduleStartMinute: 900,
        scheduleEndMinute: 960,
      } as never),
    ).rejects.toThrow('시간 겹침');

    expect(tx.reservationGroup.findMany).toHaveBeenCalledWith({
      where: { id: { not: 'g1' }, status: { in: ['CONFIRMED', 'EMPTY'] } },
      include: { slots: true },
    });
    expect(validator.validateScheduleOverlap).toHaveBeenCalledWith('TUE', 900, 960, []);
    expect(tx.reservationGroupSlot.deleteMany).not.toHaveBeenCalled();
  });

  it('새 스케줄이 멤버의 선호 시간 밖이면 그룹 스케줄 변경을 거부한다', async () => {
    const member = {
      id: 'r1',
      status: 'GROUPED',
      preferredSlots: [{ dayOfWeek: 'MON', startMinute: 780, endMinute: 840 }],
    };
    const existingGroup = {
      id: 'g1',
      scheduleDayOfWeek: 'MON',
      scheduleStartMinute: 780,
      scheduleEndMinute: 840,
      slots: [],
    };
    const tx = {
      reservationGroup: { findUnique: jest.fn().mockResolvedValue(existingGroup), findMany: jest.fn().mockResolvedValue([]) },
      reservation: { findMany: jest.fn().mockResolvedValue([member]) },
      reservationGroupSlot: {
        deleteMany: jest.fn(),
        createManyAndReturn: jest.fn(),
      },
    };
    const transaction = { run: jest.fn((operation) => operation(tx)) };
    const validator = {
      validateScheduleOverlap: jest.fn(),
      validateSlotsWithinPreferred: jest.fn(() => {
        throw new Error('밖 범위');
      }),
    };
    const service = new ReservationGroupLifecycleService(
      transaction as never,
      {} as never,
      validator as never,
    );

    await expect(
      service.update('g1', {
        scheduleDayOfWeek: 'TUE',
        scheduleStartMinute: 780,
        scheduleEndMinute: 840,
      } as never),
    ).rejects.toThrow('밖 범위');
    expect(tx.reservationGroupSlot.deleteMany).not.toHaveBeenCalled();
  });

  it('일정이 없던 그룹도 요일·시각을 새로 지정할 수 있다', async () => {
    const existingGroup = {
      id: 'g1',
      scheduleDayOfWeek: null,
      scheduleStartMinute: null,
      scheduleEndMinute: null,
      slots: [],
    };
    const tx = {
      reservationGroup: {
        findUnique: jest.fn().mockResolvedValue(existingGroup),
        update: jest.fn().mockResolvedValue(existingGroup),
        findMany: jest.fn().mockResolvedValue([]),
      },
      reservation: { findMany: jest.fn().mockResolvedValue([]) },
      reservationGroupSlot: {
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
        createManyAndReturn: jest.fn().mockResolvedValue([]),
      },
    };
    const transaction = { run: jest.fn((operation) => operation(tx)) };
    const service = new ReservationGroupLifecycleService(
      transaction as never,
      {} as never,
      { validateSlotsWithinPreferred: jest.fn(), validateScheduleOverlap: jest.fn() } as never,
    );

    await service.update('g1', {
      scheduleDayOfWeek: 'TUE',
      scheduleStartMinute: 780,
      scheduleEndMinute: 840,
    } as never);

    expect(tx.reservationGroup.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'g1' },
        data: expect.objectContaining({
          scheduleDayOfWeek: 'TUE',
          scheduleStartMinute: 780,
          scheduleEndMinute: 840,
        }),
      }),
    );
  });

  it('서로 다른 요일에 배정돼 있던 멤버들도 새 스케줄 하나로 슬롯이 합쳐진다', async () => {
    const memberA = {
      id: 'r1',
      status: 'GROUPED',
      preferredSlots: [{ dayOfWeek: 'TUE', startMinute: 780, endMinute: 900 }],
    };
    const memberB = {
      id: 'r2',
      status: 'GROUPED',
      preferredSlots: [{ dayOfWeek: 'TUE', startMinute: 840, endMinute: 900 }],
    };
    const existingGroup = {
      id: 'g1',
      scheduleDayOfWeek: null,
      scheduleStartMinute: null,
      scheduleEndMinute: null,
      slots: [
        { id: 's1', reservationId: 'r1', dayOfWeek: 'MON', startMinute: 780, endMinute: 840 },
        { id: 's2', reservationId: 'r2', dayOfWeek: 'WED', startMinute: 900, endMinute: 960 },
      ],
    };
    const tx = {
      reservationGroup: {
        findUnique: jest.fn().mockResolvedValue(existingGroup),
        update: jest.fn().mockResolvedValue(existingGroup),
        findMany: jest.fn().mockResolvedValue([]),
      },
      reservation: { findMany: jest.fn().mockResolvedValue([memberA, memberB]) },
      reservationGroupSlot: {
        deleteMany: jest.fn().mockResolvedValue({ count: 2 }),
        createManyAndReturn: jest.fn().mockResolvedValue([]),
      },
    };
    const transaction = { run: jest.fn((operation) => operation(tx)) };
    const validator = { validateSlotsWithinPreferred: jest.fn(), validateScheduleOverlap: jest.fn() };
    const service = new ReservationGroupLifecycleService(
      transaction as never,
      {} as never,
      validator as never,
    );

    await service.update('g1', {
      scheduleDayOfWeek: 'TUE',
      scheduleStartMinute: 840,
      scheduleEndMinute: 900,
    } as never);

    expect(tx.reservationGroupSlot.deleteMany).toHaveBeenCalledWith({
      where: { groupId: 'g1' },
    });
    expect(tx.reservationGroupSlot.createManyAndReturn).toHaveBeenCalledWith({
      data: [
        { dayOfWeek: 'TUE', startMinute: 840, endMinute: 900, groupId: 'g1', reservationId: 'r1' },
        { dayOfWeek: 'TUE', startMinute: 840, endMinute: 900, groupId: 'g1', reservationId: 'r2' },
      ],
    });
  });

  it('스케줄 필드 중 일부만 보내면 거부한다', async () => {
    const existingGroup = {
      id: 'g1',
      scheduleDayOfWeek: 'MON',
      scheduleStartMinute: 780,
      scheduleEndMinute: 840,
      slots: [],
    };
    const tx = {
      reservationGroup: { findUnique: jest.fn().mockResolvedValue(existingGroup) },
      reservation: { findMany: jest.fn() },
      reservationGroupSlot: { deleteMany: jest.fn(), createManyAndReturn: jest.fn() },
    };
    const transaction = { run: jest.fn((operation) => operation(tx)) };
    const service = new ReservationGroupLifecycleService(
      transaction as never,
      {} as never,
      {} as never,
    );

    await expect(
      service.update('g1', { scheduleDayOfWeek: 'TUE' } as never),
    ).rejects.toThrow('요일과 시작·종료 시각을 모두 선택해 주세요');
  });

  it('멤버가 없는 그룹의 스케줄을 변경하면 앵커 슬롯도 새 스케줄로 이동한다', async () => {
    const existingGroup = {
      id: 'g1',
      scheduleDayOfWeek: 'MON',
      scheduleStartMinute: 780,
      scheduleEndMinute: 840,
      slots: [
        { id: 's1', reservationId: null, dayOfWeek: 'MON', startMinute: 780, endMinute: 840 },
      ],
    };
    const tx = {
      reservationGroup: {
        findUnique: jest.fn().mockResolvedValue(existingGroup),
        update: jest.fn().mockResolvedValue(existingGroup),
        findMany: jest.fn().mockResolvedValue([]),
      },
      reservation: { findMany: jest.fn().mockResolvedValue([]) },
      reservationGroupSlot: {
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
        createManyAndReturn: jest.fn().mockResolvedValue([]),
      },
    };
    const transaction = { run: jest.fn((operation) => operation(tx)) };
    const validator = { validateSlotsWithinPreferred: jest.fn(), validateScheduleOverlap: jest.fn() };
    const service = new ReservationGroupLifecycleService(
      transaction as never,
      {} as never,
      validator as never,
    );

    await service.update('g1', {
      scheduleDayOfWeek: 'TUE',
      scheduleStartMinute: 780,
      scheduleEndMinute: 840,
    } as never);

    expect(tx.reservationGroupSlot.createManyAndReturn).toHaveBeenCalledWith({
      data: [
        { dayOfWeek: 'TUE', startMinute: 780, endMinute: 840, groupId: 'g1', reservationId: null },
      ],
    });
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
