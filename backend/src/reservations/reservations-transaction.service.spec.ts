import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ReservationsTransactionService } from './reservations-transaction.service.js';

describe('ReservationsTransactionService', () => {
  let service: ReservationsTransactionService;
  let prisma: { $transaction: jest.Mock };

  beforeEach(() => {
    prisma = { $transaction: jest.fn() };
    service = new ReservationsTransactionService(prisma as unknown as PrismaService);
  });

  it('직렬화 충돌 뒤 신청 검사를 재시도한다', async () => {
    const operation = jest.fn().mockResolvedValue('created');
    prisma.$transaction
      .mockRejectedValueOnce({ code: 'P2034' })
      .mockResolvedValueOnce('created');

    await expect(service.run(operation)).resolves.toBe('created');

    expect(prisma.$transaction).toHaveBeenCalledTimes(2);
    expect(prisma.$transaction).toHaveBeenLastCalledWith(operation, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });
  });
});
