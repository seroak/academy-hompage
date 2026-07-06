import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { OAuthProvider } from '@prisma/client';
import { createHmac, randomBytes } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { ParentPrincipal } from './strategies/parent-jwt.strategy';

type ProviderParam = 'google' | 'kakao' | 'naver';

interface OAuthState {
  provider: ProviderParam;
  returnTo: string;
  expiresAt: number;
  nonce: string;
}

interface ProviderProfile {
  providerAccountId: string;
  email: string | null;
  name: string | null;
}

interface TokenResponse {
  access_token?: string;
  id_token?: string;
}

@Injectable()
export class SocialAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  buildAuthorizationUrl(provider: string, returnTo = '/apply'): string {
    const normalizedProvider = this.normalizeProvider(provider);
    const config = this.getProviderConfig(normalizedProvider);
    const url = new URL(config.authorizationUrl);

    url.searchParams.set('response_type', 'code');
    url.searchParams.set('client_id', config.clientId);
    url.searchParams.set('redirect_uri', this.redirectUri(normalizedProvider));
    url.searchParams.set('state', this.createState(normalizedProvider, this.safeReturnTo(returnTo)));

    if (config.scope) {
      url.searchParams.set('scope', config.scope);
    }

    return url.toString();
  }

  async handleCallback(provider: string, query: { code?: string; state?: string; error?: string }) {
    const normalizedProvider = this.normalizeProvider(provider);

    if (query.error || !query.code || !query.state) {
      throw new UnauthorizedException('Social login failed');
    }

    const state = this.verifyState(query.state);
    if (state.provider !== normalizedProvider) {
      throw new UnauthorizedException('Invalid OAuth state');
    }

    const token = await this.exchangeProviderCode(normalizedProvider, query.code);
    const profile = await this.fetchProviderProfile(normalizedProvider, token);
    const parentUser = await this.upsertParentUser(normalizedProvider, profile);
    const sessionCode = randomBytes(32).toString('base64url');

    await this.prisma.parentAuthSession.create({
      data: {
        code: sessionCode,
        parentUserId: parentUser.id,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      },
    });

    const callbackUrl = new URL('/auth/social/callback', this.frontendUrl());
    callbackUrl.searchParams.set('code', sessionCode);
    return callbackUrl.toString();
  }

  async exchangeSessionCode(code: string) {
    const session = await this.prisma.parentAuthSession.findUnique({
      where: { code },
      include: { parentUser: true },
    });

    if (!session || session.consumedAt || session.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('Invalid social login session');
    }

    await this.prisma.parentAuthSession.update({
      where: { id: session.id },
      data: { consumedAt: new Date() },
    });

    const parent = {
      id: session.parentUser.id,
      email: session.parentUser.email,
      name: session.parentUser.name,
    };
    const accessToken = this.jwtService.sign({
      sub: parent.id,
      email: parent.email,
      name: parent.name,
      tokenType: 'parent',
    });

    return { accessToken, parent };
  }

  async getMe(principal: ParentPrincipal) {
    return {
      id: principal.parentUserId,
      email: principal.email,
      name: principal.name,
    };
  }

  createStateForTest(provider: ProviderParam, returnTo: string) {
    return this.createState(provider, returnTo);
  }

  private async exchangeProviderCode(provider: ProviderParam, code: string): Promise<TokenResponse> {
    const config = this.getProviderConfig(provider);
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: config.clientId,
      redirect_uri: this.redirectUri(provider),
      code,
    });

    if (config.clientSecret) {
      body.set('client_secret', config.clientSecret);
    }

    const response = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8' },
      body,
    });

    if (!response.ok) {
      throw new UnauthorizedException('Failed to exchange social login code');
    }

    return response.json() as Promise<TokenResponse>;
  }

  private async fetchProviderProfile(provider: ProviderParam, token: TokenResponse): Promise<ProviderProfile> {
    if (!token.access_token) {
      throw new UnauthorizedException('Social access token missing');
    }

    const response = await fetch(this.getProviderConfig(provider).profileUrl, {
      headers: { Authorization: `Bearer ${token.access_token}` },
    });

    if (!response.ok) {
      throw new UnauthorizedException('Failed to fetch social profile');
    }

    const raw = await response.json();
    return this.parseProfile(provider, raw);
  }

  private parseProfile(provider: ProviderParam, raw: unknown): ProviderProfile {
    const data = raw as Record<string, unknown>;

    if (provider === 'google') {
      return {
        providerAccountId: String(data.sub),
        email: typeof data.email === 'string' ? data.email : null,
        name: typeof data.name === 'string' ? data.name : null,
      };
    }

    if (provider === 'kakao') {
      const account = (data.kakao_account ?? {}) as Record<string, unknown>;
      const profile = (account.profile ?? {}) as Record<string, unknown>;
      return {
        providerAccountId: String(data.id),
        email: typeof account.email === 'string' ? account.email : null,
        name: typeof profile.nickname === 'string' ? profile.nickname : null,
      };
    }

    const response = (data.response ?? {}) as Record<string, unknown>;
    return {
      providerAccountId: String(response.id),
      email: typeof response.email === 'string' ? response.email : null,
      name: typeof response.name === 'string' ? response.name : null,
    };
  }

  private async upsertParentUser(provider: ProviderParam, profile: ProviderProfile) {
    const providerEnum = this.toProviderEnum(provider);
    const existingAccount = await this.prisma.parentSocialAccount.findUnique({
      where: {
        provider_providerAccountId: {
          provider: providerEnum,
          providerAccountId: profile.providerAccountId,
        },
      },
      include: { parentUser: true },
    });

    if (existingAccount) {
      await this.prisma.parentSocialAccount.update({
        where: { id: existingAccount.id },
        data: { profileEmail: profile.email, profileName: profile.name },
      });

      return this.prisma.parentUser.update({
        where: { id: existingAccount.parentUserId },
        data: { email: profile.email ?? existingAccount.parentUser.email, name: profile.name ?? existingAccount.parentUser.name },
      });
    }

    let parentUser = profile.email
      ? await this.prisma.parentUser.findUnique({ where: { email: profile.email } })
      : null;

    if (!parentUser) {
      parentUser = await this.prisma.parentUser.create({
        data: { email: profile.email, name: profile.name },
      });
    } else if (profile.name && !parentUser.name) {
      parentUser = await this.prisma.parentUser.update({
        where: { id: parentUser.id },
        data: { name: profile.name },
      });
    }

    await this.prisma.parentSocialAccount.create({
      data: {
        provider: providerEnum,
        providerAccountId: profile.providerAccountId,
        profileEmail: profile.email,
        profileName: profile.name,
        parentUserId: parentUser.id,
      },
    });

    return parentUser;
  }

  private createState(provider: ProviderParam, returnTo: string) {
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

  private verifyState(serialized: string): OAuthState {
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
    return createHmac('sha256', process.env.OAUTH_STATE_SECRET ?? process.env.JWT_SECRET ?? 'dev-only-change-me-academy-jwt-secret')
      .update(payload)
      .digest('base64url');
  }

  private normalizeProvider(provider: string): ProviderParam {
    if (provider === 'google' || provider === 'kakao' || provider === 'naver') {
      return provider;
    }

    throw new UnauthorizedException('Unsupported social provider');
  }

  private toProviderEnum(provider: ProviderParam): OAuthProvider {
    return {
      google: OAuthProvider.GOOGLE,
      kakao: OAuthProvider.KAKAO,
      naver: OAuthProvider.NAVER,
    }[provider];
  }

  private getProviderConfig(provider: ProviderParam) {
    const configs = {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenUrl: 'https://oauth2.googleapis.com/token',
        profileUrl: 'https://openidconnect.googleapis.com/v1/userinfo',
        scope: 'openid email profile',
      },
      kakao: {
        clientId: process.env.KAKAO_CLIENT_ID,
        clientSecret: process.env.KAKAO_CLIENT_SECRET,
        authorizationUrl: 'https://kauth.kakao.com/oauth/authorize',
        tokenUrl: 'https://kauth.kakao.com/oauth/token',
        profileUrl: 'https://kapi.kakao.com/v2/user/me',
        scope: 'profile_nickname account_email',
      },
      naver: {
        clientId: process.env.NAVER_CLIENT_ID,
        clientSecret: process.env.NAVER_CLIENT_SECRET,
        authorizationUrl: 'https://nid.naver.com/oauth2.0/authorize',
        tokenUrl: 'https://nid.naver.com/oauth2.0/token',
        profileUrl: 'https://openapi.naver.com/v1/nid/me',
        scope: '',
      },
    }[provider];

    if (!configs.clientId) {
      throw new UnauthorizedException(`Missing ${provider} OAuth client id`);
    }

    return { ...configs, clientId: configs.clientId };
  }

  private redirectUri(provider: ProviderParam) {
    return `${this.backendUrl()}/auth/social/${provider}/callback`;
  }

  private backendUrl() {
    return process.env.BACKEND_PUBLIC_URL ?? 'http://localhost:3000';
  }

  private frontendUrl() {
    return process.env.FRONTEND_URL ?? 'http://localhost:5173';
  }

  private safeReturnTo(returnTo: string) {
    return returnTo.startsWith('/') && !returnTo.startsWith('//') ? returnTo : '/apply';
  }
}
