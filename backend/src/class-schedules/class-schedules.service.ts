import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateClassScheduleDto } from './dto/create-class-schedule.dto.js';
import type { UpdateClassScheduleDto } from './dto/update-class-schedule.dto.js';
import {
  areScheduleDaysValid,
  quarterClassMonths,
} from './dto/class-schedule-days.validator.js';
import { hasPrismaErrorCode } from '../common/prisma-errors.js';

const withDays = { days: { orderBy: { date: 'asc' as const } } };

@Injectable()
export class ClassSchedulesService {
  constructor(private readonly prisma: PrismaService) {}

  findPublished() {
    return this.prisma.classSchedule.findMany({
      where: { status: 'PUBLISHED' },
      include: withDays,
      orderBy: [{ year: 'desc' }, { quarter: 'desc' }],
    });
  }

  async findPublishedOne(year: number, quarter: number) {
    if (quarter < 1 || quarter > 4) {
      throw new BadRequestException('분기는 1부터 4까지 입력해 주세요.');
    }
    const schedule = await this.prisma.classSchedule.findFirst({
      where: { year, quarter, status: 'PUBLISHED' },
      include: withDays,
    });
    if (!schedule) throw new NotFoundException('게시된 수업 일정이 없습니다.');
    return schedule;
  }

  findAll() {
    return this.prisma.classSchedule.findMany({
      include: withDays,
      orderBy: [{ year: 'desc' }, { quarter: 'desc' }],
    });
  }

  async create(dto: CreateClassScheduleDto) {
    try {
      return await this.prisma.classSchedule.create({
        data: {
          year: dto.year,
          quarter: dto.quarter,
          days: { create: this.normalizeDays(dto.days) },
        },
        include: withDays,
      });
    } catch (error) {
      if (hasPrismaErrorCode(error, 'P2002'))
        throw new ConflictException('이미 등록된 연도와 분기입니다.');
      throw error;
    }
  }

  async update(id: string, dto: UpdateClassScheduleDto) {
    if (dto.days) {
      const schedule = await this.prisma.classSchedule.findUnique({
        where: { id },
      });
      if (!schedule)
        throw new NotFoundException('수업 일정을 찾을 수 없습니다.');
      if (!areScheduleDaysValid(schedule.year, schedule.quarter, dto.days)) {
        throw new BadRequestException(
          '분기 범위와 수업 월 지정이 올바르지 않습니다.',
        );
      }
    }
    try {
      return await this.prisma.classSchedule.update({
        where: { id },
        data: dto.days
          ? { days: { deleteMany: {}, create: this.normalizeDays(dto.days) } }
          : {},
        include: withDays,
      });
    } catch (error) {
      if (hasPrismaErrorCode(error, 'P2025'))
        throw new NotFoundException('수업 일정을 찾을 수 없습니다.');
      throw error;
    }
  }

  async publish(id: string) {
    const schedule = await this.prisma.classSchedule.findUnique({
      where: { id },
      include: { days: true },
    });
    if (!schedule) throw new NotFoundException('수업 일정을 찾을 수 없습니다.');
    const months = quarterClassMonths(schedule.year, schedule.quarter);
    if (
      !months.every((month) =>
        schedule.days.some(
          (day) => day.kind === 'CLASS' && day.classMonth === month,
        ),
      )
    ) {
      throw new BadRequestException(
        `${months.map((month) => `${Number(month.slice(5))}월분`).join(', ')} 수업일을 각각 한 개 이상 지정해 주세요.`,
      );
    }
    return this.prisma.classSchedule.update({
      where: { id },
      data: { status: 'PUBLISHED', publishedAt: new Date() },
      include: withDays,
    });
  }

  async remove(id: string) {
    try {
      await this.prisma.classSchedule.delete({ where: { id } });
    } catch (error) {
      if (hasPrismaErrorCode(error, 'P2025'))
        throw new NotFoundException('수업 일정을 찾을 수 없습니다.');
      throw error;
    }
  }

  private normalizeDays(days: CreateClassScheduleDto['days']) {
    return days.map((day) => ({
      ...day,
      classMonth: day.classMonth ?? null,
      note: day.note ?? null,
    }));
  }
}
