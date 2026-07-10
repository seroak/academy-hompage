import { ReservationGroupLifecycleService } from './reservation-group-lifecycle.service.js';

describe('ReservationGroupLifecycleService', () => {
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
