import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AdminRole } from '../admin-role';

export interface JwtPayload {
  sub: string;
  username?: string;
  role?: AdminRole;
  tokenType?: string;
}

export interface AdminPrincipal {
  adminId: string;
  username: string;
  role: AdminRole;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET', 'dev-only-change-me-academy-jwt-secret'),
    });
  }

  async validate(payload: JwtPayload): Promise<AdminPrincipal> {
    if (
      payload.tokenType !== 'admin' ||
      !payload.username ||
      !payload.role ||
      !Object.values(AdminRole).includes(payload.role)
    ) {
      throw new UnauthorizedException('Admin token required');
    }

    return { adminId: payload.sub, username: payload.username, role: payload.role };
  }
}
