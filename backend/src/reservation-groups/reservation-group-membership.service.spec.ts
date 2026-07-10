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
});
