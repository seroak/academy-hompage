import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';

@Injectable()
export class CoursesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.course.findMany({
      include: { instructor: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: { instructor: true },
    });

    if (!course) {
      throw new NotFoundException(`Course ${id} not found`);
    }

    return course;
  }

  create(dto: CreateCourseDto) {
    return this.prisma.course.create({ data: dto });
  }

  async update(id: string, dto: UpdateCourseDto) {
    try {
      return await this.prisma.course.update({ where: { id }, data: dto });
    } catch (error) {
      if (this.isNotFoundError(error)) {
        throw new NotFoundException(`Course ${id} not found`);
      }
      throw error;
    }
  }

  async remove(id: string) {
    try {
      await this.prisma.course.delete({ where: { id } });
    } catch (error) {
      if (this.isNotFoundError(error)) {
        throw new NotFoundException(`Course ${id} not found`);
      }
      throw error;
    }
  }

  private isNotFoundError(error: unknown): boolean {
    return typeof error === 'object' && error !== null && (error as { code?: string }).code === 'P2025';
  }
}
