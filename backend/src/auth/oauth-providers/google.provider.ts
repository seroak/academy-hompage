import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuthProvider, ProviderProfile, TokenResponse } from './oauth-provider.interface.js';

@Injectable()
export class GoogleOAuthProvider implements OAuthProvider {
  private readonly logger = new Logger(GoogleOAuthProvider.name);

  constructor(private readonly configService: ConfigService) {}

  getAuthorizationUrl(state: string, redirectUri: string): string {
    const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('client_id', this.getClientId());
    url.searchParams.set('redirect_uri', redirectUri);
    url.searchParams.set('state', state);
    url.searchParams.set('scope', 'openid email profile');
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

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8' },
      body,
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      this.logger.error(`Failed token exchange. status=${response.status} body=${errorBody.slice(0, 200)}`);
      throw new UnauthorizedException('Failed to exchange Google OAuth code');
    }

    return response.json();
  }

  async fetchProfile(token: TokenResponse): Promise<ProviderProfile> {
    if (!token.access_token) {
      throw new UnauthorizedException('Google access token missing');
    }

    const response = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: { Authorization: `Bearer ${token.access_token}` },
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      this.logger.error(`Failed profile fetch. status=${response.status} body=${errorBody.slice(0, 200)}`);
      throw new UnauthorizedException('Failed to fetch Google profile');
    }

    const raw = await response.json();
    return this.parseProfile(raw);
  }

  private parseProfile(data: any): ProviderProfile {
    return {
      providerAccountId: String(data.sub),
      email: typeof data.email === 'string' ? data.email : null,
      name: typeof data.name === 'string' ? data.name : null,
    };
  }

  private getClientId(): string {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    if (!clientId) throw new UnauthorizedException('Missing GOOGLE_CLIENT_ID');
    return clientId;
  }

  private getClientSecret(): string {
    return this.configService.get<string>('GOOGLE_CLIENT_SECRET') || '';
  }
}
