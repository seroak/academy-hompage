import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNoticeDto } from './dto/create-notice.dto';
import { UpdateNoticeDto } from './dto/update-notice.dto';

@Injectable()
export class NoticesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.notice.findMany({
      orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async findOne(id: string) {
    const notice = await this.prisma.notice.findUnique({ where: { id } });

    if (!notice) {
      throw new NotFoundException(`Notice ${id} not found`);
    }

    return notice;
  }

  create(dto: CreateNoticeDto) {
    return this.prisma.notice.create({ data: dto });
  }

  async update(id: string, dto: UpdateNoticeDto) {
    try {
      return await this.prisma.notice.update({ where: { id }, data: dto });
    } catch (error) {
      if (this.isNotFoundError(error)) {
        throw new NotFoundException(`Notice ${id} not found`);
      }
      throw error;
    }
  }

  async remove(id: string) {
    try {
      await this.prisma.notice.delete({ where: { id } });
    } catch (error) {
      if (this.isNotFoundError(error)) {
        throw new NotFoundException(`Notice ${id} not found`);
      }
      throw error;
    }
  }

  private isNotFoundError(error: unknown): boolean {
    return typeof error === 'object' && error !== null && (error as { code?: string }).code === 'P2025';
  }
}
