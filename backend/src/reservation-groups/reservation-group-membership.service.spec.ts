import { ConflictException } from '@nestjs/common';
import { ReservationGroupMembershipService } from './reservation-group-membership.service.js';

describe('ReservationGroupMembershipService', () => {
  it('취소된 그룹에서는 멤버 제거를 거절한다', async () => {
    const tx = {
      reservationGroup: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'g1',
          status: 'CANCELLED',
          reservations: [{ id: 'r1' }],
        }),
      },
      reservationGroupSlot: { deleteMany: jest.fn() },
      reservation: { updateMany: jest.fn() },
    };
    const transaction = { run: jest.fn((operation) => operation(tx)) };
    const validator = {
      validateGroupStatus: jest.fn(() => {
        throw new ConflictException('확정된 그룹만 멤버를 제거할 수 있습니다');
      }),
    };
    const service = new ReservationGroupMembershipService(
      transaction as never,
      {} as never,
      validator as never,
    );

    await expect(service.removeMember('g1', 'r1')).rejects.toThrow(
      ConflictException,
    );
    expect(tx.reservationGroupSlot.deleteMany).not.toHaveBeenCalled();
  });

  it('마지막 멤버를 제거하면 슬롯을 삭제하지 않고 reservationId만 비운다', async () => {
    const tx = {
      reservationGroup: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'g1',
          status: 'CONFIRMED',
          reservations: [{ id: 'r1' }],
        }),
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
    it('빈 그룹(anchor 슬롯만 있음)에 멤버가 들어오면 anchor 슬롯을 지우고 새 슬롯만 남긴다', async () => {
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
          findUnique: jest.fn().mockResolvedValue({
            id: 'g1',
            status: 'CONFIRMED',
            capacity: 10,
            minAge: 4,
            maxAge: 10,
            slots: [anchorSlot],
          }),
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
      expect(updatedGroup.slots).toEqual([createdSlot]);
    });
  });

  describe('moveMember', () => {
    function createMoveTx(
      sourceMemberCountAfterMove: number,
      targetSlots: unknown[] = [],
    ) {
      const reservation = {
        id: 'r1',
        groupId: 'source',
        childAge: 6,
        preferredSlots: [],
      };
      const tx = {
        reservationGroup: {
          findUnique: jest.fn((args: { where: { id: string } }) => {
            if (args.where.id === 'source')
              return Promise.resolve({ id: 'source', status: 'CONFIRMED' });
            if (args.where.id === 'target')
              return Promise.resolve({
                id: 'target',
                status: 'CONFIRMED',
                capacity: 10,
                minAge: 4,
                maxAge: 10,
                slots: targetSlots,
              });
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

    it('빈 그룹(anchor 슬롯만 있음)으로 이동하면 anchor 슬롯을 지운다', async () => {
      const anchorSlot = {
        id: 'anchor1',
        groupId: 'target',
        reservationId: null,
        dayOfWeek: 'MON',
        startMinute: 600,
        endMinute: 660,
      };
      const tx = createMoveTx(1, [anchorSlot]);
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
    });
  });
});
