import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { randomBytes } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service.js';
import { ParentPrincipal } from './strategies/parent-jwt.strategy.js';
import { OAuthProviderFactory } from './oauth-providers/oauth-provider.factory.js';
import { OAuthStateService } from './oauth-state.service.js';
import { ParentSocialAccountService } from './parent-social-account.service.js';

@Injectable()
export class SocialAuthService {
  private readonly logger = new Logger('SocialAuth');

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly providerFactory: OAuthProviderFactory,
    private readonly stateService: OAuthStateService,
    private readonly parentSocialAccountService: ParentSocialAccountService,
  ) {}

  buildAuthorizationUrl(providerName: string, returnTo = '/'): string {
    const provider = this.providerFactory.getProvider(providerName);
    const state = this.stateService.createState(providerName, returnTo);
    const redirectUri = this.redirectUri(providerName);
    
    this.logger.log(`[start] provider=${providerName} redirect_uri=${redirectUri} returnTo=${returnTo}`);
    
    return provider.getAuthorizationUrl(state, redirectUri);
  }

  async handleCallback(providerName: string, query: { code?: string; state?: string; error?: string }) {
    this.logger.log(`[callback] provider=${providerName} hasCode=${!!query.code} hasState=${!!query.state} error=${query.error ?? 'none'}`);

    if (query.error || !query.code || !query.state) {
      this.logger.warn(`[callback] rejected: error=${query.error ?? 'none'} hasCode=${!!query.code} hasState=${!!query.state}`);
      throw new UnauthorizedException('Social login failed');
    }

    const state = this.stateService.verifyState(query.state);
    if (state.provider !== providerName) {
      this.logger.warn(`[callback] state mismatch expected=${providerName} got=${state.provider}`);
      throw new UnauthorizedException('Invalid OAuth state');
    }

    const provider = this.providerFactory.getProvider(providerName);
    const redirectUri = this.redirectUri(providerName);
    
    const token = await provider.exchangeCode(query.code, redirectUri);
    this.logger.log(`[callback] token acquired hasAccessToken=${!!token.access_token} hasIdToken=${!!token.id_token}`);

    const profile = await provider.fetchProfile(token);
    const parentUser = await this.parentSocialAccountService.upsertParentUser(providerName, profile);
    this.logger.log(`[callback] parent upserted id=${parentUser.id} email=${parentUser.email ?? 'none'}`);

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
    callbackUrl.searchParams.set('returnTo', state.returnTo);
    this.logger.log(`[callback] redirecting to ${callbackUrl.toString()}`);
    return callbackUrl.toString();
  }

  async exchangeSessionCode(code: string) {
    this.logger.log('[exchange] code received');
    const session = await this.prisma.parentAuthSession.findUnique({
      where: { code },
      include: { parentUser: true },
    });

    if (!session || session.consumedAt || session.expiresAt.getTime() < Date.now()) {
      this.logger.warn('[exchange] invalid or expired session');
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

    this.logger.log(`[exchange] issued token for parent=${parent.id}`);
    return { accessToken, parent };
  }

  async getMe(principal: ParentPrincipal) {
    return {
      id: principal.parentUserId,
      email: principal.email,
      name: principal.name,
    };
  }

  createStateForTest(providerName: string, returnTo: string) {
    return this.stateService.createState(providerName, returnTo);
  }

  private redirectUri(providerName: string) {
    return `${this.backendUrl()}/auth/social/${providerName}/callback`;
  }

  private backendUrl() {
    return this.configService.get<string>('BACKEND_PUBLIC_URL', 'http://localhost:3000');
  }

  private frontendUrl() {
    return this.configService.get<string>('FRONTEND_URL', 'http://localhost:3001');
  }
}
