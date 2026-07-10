import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, JwtSignOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { JwtStrategy } from './strategies/jwt.strategy.js';
import { ParentJwtStrategy } from './strategies/parent-jwt.strategy.js';
import { SocialAuthController } from './social-auth.controller.js';
import { SocialAuthService } from './social-auth.service.js';

import { OAuthProviderFactory } from './oauth-providers/oauth-provider.factory.js';
import { GoogleOAuthProvider } from './oauth-providers/google.provider.js';
import { KakaoOAuthProvider } from './oauth-providers/kakao.provider.js';
import { NaverOAuthProvider } from './oauth-providers/naver.provider.js';
import { OAuthStateService } from './oauth-state.service.js';
import { ParentSocialAccountService } from './parent-social-account.service.js';
import { AdminAccountsController } from './admin-accounts.controller.js';
import { AdminAccountsService } from './admin-accounts.service.js';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET', 'dev-only-change-me-academy-jwt-secret'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '1d') as JwtSignOptions['expiresIn'],
        },
      }),
    }),
  ],
  controllers: [AuthController, SocialAuthController, AdminAccountsController],
  providers: [
    AuthService, 
    SocialAuthService, 
    JwtStrategy, 
    ParentJwtStrategy,
    OAuthProviderFactory,
    GoogleOAuthProvider,
    KakaoOAuthProvider,
    NaverOAuthProvider,
    OAuthStateService,
    ParentSocialAccountService,
    AdminAccountsService,
  ],
})
export class AuthModule {}
