import { Body, Controller, HttpCode, HttpStatus, Post, Res } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import { ParentLoginDto } from './dto/parent-login.dto.js';
import { ParentSignupDto } from './dto/parent-signup.dto.js';
import { clearAuthCookie, setAuthCookie } from './auth-cookies.js';
import type { ClearCookieResponse, CookieResponse } from './auth-cookies.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.username, dto.password);
  }

  @Post('parents/login')
  @HttpCode(HttpStatus.OK)
  async loginParent(
    @Body() dto: ParentLoginDto,
    @Res({ passthrough: true }) response: CookieResponse,
  ) {
    const result = await this.authService.loginParent(dto.email, dto.password);
    setAuthCookie(response, 'parent', result.accessToken);
    return result;
  }

  @Post('parents/signup')
  @HttpCode(HttpStatus.CREATED)
  async signupParent(
    @Body() dto: ParentSignupDto,
    @Res({ passthrough: true }) response: CookieResponse,
  ) {
    const result = await this.authService.signupParent(dto);
    setAuthCookie(response, 'parent', result.accessToken);
    return result;
  }

  @Post('parents/logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  logoutParent(@Res({ passthrough: true }) response: ClearCookieResponse) {
    clearAuthCookie(response, 'parent');
  }
}
