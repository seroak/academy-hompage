import type { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AdminRole } from '../admin-role';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  const reflector = { getAllAndOverride: jest.fn() } as unknown as Reflector;
  const guard = new RolesGuard(reflector);

  function context(role?: AdminRole): ExecutionContext {
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({ getRequest: () => ({ user: role ? { role } : undefined }) }),
    } as unknown as ExecutionContext;
  }

  it('allows an administrator whose role is required by the route', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([AdminRole.CONTENT_MANAGER]);

    expect(guard.canActivate(context(AdminRole.CONTENT_MANAGER))).toBe(true);
  });

  it('rejects an administrator without a required route role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([AdminRole.CONTENT_MANAGER]);

    expect(guard.canActivate(context(AdminRole.ASSESSMENT_MANAGER))).toBe(false);
  });

  it('allows a super administrator for every protected role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([AdminRole.RESERVATION_MANAGER]);

    expect(guard.canActivate(context(AdminRole.SUPER_ADMIN))).toBe(true);
  });
});
