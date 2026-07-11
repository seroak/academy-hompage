import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import { ParentLoginDto } from './dto/parent-login.dto.js';
import { ParentSignupDto } from './dto/parent-signup.dto.js';
import { VerifyEmailDto } from './dto/verify-email.dto.js';
import { clearAuthCookie, setAuthCookie } from './auth-cookies.js';
import type { ClearCookieResponse, CookieResponse } from './auth-cookies.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import type { AdminPrincipal } from './strategies/jwt.strategy.js';

interface AdminRequest {
  user: AdminPrincipal;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) response: CookieResponse) {
    const result = await this.authService.login(dto.username, dto.password);
    setAuthCookie(response, 'admin', result.accessToken);
    return result;
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  logout(@Res({ passthrough: true }) response: ClearCookieResponse) {
    clearAuthCookie(response, 'admin');
  }

  @UseGuards(JwtAuthGuard)
  @Get('admin/me')
  getMe(@Req() request: AdminRequest) {
    return { id: request.user.adminId, username: request.user.username };
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
  @HttpCode(HttpStatus.ACCEPTED)
  async signupParent(@Body() dto: ParentSignupDto) {
    return this.authService.signupParent(dto);
  }

  @Post('parents/verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyParentEmail(
    @Body() dto: VerifyEmailDto,
    @Res({ passthrough: true }) response: CookieResponse,
  ) {
    const result = await this.authService.verifyParentEmail(dto.token);
    setAuthCookie(response, 'parent', result.accessToken);
    return result;
  }

  @Post('parents/logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  logoutParent(@Res({ passthrough: true }) response: ClearCookieResponse) {
    clearAuthCookie(response, 'parent');
  }
}
