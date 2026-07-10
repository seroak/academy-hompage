import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuthProvider, ProviderProfile, TokenResponse } from './oauth-provider.interface.js';

@Injectable()
export class NaverOAuthProvider implements OAuthProvider {
  private readonly logger = new Logger(NaverOAuthProvider.name);

  constructor(private readonly configService: ConfigService) {}

  getAuthorizationUrl(state: string, redirectUri: string): string {
    const url = new URL('https://nid.naver.com/oauth2.0/authorize');
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('client_id', this.getClientId());
    url.searchParams.set('redirect_uri', redirectUri);
    url.searchParams.set('state', state);
    url.searchParams.set('scope', '');
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

    const response = await fetch('https://nid.naver.com/oauth2.0/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8' },
      body,
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      this.logger.error(`Failed token exchange. status=${response.status} body=${errorBody.slice(0, 200)}`);
      throw new UnauthorizedException('Failed to exchange Naver OAuth code');
    }

    return response.json();
  }

  async fetchProfile(token: TokenResponse): Promise<ProviderProfile> {
    if (!token.access_token) {
      throw new UnauthorizedException('Naver access token missing');
    }

    const response = await fetch('https://openapi.naver.com/v1/nid/me', {
      headers: { Authorization: `Bearer ${token.access_token}` },
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      this.logger.error(`Failed profile fetch. status=${response.status} body=${errorBody.slice(0, 200)}`);
      throw new UnauthorizedException('Failed to fetch Naver profile');
    }

    const raw = await response.json();
    return this.parseProfile(raw);
  }

  private parseProfile(data: any): ProviderProfile {
    const response = (data.response ?? {}) as Record<string, unknown>;
    return {
      providerAccountId: String(response.id),
      email: typeof response.email === 'string' ? response.email : null,
      name: typeof response.name === 'string' ? response.name : null,
    };
  }

  private getClientId(): string {
    const clientId = this.configService.get<string>('NAVER_CLIENT_ID');
    if (!clientId) throw new UnauthorizedException('Missing NAVER_CLIENT_ID');
    return clientId;
  }

  private getClientSecret(): string {
    return this.configService.get<string>('NAVER_CLIENT_SECRET') || '';
  }
}
