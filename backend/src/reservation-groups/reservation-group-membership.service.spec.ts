import { ReservationGroupMembershipService } from './reservation-group-membership.service.js';

describe('ReservationGroupMembershipService', () => {
  it('마지막 멤버를 제거하면 슬롯을 비우고 그룹 상태를 EMPTY로 전환한다', async () => {
    const tx = {
      reservationGroup: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'g1',
          status: 'CONFIRMED',
          reservations: [{ id: 'r1' }],
        }),
        update: jest.fn(),
      },
      reservationGroupSlot: {
        deleteMany: jest.fn(),
        updateMany: jest.fn(),
      },
      reservation: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        count: jest.fn().mockResolvedValue(0),
      },
    };
    const transaction = { run: jest.fn((operation) => operation(tx)) };
    const validator = { validateGroupStatus: jest.fn() };
    const notification = { sendGroupMemberRemoved: jest.fn() };
    const service = new ReservationGroupMembershipService(
      transaction as never,
      notification as never,
      validator as never,
    );

    await service.removeMember('g1', 'r1');

    expect(tx.reservationGroupSlot.updateMany).toHaveBeenCalledWith({
      where: { groupId: 'g1', reservationId: 'r1' },
      data: { reservationId: null },
    });
    expect(tx.reservationGroupSlot.deleteMany).not.toHaveBeenCalled();
    expect(tx.reservationGroup.update).toHaveBeenCalledWith({
      where: { id: 'g1' },
      data: { status: 'EMPTY' },
    });
  });

  it('다른 멤버가 남아있으면 제거된 멤버의 슬롯을 그대로 삭제한다', async () => {
    const tx = {
      reservationGroup: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'g1',
          status: 'CONFIRMED',
          reservations: [{ id: 'r1' }, { id: 'r2' }],
        }),
      },
      reservationGroupSlot: {
        deleteMany: jest.fn(),
        updateMany: jest.fn(),
      },
      reservation: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        count: jest.fn().mockResolvedValue(1),
      },
    };
    const transaction = { run: jest.fn((operation) => operation(tx)) };
    const validator = { validateGroupStatus: jest.fn() };
    const notification = { sendGroupMemberRemoved: jest.fn() };
    const service = new ReservationGroupMembershipService(
      transaction as never,
      notification as never,
      validator as never,
    );

    await service.removeMember('g1', 'r1');

    expect(tx.reservationGroupSlot.deleteMany).toHaveBeenCalledWith({
      where: { groupId: 'g1', reservationId: 'r1' },
    });
    expect(tx.reservationGroupSlot.updateMany).not.toHaveBeenCalled();
  });

  describe('addMember', () => {
    it('빈 그룹에 멤버가 들어오면 anchor 슬롯을 지우고 상태를 CONFIRMED로 전환한다', async () => {
      const anchorSlot = {
        id: 'anchor1',
        groupId: 'g1',
        reservationId: null,
        dayOfWeek: 'MON',
        startMinute: 600,
        endMinute: 660,
      };
      const createdSlot = {
        id: 'new1',
        groupId: 'g1',
        reservationId: 'r1',
        dayOfWeek: 'MON',
        startMinute: 600,
        endMinute: 660,
      };
      const tx = {
        reservationGroup: {
          findUnique: jest
            .fn()
            .mockResolvedValueOnce({
              id: 'g1',
              status: 'EMPTY',
              capacity: 10,
              minAge: 4,
              maxAge: 10,
              slots: [anchorSlot],
            })
            .mockResolvedValueOnce({
              id: 'g1',
              status: 'CONFIRMED',
              capacity: 10,
              minAge: 4,
              maxAge: 10,
              slots: [createdSlot],
              reservations: [{ id: 'r1' }],
            }),
          update: jest.fn(),
        },
        reservation: {
          findUnique: jest.fn().mockResolvedValue({
            id: 'r1',
            status: 'WAITING',
            childAge: 6,
            preferredSlots: [
              { dayOfWeek: 'MON', startMinute: 600, endMinute: 660 },
            ],
          }),
          count: jest.fn().mockResolvedValue(0),
          updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        },
        reservationGroupSlot: {
          deleteMany: jest.fn(),
          createManyAndReturn: jest.fn().mockResolvedValue([createdSlot]),
        },
      };
      const transaction = { run: jest.fn((operation) => operation(tx)) };
      const validator = {
        validateGroupStatus: jest.fn(),
        validateReservationStatus: jest.fn(),
        validateCapacity: jest.fn(),
        validateAgeBounds: jest.fn(),
        resolveSchedule: jest.fn().mockReturnValue(null),
        validateSlotsWithinPreferred: jest.fn(),
        validateSlotsOverlap: jest.fn(),
        assertNoGaps: jest.fn(),
      };
      const notification = { sendGroupConfirmed: jest.fn() };
      const service = new ReservationGroupMembershipService(
        transaction as never,
        notification as never,
        validator as never,
      );

      const dto = {
        reservationId: 'r1',
        slots: [{ dayOfWeek: 'MON', startMinute: 600, endMinute: 660 }],
      };
      const updatedGroup = await service.addMember('g1', dto as never);

      expect(tx.reservationGroupSlot.deleteMany).toHaveBeenCalledWith({
        where: { groupId: 'g1', reservationId: null },
      });
      expect(tx.reservationGroup.update).toHaveBeenCalledWith({
        where: { id: 'g1' },
        data: { status: 'CONFIRMED' },
      });
      expect(updatedGroup.slots).toEqual([createdSlot]);
      expect(updatedGroup.reservations).toEqual([{ id: 'r1' }]);
      expect(tx.reservationGroup.findUnique).toHaveBeenLastCalledWith({
        where: { id: 'g1' },
        include: {
          slots: true,
          reservations: { include: { preferredSlots: true } },
        },
      });
    });
  });

  describe('moveMember', () => {
    function createMoveTx(
      sourceMemberCountAfterMove: number,
      targetSlots: unknown[] = [],
      targetStatus: 'CONFIRMED' | 'EMPTY' = 'CONFIRMED',
      targetReservationsAfterMove: unknown[] = [{ id: 'r1' }],
    ) {
      const reservation = {
        id: 'r1',
        groupId: 'source',
        childAge: 6,
        preferredSlots: [],
      };
      let targetFindCount = 0;
      const tx = {
        reservationGroup: {
          findUnique: jest.fn((args: { where: { id: string } }) => {
            if (args.where.id === 'source')
              return Promise.resolve({ id: 'source', status: 'CONFIRMED' });
            if (args.where.id === 'target') {
              targetFindCount += 1;
              if (targetFindCount === 1) {
                return Promise.resolve({
                  id: 'target',
                  status: targetStatus,
                  capacity: 10,
                  minAge: 4,
                  maxAge: 10,
                  slots: targetSlots,
                });
              }
              return Promise.resolve({
                id: 'target',
                status: 'CONFIRMED',
                capacity: 10,
                minAge: 4,
                maxAge: 10,
                slots: targetSlots,
                reservations: targetReservationsAfterMove,
              });
            }
            return Promise.resolve(null);
          }),
          update: jest.fn(),
        },
        reservation: {
          findUnique: jest.fn().mockResolvedValue(reservation),
          count: jest.fn((args: { where: { groupId: string } }) => {
            if (args.where.groupId === 'source')
              return Promise.resolve(sourceMemberCountAfterMove);
            return Promise.resolve(0);
          }),
          updateMany: jest.fn().mockResolvedValue({ count: 1 }),
          update: jest.fn(),
        },
        reservationGroupSlot: {
          deleteMany: jest.fn(),
          updateMany: jest.fn(),
          createManyAndReturn: jest.fn().mockResolvedValue([]),
        },
      };
      return tx;
    }

    const validator = {
      validateGroupStatus: jest.fn(),
      resolveSchedule: jest.fn().mockReturnValue(null),
      validateCapacity: jest.fn(),
      validateSlotsOverlap: jest.fn(),
      assertNoGaps: jest.fn(),
    };
    const notification = { sendGroupConfirmed: jest.fn() };
    const dto = {
      targetGroupId: 'target',
      slots: [{ dayOfWeek: 'MON', startMinute: 600, endMinute: 660 }],
    };

    it('이동 후 원래 그룹에 남은 멤버가 없으면 슬롯을 삭제 대신 비운다', async () => {
      const tx = createMoveTx(0);
      const transaction = { run: jest.fn((operation) => operation(tx)) };
      const service = new ReservationGroupMembershipService(
        transaction as never,
        notification as never,
        validator as never,
      );

      await service.moveMember('source', 'r1', dto as never);

      expect(tx.reservationGroupSlot.updateMany).toHaveBeenCalledWith({
        where: { groupId: 'source', reservationId: 'r1' },
        data: { reservationId: null },
      });
      expect(tx.reservationGroupSlot.deleteMany).not.toHaveBeenCalledWith({
        where: { groupId: 'source', reservationId: 'r1' },
      });
    });

    it('이동 후 원래 그룹에 다른 멤버가 남아있으면 슬롯을 그대로 삭제한다', async () => {
      const tx = createMoveTx(1);
      const transaction = { run: jest.fn((operation) => operation(tx)) };
      const service = new ReservationGroupMembershipService(
        transaction as never,
        notification as never,
        validator as never,
      );

      await service.moveMember('source', 'r1', dto as never);

      expect(tx.reservationGroupSlot.deleteMany).toHaveBeenCalledWith({
        where: { groupId: 'source', reservationId: 'r1' },
      });
      expect(tx.reservationGroupSlot.updateMany).not.toHaveBeenCalled();
    });

    it('빈 그룹으로 이동하면 anchor 슬롯을 지우고 대상 그룹을 CONFIRMED로 전환한다', async () => {
      const anchorSlot = {
        id: 'anchor1',
        groupId: 'target',
        reservationId: null,
        dayOfWeek: 'MON',
        startMinute: 600,
        endMinute: 660,
      };
      const tx = createMoveTx(1, [anchorSlot], 'EMPTY');
      const transaction = { run: jest.fn((operation) => operation(tx)) };
      const service = new ReservationGroupMembershipService(
        transaction as never,
        notification as never,
        validator as never,
      );

      await service.moveMember('source', 'r1', dto as never);

      expect(tx.reservationGroupSlot.deleteMany).toHaveBeenCalledWith({
        where: { groupId: 'target', reservationId: null },
      });
      expect(tx.reservationGroup.update).toHaveBeenCalledWith({
        where: { id: 'target' },
        data: { status: 'CONFIRMED' },
      });
    });

    it('이동이 끝나면 대상 그룹을 재조회해 신청 목록을 포함해 반환한다', async () => {
      const tx = createMoveTx(1, [], 'CONFIRMED', [{ id: 'r1' }, { id: 'r2' }]);
      const transaction = { run: jest.fn((operation) => operation(tx)) };
      const service = new ReservationGroupMembershipService(
        transaction as never,
        notification as never,
        validator as never,
      );

      const updatedGroup = await service.moveMember('source', 'r1', dto as never);

      expect(updatedGroup.reservations).toEqual([{ id: 'r1' }, { id: 'r2' }]);
      expect(tx.reservationGroup.findUnique).toHaveBeenLastCalledWith({
        where: { id: 'target' },
        include: {
          slots: true,
          reservations: { include: { preferredSlots: true } },
        },
      });
    });
  });

  describe('replaceMemberSlots', () => {
    it('시간 교체 후 그룹을 재조회해 신청 목록을 포함해 반환한다', async () => {
      const createdSlot = {
        id: 'new1',
        groupId: 'g1',
        reservationId: 'r1',
        dayOfWeek: 'MON',
        startMinute: 600,
        endMinute: 660,
      };
      const tx = {
        reservationGroup: {
          findUnique: jest
            .fn()
            .mockResolvedValueOnce({
              id: 'g1',
              status: 'CONFIRMED',
              slots: [],
            })
            .mockResolvedValueOnce({
              id: 'g1',
              status: 'CONFIRMED',
              slots: [createdSlot],
              reservations: [{ id: 'r1' }],
            }),
        },
        reservation: {
          findUnique: jest.fn().mockResolvedValue({
            id: 'r1',
            groupId: 'g1',
            status: 'GROUPED',
            childAge: 6,
            preferredSlots: [
              { dayOfWeek: 'MON', startMinute: 600, endMinute: 660 },
            ],
          }),
          updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        },
        reservationGroupSlot: {
          deleteMany: jest.fn(),
          createManyAndReturn: jest.fn().mockResolvedValue([createdSlot]),
        },
      };
      const transaction = { run: jest.fn((operation) => operation(tx)) };
      const validator = {
        validateGroupStatus: jest.fn(),
        resolveSchedule: jest.fn().mockReturnValue(null),
        validateSlotsWithinPreferred: jest.fn(),
        assertNoGaps: jest.fn(),
      };
      const notification = { sendGroupConfirmed: jest.fn() };
      const service = new ReservationGroupMembershipService(
        transaction as never,
        notification as never,
        validator as never,
      );

      const dto = {
        slots: [{ dayOfWeek: 'MON', startMinute: 600, endMinute: 660 }],
      };
      const updatedGroup = await service.replaceMemberSlots(
        'g1',
        'r1',
        dto as never,
      );

      expect(updatedGroup.slots).toEqual([createdSlot]);
      expect(updatedGroup.reservations).toEqual([{ id: 'r1' }]);
      expect(tx.reservationGroup.findUnique).toHaveBeenLastCalledWith({
        where: { id: 'g1' },
        include: {
          slots: true,
          reservations: { include: { preferredSlots: true } },
        },
      });
    });
  });
});
