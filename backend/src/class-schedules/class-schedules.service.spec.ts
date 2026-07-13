import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ClassSchedulesService } from './class-schedules.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

const days = [
  { date: '2026-06-29', kind: 'CLASS' as const, classMonth: '2026-07' },
  { date: '2026-07-30', kind: 'CLASS' as const, classMonth: '2026-08' },
  { date: '2026-08-27', kind: 'CLASS' as const, classMonth: '2026-09' },
  { date: '2026-08-17', kind: 'HOLIDAY' as const, note: '대체공휴일' },
];

describe('ClassSchedulesService', () => {
  let service: ClassSchedulesService;
  let prisma: {
    classSchedule: {
      findMany: jest.Mock;
      findFirst: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      classSchedule: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };
    const module = await Test.createTestingModule({
      providers: [
        ClassSchedulesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get(ClassSchedulesService);
  });

  it('returns published schedule summaries newest first', async () => {
    prisma.classSchedule.findMany.mockResolvedValue([{ id: 'schedule-1' }]);

    await expect(service.findPublished()).resolves.toEqual([
      { id: 'schedule-1' },
    ]);
    expect(prisma.classSchedule.findMany).toHaveBeenCalledWith({
      where: { status: 'PUBLISHED' },
      include: { days: { orderBy: { date: 'asc' } } },
      orderBy: [{ year: 'desc' }, { quarter: 'desc' }],
    });
  });

  it('finds one published schedule by year and quarter', async () => {
    prisma.classSchedule.findFirst.mockResolvedValue({ id: 'schedule-1' });

    await expect(service.findPublishedOne(2026, 3)).resolves.toEqual({
      id: 'schedule-1',
    });
    expect(prisma.classSchedule.findFirst).toHaveBeenCalledWith({
      where: { year: 2026, quarter: 3, status: 'PUBLISHED' },
      include: { days: { orderBy: { date: 'asc' } } },
    });
  });

  it('rejects an invalid public quarter before querying', async () => {
    await expect(service.findPublishedOne(2026, 5)).rejects.toThrow(
      '분기는 1부터 4까지 입력해 주세요.',
    );
    expect(prisma.classSchedule.findFirst).not.toHaveBeenCalled();
  });

  it('rejects a duplicate year and quarter', async () => {
    prisma.classSchedule.create.mockRejectedValue({ code: 'P2002' });

    await expect(
      service.create({ year: 2026, quarter: 3, days }),
    ).rejects.toThrow(ConflictException);
  });

  it('replaces all date entries when saving', async () => {
    prisma.classSchedule.findUnique.mockResolvedValue({
      id: 'schedule-1',
      year: 2026,
      quarter: 3,
    });
    prisma.classSchedule.update.mockResolvedValue({ id: 'schedule-1' });

    await service.update('schedule-1', { days });

    expect(prisma.classSchedule.update).toHaveBeenCalledWith({
      where: { id: 'schedule-1' },
      data: {
        days: {
          deleteMany: {},
          create: days.map((day) => ({
            ...day,
            note: day.note ?? null,
            classMonth: day.classMonth ?? null,
          })),
        },
      },
      include: { days: { orderBy: { date: 'asc' } } },
    });
  });

  it('saves adjacent-week dates with previous and next month colors', async () => {
    const adjacentDays = [
      { date: '2026-03-29', kind: 'CLASS' as const, classMonth: '2026-03' },
      { date: '2026-07-04', kind: 'CLASS' as const, classMonth: '2026-07' },
    ];
    prisma.classSchedule.findUnique.mockResolvedValue({
      id: 'schedule-1',
      year: 2026,
      quarter: 2,
    });
    prisma.classSchedule.update.mockResolvedValue({ id: 'schedule-1' });

    await service.update('schedule-1', { days: adjacentDays });

    expect(prisma.classSchedule.update).toHaveBeenCalled();
  });

  it('rejects update dates outside the schedule quarter', async () => {
    prisma.classSchedule.findUnique.mockResolvedValue({
      id: 'schedule-1',
      year: 2026,
      quarter: 3,
    });

    await expect(
      service.update('schedule-1', {
        days: [{ date: '2026-11-01', kind: 'CLASS', classMonth: '2026-09' }],
      }),
    ).rejects.toThrow('분기 범위와 수업 월 지정이 올바르지 않습니다.');
    expect(prisma.classSchedule.update).not.toHaveBeenCalled();
  });

  it('requires at least one class day for every quarter month before publishing', async () => {
    prisma.classSchedule.findUnique.mockResolvedValue({
      id: 'schedule-1',
      year: 2026,
      quarter: 3,
      days: days.filter((day) => day.classMonth !== '2026-09'),
    });

    await expect(service.publish('schedule-1')).rejects.toThrow(
      '7월분, 8월분, 9월분 수업일을 각각 한 개 이상 지정해 주세요.',
    );
    expect(prisma.classSchedule.update).not.toHaveBeenCalled();
  });

  it('publishes a complete schedule', async () => {
    const publishedAt = new Date('2026-07-13T00:00:00.000Z');
    jest.useFakeTimers().setSystemTime(publishedAt);
    prisma.classSchedule.findUnique.mockResolvedValue({
      id: 'schedule-1',
      year: 2026,
      quarter: 3,
      days,
    });
    prisma.classSchedule.update.mockResolvedValue({
      id: 'schedule-1',
      status: 'PUBLISHED',
    });

    await service.publish('schedule-1');

    expect(prisma.classSchedule.update).toHaveBeenCalledWith({
      where: { id: 'schedule-1' },
      data: { status: 'PUBLISHED', publishedAt },
      include: { days: { orderBy: { date: 'asc' } } },
    });
    jest.useRealTimers();
  });

  it('maps missing records to NotFoundException', async () => {
    prisma.classSchedule.delete.mockRejectedValue({ code: 'P2025' });

    await expect(service.remove('missing')).rejects.toThrow(NotFoundException);
  });
});
