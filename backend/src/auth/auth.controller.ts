import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ParentLoginDto } from './dto/parent-login.dto';
import { ParentSignupDto } from './dto/parent-signup.dto';

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
  loginParent(@Body() dto: ParentLoginDto) {
    return this.authService.loginParent(dto.email, dto.password);
  }

  @Post('parents/signup')
  @HttpCode(HttpStatus.CREATED)
  signupParent(@Body() dto: ParentSignupDto) {
    return this.authService.signupParent(dto);
  }
}
