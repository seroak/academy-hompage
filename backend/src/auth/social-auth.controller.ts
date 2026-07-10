import { Body, Controller, Get, Param, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { ParentJwtGuard } from './guards/parent-jwt.guard.js';
import { SocialAuthService } from './social-auth.service.js';
import { ParentPrincipal } from './strategies/parent-jwt.strategy.js';
import { setAuthCookie } from './auth-cookies.js';
import type { CookieResponse } from './auth-cookies.js';

interface RedirectResponse {
  redirect: (url: string) => void;
}

interface ParentRequest {
  user: ParentPrincipal;
}

@Controller('auth/social')
export class SocialAuthController {
  constructor(private readonly socialAuthService: SocialAuthService) {}

  @Get(':provider/start')
  start(
    @Param('provider') provider: string,
    @Query('returnTo') returnTo: string | undefined,
    @Res() response: RedirectResponse,
  ) {
    response.redirect(this.socialAuthService.buildAuthorizationUrl(provider, returnTo ?? '/'));
  }

  @Get(':provider/callback')
  async callback(
    @Param('provider') provider: string,
    @Query() query: { code?: string; state?: string; error?: string },
    @Res() response: RedirectResponse,
  ) {
    response.redirect(await this.socialAuthService.handleCallback(provider, query));
  }

  @Post('exchange')
  async exchange(
    @Body() dto: { code: string },
    @Res({ passthrough: true }) response: CookieResponse,
  ) {
    const result = await this.socialAuthService.exchangeSessionCode(dto.code);
    setAuthCookie(response, 'parent', result.accessToken);
    return result;
  }

  @UseGuards(ParentJwtGuard)
  @Get('me')
  me(@Req() request: ParentRequest) {
    return this.socialAuthService.getMe(request.user);
  }
}
