import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateChildDto } from './dto/create-child.dto.js';
import { UpdateChildDto } from './dto/update-child.dto.js';

@Injectable()
export class ChildrenService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(parentUserId: string) {
    return this.prisma.child.findMany({
      where: { parentUserId },
      orderBy: { createdAt: 'desc' },
    });
  }

  create(dto: CreateChildDto, parentUserId: string) {
    return this.prisma.child.create({ data: { ...dto, parentUserId } });
  }

  async update(id: string, dto: UpdateChildDto, parentUserId: string) {
    const result = await this.prisma.child.updateMany({
      where: { id, parentUserId },
      data: dto,
    });

    if (result.count === 0) {
      throw new NotFoundException(`Child ${id} not found`);
    }

    return this.prisma.child.findFirst({ where: { id, parentUserId } });
  }

  async remove(id: string, parentUserId: string) {
    const result = await this.prisma.child.deleteMany({ where: { id, parentUserId } });
    if (result.count === 0) {
      throw new NotFoundException(`Child ${id} not found`);
    }
  }
}
