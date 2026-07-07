import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

export interface ParentJwtPayload {
  sub: string;
  email?: string | null;
  name?: string | null;
  tokenType?: string;
}

export interface ParentPrincipal {
  parentUserId: string;
  email: string | null;
  name: string | null;
}

@Injectable()
export class ParentJwtStrategy extends PassportStrategy(Strategy, 'parent-jwt') {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET', 'dev-only-change-me-academy-jwt-secret'),
    });
  }

  async validate(payload: ParentJwtPayload): Promise<ParentPrincipal> {
    if (payload.tokenType !== 'parent') {
      throw new UnauthorizedException('Parent token required');
    }

    return {
      parentUserId: payload.sub,
      email: payload.email ?? null,
      name: payload.name ?? null,
    };
  }
}
