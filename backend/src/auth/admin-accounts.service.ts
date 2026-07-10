import { ConflictException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAdminDto } from './dto/create-admin.dto';

@Injectable()
export class AdminAccountsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateAdminDto) {
    const existing = await this.prisma.admin.findUnique({
      where: { username: dto.username },
    });
    if (existing) {
      throw new ConflictException('이미 사용 중인 관리자 아이디입니다.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    return this.prisma.admin.create({
      data: { username: dto.username, passwordHash },
      select: { id: true, username: true, createdAt: true },
    });
  }
}
