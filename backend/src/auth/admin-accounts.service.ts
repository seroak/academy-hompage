import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateAdminDto } from './dto/create-admin.dto.js';
import { isPrismaNotFoundError } from '../common/prisma-errors.js';

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

  findAll() {
    return this.prisma.admin.findMany({
      select: { id: true, username: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async remove(id: string, currentAdminId: string) {
    if (id === currentAdminId) {
      throw new BadRequestException('본인 계정은 삭제할 수 없습니다.');
    }

    const total = await this.prisma.admin.count();
    if (total <= 1) {
      throw new BadRequestException('마지막 관리자 계정은 삭제할 수 없습니다.');
    }

    try {
      await this.prisma.admin.delete({ where: { id } });
    } catch (error) {
      if (isPrismaNotFoundError(error)) {
        throw new NotFoundException(`Admin ${id} not found`);
      }
      throw error;
    }
  }
}
