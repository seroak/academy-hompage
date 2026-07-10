import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AdminRole } from '../admin-role';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { AdminPrincipal } from '../strategies/jwt.strategy';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const allowedRoles = this.reflector.getAllAndOverride<AdminRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!allowedRoles?.length) return true;

    const request = context.switchToHttp().getRequest<{ user?: AdminPrincipal }>();
    const role = request.user?.role;
    return role === AdminRole.SUPER_ADMIN || (role !== undefined && allowedRoles.includes(role));
  }
}
