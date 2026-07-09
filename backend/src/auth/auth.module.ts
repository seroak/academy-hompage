import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, JwtSignOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { ParentJwtStrategy } from './strategies/parent-jwt.strategy';
import { SocialAuthController } from './social-auth.controller';
import { SocialAuthService } from './social-auth.service';

import { OAuthProviderFactory } from './oauth-providers/oauth-provider.factory';
import { GoogleOAuthProvider } from './oauth-providers/google.provider';
import { KakaoOAuthProvider } from './oauth-providers/kakao.provider';
import { NaverOAuthProvider } from './oauth-providers/naver.provider';
import { OAuthStateService } from './oauth-state.service';
import { ParentSocialAccountService } from './parent-social-account.service';

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
  controllers: [AuthController, SocialAuthController],
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
  ],
})
export class AuthModule {}
