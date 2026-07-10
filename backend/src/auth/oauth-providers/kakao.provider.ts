import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuthProvider, ProviderProfile, TokenResponse } from './oauth-provider.interface.js';

@Injectable()
export class KakaoOAuthProvider implements OAuthProvider {
  private readonly logger = new Logger(KakaoOAuthProvider.name);

  constructor(private readonly configService: ConfigService) {}

  getAuthorizationUrl(state: string, redirectUri: string): string {
    const url = new URL('https://kauth.kakao.com/oauth/authorize');
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('client_id', this.getClientId());
    url.searchParams.set('redirect_uri', redirectUri);
    url.searchParams.set('state', state);
    url.searchParams.set('scope', 'profile_nickname account_email');
    return url.toString();
  }

  async exchangeCode(code: string, redirectUri: string): Promise<TokenResponse> {
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: this.getClientId(),
      client_secret: this.getClientSecret(),
      redirect_uri: redirectUri,
      code,
    });

    const response = await fetch('https://kauth.kakao.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8' },
      body,
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      this.logger.error(`Failed token exchange. status=${response.status} body=${errorBody.slice(0, 200)}`);
      throw new UnauthorizedException('Failed to exchange Kakao OAuth code');
    }

    return response.json();
  }

  async fetchProfile(token: TokenResponse): Promise<ProviderProfile> {
    if (!token.access_token) {
      throw new UnauthorizedException('Kakao access token missing');
    }

    const response = await fetch('https://kapi.kakao.com/v2/user/me', {
      headers: { Authorization: `Bearer ${token.access_token}` },
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      this.logger.error(`Failed profile fetch. status=${response.status} body=${errorBody.slice(0, 200)}`);
      throw new UnauthorizedException('Failed to fetch Kakao profile');
    }

    const raw = await response.json();
    return this.parseProfile(raw);
  }

  private parseProfile(data: any): ProviderProfile {
    const account = (data.kakao_account ?? {}) as Record<string, unknown>;
    const profile = (account.profile ?? {}) as Record<string, unknown>;
    return {
      providerAccountId: String(data.id),
      email: typeof account.email === 'string' ? account.email : null,
      name: typeof profile.nickname === 'string' ? profile.nickname : null,
    };
  }

  private getClientId(): string {
    const clientId = this.configService.get<string>('KAKAO_CLIENT_ID');
    if (!clientId) throw new UnauthorizedException('Missing KAKAO_CLIENT_ID');
    return clientId;
  }

  private getClientSecret(): string {
    return this.configService.get<string>('KAKAO_CLIENT_SECRET') || '';
  }
}
