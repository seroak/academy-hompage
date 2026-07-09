import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { OAuthProvider } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SocialAuthService } from './social-auth.service';
import { OAuthProviderFactory } from './oauth-providers/oauth-provider.factory';
import { GoogleOAuthProvider } from './oauth-providers/google.provider';
import { KakaoOAuthProvider } from './oauth-providers/kakao.provider';
import { NaverOAuthProvider } from './oauth-providers/naver.provider';
import { OAuthStateService } from './oauth-state.service';
import { ParentSocialAccountService } from './parent-social-account.service';
describe('SocialAuthService', () => {
  let service: SocialAuthService;
  let prisma: {
    parentSocialAccount: { findUnique: jest.Mock; update: jest.Mock; create: jest.Mock };
    parentUser: { findUnique: jest.Mock; create: jest.Mock; update: jest.Mock };
    parentAuthSession: { create: jest.Mock; findUnique: jest.Mock; update: jest.Mock };
  };
  let jwtService: { sign: jest.Mock };
  let fetchMock: jest.Mock;
  let configValues: Record<string, string>;

  beforeEach(async () => {
    configValues = {
      BACKEND_PUBLIC_URL: 'http://localhost:3000',
      FRONTEND_URL: 'http://localhost:3001',
      OAUTH_STATE_SECRET: 'test-state-secret',
      GOOGLE_CLIENT_ID: 'google-client',
      GOOGLE_CLIENT_SECRET: 'google-secret',
      KAKAO_CLIENT_ID: 'kakao-client',
      KAKAO_CLIENT_SECRET: 'kakao-secret',
      NAVER_CLIENT_ID: 'naver-client',
      NAVER_CLIENT_SECRET: 'naver-secret',
    };

    prisma = {
      parentSocialAccount: {
        findUnique: jest.fn(),
        update: jest.fn(),
        create: jest.fn(),
      },
      parentUser: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      parentAuthSession: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };
    jwtService = { sign: jest.fn().mockReturnValue('parent-jwt') };
    fetchMock = jest.fn();
    global.fetch = fetchMock;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SocialAuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwtService },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: string) => configValues[key] ?? defaultValue),
          },
        },
        OAuthProviderFactory,
        GoogleOAuthProvider,
        KakaoOAuthProvider,
        NaverOAuthProvider,
        OAuthStateService,
        ParentSocialAccountService,
      ],
    }).compile();

    service = module.get<SocialAuthService>(SocialAuthService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('builds a Google authorization URL with callback and signed state', () => {
    const url = new URL(service.buildAuthorizationUrl('google', '/courses'));

    expect(url.origin + url.pathname).toBe('https://accounts.google.com/o/oauth2/v2/auth');
    expect(url.searchParams.get('client_id')).toBe('google-client');
    expect(url.searchParams.get('redirect_uri')).toBe(
      'http://localhost:3000/auth/social/google/callback',
    );
    expect(url.searchParams.get('response_type')).toBe('code');
    expect(url.searchParams.get('scope')).toContain('openid');
    expect(url.searchParams.get('state')).toBeTruthy();
  });

  it('rejects a callback when state provider does not match', async () => {
    const state = service.createStateForTest('google', '/courses');

    await expect(service.handleCallback('kakao', { code: 'code', state })).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('exchanges provider code, upserts parent identity, and creates a one-time session', async () => {
    const state = service.createStateForTest('google', '/courses');
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'provider-token' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          sub: 'google-sub-1',
          email: 'parent@example.com',
          name: '김보호',
        }),
      });
    prisma.parentSocialAccount.findUnique.mockResolvedValue(null);
    prisma.parentUser.findUnique.mockResolvedValue(null);
    prisma.parentUser.create.mockResolvedValue({
      id: 'parent-1',
      email: 'parent@example.com',
      name: '김보호',
    });
    prisma.parentSocialAccount.create.mockResolvedValue({});
    prisma.parentAuthSession.create.mockResolvedValue({});

    const redirectUrl = await service.handleCallback('google', { code: 'provider-code', state });
    const redirect = new URL(redirectUrl);
    const sessionCode = redirect.searchParams.get('code');

    expect(redirect.origin + redirect.pathname).toBe(
      'http://localhost:3001/auth/social/callback',
    );
    expect(redirect.searchParams.get('returnTo')).toBe('/courses');
    expect(sessionCode).toBeTruthy();
    expect(prisma.parentAuthSession.create).toHaveBeenCalledWith({
      data: {
        code: sessionCode,
        parentUserId: 'parent-1',
        expiresAt: expect.any(Date),
      },
    });
    expect(prisma.parentSocialAccount.create).toHaveBeenCalledWith({
      data: {
        provider: OAuthProvider.GOOGLE,
        providerAccountId: 'google-sub-1',
        profileEmail: 'parent@example.com',
        profileName: '김보호',
        parentUserId: 'parent-1',
      },
    });
  });

  it('exchanges a one-time session code for a parent JWT and marks it consumed', async () => {
    const expiresAt = new Date(Date.now() + 60_000);
    prisma.parentAuthSession.findUnique.mockResolvedValue({
      id: 'session-1',
      code: 'session-code',
      consumedAt: null,
      expiresAt,
      parentUser: {
        id: 'parent-1',
        email: 'parent@example.com',
        name: '김보호',
      },
    });
    prisma.parentAuthSession.update.mockResolvedValue({});

    const result = await service.exchangeSessionCode('session-code');

    expect(result).toEqual({
      accessToken: 'parent-jwt',
      parent: {
        id: 'parent-1',
        email: 'parent@example.com',
        name: '김보호',
      },
    });
    expect(jwtService.sign).toHaveBeenCalledWith({
      sub: 'parent-1',
      email: 'parent@example.com',
      name: '김보호',
      tokenType: 'parent',
    });
    expect(prisma.parentAuthSession.update).toHaveBeenCalledWith({
      where: { id: 'session-1' },
      data: { consumedAt: expect.any(Date) },
    });
  });
});
