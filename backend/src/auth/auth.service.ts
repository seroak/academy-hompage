import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { ParentSignupDto } from './dto/parent-signup.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(username: string, password: string) {
    const admin = await this.prisma.admin.findUnique({ where: { username } });

    if (!admin || !(await bcrypt.compare(password, admin.passwordHash))) {
      throw new UnauthorizedException('Invalid username or password');
    }

    const accessToken = this.jwtService.sign({
      sub: admin.id,
      username: admin.username,
      role: admin.role,
      tokenType: 'admin',
    });

    return {
      accessToken,
      admin: { id: admin.id, username: admin.username, role: admin.role },
    };
  }

  async signupParent(dto: ParentSignupDto) {
    const email = this.normalizeEmail(dto.email);
    const existingParent = await this.prisma.parentUser.findUnique({ where: { email } });
    const passwordHash = await bcrypt.hash(dto.password, 10);

    if (existingParent?.passwordHash) {
      throw new ConflictException('이미 가입된 이메일입니다.');
    }

    const parent = existingParent
      ? await this.prisma.parentUser.update({
          where: { id: existingParent.id },
          data: {
            passwordHash,
            name: existingParent.name ?? dto.name,
          },
        })
      : await this.prisma.parentUser.create({
          data: {
            email,
            name: dto.name,
            passwordHash,
          },
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
}
