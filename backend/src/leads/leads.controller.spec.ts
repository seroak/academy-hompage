import { GUARDS_METADATA } from '@nestjs/common/constants.js';
import { LeadsController } from './leads.controller.js';
import { LeadsService } from './leads.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

describe('LeadsController', () => {
  const service = {
    submit: jest.fn(),
    findAll: jest.fn(),
    summary: jest.fn(),
    update: jest.fn(),
  };
  const controller = new LeadsController(service as unknown as LeadsService);

  it('공개 제출을 IP와 함께 서비스로 전달한다', async () => {
    const dto = { guardianName: '김보호' };
    service.submit.mockResolvedValue({ accepted: true });
    await expect(
      controller.submit(dto as never, { ip: '203.0.113.10' } as never),
    ).resolves.toEqual({ accepted: true });
    expect(service.submit).toHaveBeenCalledWith(dto, '203.0.113.10');
  });

  it.each([
    ['findAll', 'findAll'],
    ['summary', 'summary'],
    ['update', 'update'],
  ])('%s 관리자 메서드는 JWT 가드를 사용한다', (methodName) => {
    const guards = Reflect.getMetadata(
      GUARDS_METADATA,
      LeadsController.prototype[methodName as keyof LeadsController],
    ) as unknown;
    expect(Array.isArray(guards)).toBe(true);
    if (!Array.isArray(guards))
      throw new Error('guard metadata is not an array');
    expect(guards).toContain(JwtAuthGuard);
  });
});
