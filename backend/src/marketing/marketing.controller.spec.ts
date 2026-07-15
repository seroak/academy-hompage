import { GUARDS_METADATA } from '@nestjs/common/constants.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { MarketingController } from './marketing.controller.js';

describe('MarketingController', () => {
  it.each(['dashboard', 'sync', 'status'])(
    '%s는 관리자 JWT 가드를 사용한다',
    (methodName) => {
      const guards = Reflect.getMetadata(
        GUARDS_METADATA,
        MarketingController.prototype[methodName as keyof MarketingController],
      ) as unknown;
      expect(Array.isArray(guards)).toBe(true);
      expect(guards).toContain(JwtAuthGuard);
    },
  );
});
