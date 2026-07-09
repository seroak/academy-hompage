import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, randomBytes } from 'node:crypto';

export interface OAuthState {
  provider: string;
  returnTo: string;
  expiresAt: number;
  nonce: string;
}

@Injectable()
export class OAuthStateService {
  constructor(private readonly configService: ConfigService) {}

  createState(provider: string, returnTo: string): string {
    const state: OAuthState = {
      provider,
      returnTo: this.safeReturnTo(returnTo),
      expiresAt: Date.now() + 10 * 60 * 1000,
      nonce: randomBytes(16).toString('base64url'),
    };
    const payload = Buffer.from(JSON.stringify(state)).toString('base64url');
    const signature = this.sign(payload);
    return `${payload}.${signature}`;
  }

  verifyState(serialized: string): OAuthState {
    const [payload, signature] = serialized.split('.');
    if (!payload || !signature || this.sign(payload) !== signature) {
      throw new UnauthorizedException('Invalid OAuth state');
    }

    const state = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as OAuthState;
    if (state.expiresAt < Date.now()) {
      throw new UnauthorizedException('Expired OAuth state');
    }

    return state;
  }

  private sign(payload: string) {
    return createHmac(
      'sha256',
      this.configService.get<string>(
        'OAUTH_STATE_SECRET',
        this.configService.get<string>('JWT_SECRET', 'dev-only-change-me-academy-jwt-secret'),
      ),
    )
      .update(payload)
      .digest('base64url');
  }

  private safeReturnTo(returnTo: string) {
    return returnTo.startsWith('/') && !returnTo.startsWith('//') ? returnTo : '/';
  }
}
