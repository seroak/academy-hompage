import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface TurnstileResponse {
  success?: boolean;
}

@Injectable()
export class TurnstileVerifier {
  private readonly logger = new Logger(TurnstileVerifier.name);

  constructor(private readonly config: ConfigService) {}

  async verify(token: string, remoteIp?: string): Promise<boolean> {
    const secret = this.config.get<string>('TURNSTILE_SECRET_KEY');
    if (!secret) {
      this.logger.warn(
        'TURNSTILE_SECRET_KEY가 없어 리드 제출을 저장하지 않습니다.',
      );
      return false;
    }

    const body = new URLSearchParams({ secret, response: token });
    if (remoteIp) body.set('remoteip', remoteIp);

    try {
      const response = await fetch(
        'https://challenges.cloudflare.com/turnstile/v0/siteverify',
        {
          method: 'POST',
          headers: { 'content-type': 'application/x-www-form-urlencoded' },
          body,
          signal: AbortSignal.timeout(5000),
        },
      );
      if (!response.ok) return false;
      const result = (await response.json()) as TurnstileResponse;
      return result.success === true;
    } catch (error) {
      this.logger.warn(
        `Turnstile 검증 요청 실패: ${error instanceof Error ? error.message : 'unknown'}`,
      );
      return false;
    }
  }
}
