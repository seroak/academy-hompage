import { Prisma } from '../generated/prisma/client.js';
import { ReservationGroupTransactionService } from './reservation-group-transaction.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

describe('ReservationGroupTransactionService', () => {
  let service: ReservationGroupTransactionService;
  let prisma: { $transaction: jest.Mock };

  beforeEach(() => {
    prisma = { $transaction: jest.fn() };
    service = new ReservationGroupTransactionService(
      prisma as unknown as PrismaService,
    );
  });

  it('P2034 충돌 뒤 직렬화 트랜잭션을 재시도한다', async () => {
    const operation = jest.fn().mockResolvedValue('completed');
    prisma.$transaction
      .mockRejectedValueOnce({ code: 'P2034' })
      .mockResolvedValueOnce('completed');

    await expect(service.run(operation)).resolves.toBe('completed');

    expect(prisma.$transaction).toHaveBeenCalledTimes(2);
    expect(prisma.$transaction).toHaveBeenLastCalledWith(operation, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });
  });

  it('P2034가 아닌 오류는 재시도하지 않고 전파한다', async () => {
    const error = new Error('database unavailable');
    prisma.$transaction.mockRejectedValue(error);

    await expect(service.run(jest.fn())).rejects.toThrow(error);

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });
});
