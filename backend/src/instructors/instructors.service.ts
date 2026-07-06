import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInstructorDto } from './dto/create-instructor.dto';
import { UpdateInstructorDto } from './dto/update-instructor.dto';

@Injectable()
export class InstructorsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.instructor.findMany({ orderBy: { name: 'asc' } });
  }

  async findOne(id: string) {
    const instructor = await this.prisma.instructor.findUnique({
      where: { id },
      include: { courses: true },
    });

    if (!instructor) {
      throw new NotFoundException(`Instructor ${id} not found`);
    }

    return instructor;
  }

  create(dto: CreateInstructorDto) {
    return this.prisma.instructor.create({ data: dto });
  }

  async update(id: string, dto: UpdateInstructorDto) {
    try {
      return await this.prisma.instructor.update({ where: { id }, data: dto });
    } catch (error) {
      if (this.errorCode(error) === 'P2025') {
        throw new NotFoundException(`Instructor ${id} not found`);
      }
      throw error;
    }
  }

  async remove(id: string) {
    try {
      await this.prisma.instructor.delete({ where: { id } });
    } catch (error) {
      const code = this.errorCode(error);
      if (code === 'P2025') {
        throw new NotFoundException(`Instructor ${id} not found`);
      }
      if (code === 'P2003') {
        throw new ConflictException(
          `Instructor ${id} still has courses assigned and cannot be deleted`,
        );
      }
      throw error;
    }
  }

  private errorCode(error: unknown): string | undefined {
    return typeof error === 'object' && error !== null
      ? (error as { code?: string }).code
      : undefined;
  }
}
