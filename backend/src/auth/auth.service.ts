import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { randomBytes } from 'node:crypto';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service.js';
import { NotificationService } from '../notifications/notification.service.js';
import { ParentSignupDto } from './dto/parent-signup.dto.js';

const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly notificationService: NotificationService,
  ) {}

  async login(username: string, password: string) {
    const admin = await this.prisma.admin.findUnique({ where: { username } });

    if (!admin || !(await bcrypt.compare(password, admin.passwordHash))) {
      throw new UnauthorizedException('Invalid username or password');
    }

    const accessToken = this.jwtService.sign({
      sub: admin.id,
      username: admin.username,
      tokenType: 'admin',
    });

    return {
      accessToken,
      admin: { id: admin.id, username: admin.username },
    };
  }

  async signupParent(dto: ParentSignupDto) {
    const email = this.normalizeEmail(dto.email);
    const existingParent = await this.prisma.parentUser.findUnique({ where: { email } });

    if (existingParent?.passwordHash) {
      throw new ConflictException('이미 가입된 이메일입니다.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const token = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS);

    await this.prisma.parentEmailVerification.upsert({
      where: { email },
      create: {
        email,
        name: dto.name,
        passwordHash,
        token,
        expiresAt,
      },
      update: {
        name: dto.name,
        passwordHash,
        token,
        expiresAt,
        consumedAt: null,
      },
    });

    const verifyUrl = `${this.frontendUrl()}/auth/verify-email?token=${token}`;
    await this.notificationService.sendParentEmailVerification(email, dto.name, verifyUrl);

    return { email, verificationSent: true as const };
  }

  async verifyParentEmail(token: string) {
    const verification = await this.prisma.parentEmailVerification.findUnique({
      where: { token },
    });

    if (!verification || verification.consumedAt || verification.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException('인증 링크가 유효하지 않거나 만료되었습니다.');
    }

    const existingParent = await this.prisma.parentUser.findUnique({
      where: { email: verification.email },
    });

    if (existingParent?.passwordHash) {
      throw new ConflictException('이미 가입된 이메일입니다.');
    }

    const parent = existingParent
      ? await this.prisma.parentUser.update({
          where: { id: existingParent.id },
          data: {
            passwordHash: verification.passwordHash,
            name: existingParent.name ?? verification.name,
          },
        })
      : await this.prisma.parentUser.create({
          data: {
            email: verification.email,
            name: verification.name,
            passwordHash: verification.passwordHash,
          },
        });

    await this.prisma.parentEmailVerification.update({
      where: { id: verification.id },
      data: { consumedAt: new Date() },
    });

    return this.createParentLoginResponse(parent);
  }

  async loginParent(email: string, password: string) {
    const parent = await this.prisma.parentUser.findUnique({
      where: { email: this.normalizeEmail(email) },
    });

    if (!parent?.passwordHash || !(await bcrypt.compare(password, parent.passwordHash))) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.createParentLoginResponse(parent);
  }

  private createParentLoginResponse(parent: { id: string; email: string | null; name: string | null }) {
    const profile = {
      id: parent.id,
      email: parent.email,
      name: parent.name,
    };
    const accessToken = this.jwtService.sign({
      sub: profile.id,
      email: profile.email,
      name: profile.name,
      tokenType: 'parent',
    });

    return { accessToken, parent: profile };
  }

  private normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }

  private frontendUrl() {
    return this.configService.get<string>('FRONTEND_URL', 'http://localhost:3001');
  }
}
