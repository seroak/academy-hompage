import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

export interface JwtPayload {
  sub: string;
  username?: string;
  tokenType?: string;
}

export interface AdminPrincipal {
  adminId: string;
  username: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET ?? 'dev-only-change-me-academy-jwt-secret',
    });
  }

  async validate(payload: JwtPayload): Promise<AdminPrincipal> {
    if (payload.tokenType !== 'admin' || !payload.username) {
      throw new UnauthorizedException('Admin token required');
    }

    return { adminId: payload.sub, username: payload.username };
  }
}
