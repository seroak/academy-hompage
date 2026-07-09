import { Injectable, UnauthorizedException } from '@nestjs/common';
import { OAuthProvider } from './oauth-provider.interface';
import { GoogleOAuthProvider } from './google.provider';
import { KakaoOAuthProvider } from './kakao.provider';
import { NaverOAuthProvider } from './naver.provider';

@Injectable()
export class OAuthProviderFactory {
  constructor(
    private readonly googleProvider: GoogleOAuthProvider,
    private readonly kakaoProvider: KakaoOAuthProvider,
    private readonly naverProvider: NaverOAuthProvider,
  ) {}

  getProvider(providerName: string): OAuthProvider {
    switch (providerName) {
      case 'google':
        return this.googleProvider;
      case 'kakao':
        return this.kakaoProvider;
      case 'naver':
        return this.naverProvider;
      default:
        throw new UnauthorizedException('Unsupported social provider');
    }
  }
}
