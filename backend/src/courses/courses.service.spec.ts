import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { PrismaService } from '../prisma/prisma.service';

describe('CoursesService', () => {
  let service: CoursesService;
  let prisma: {
    course: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      course: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [CoursesService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<CoursesService>(CoursesService);
  });

  describe('findAll', () => {
    it('returns all courses ordered by newest first', async () => {
      const courses = [{ id: '1', title: 'Course A' }];
      prisma.course.findMany.mockResolvedValue(courses);

      const result = await service.findAll();

      expect(result).toBe(courses);
      expect(prisma.course.findMany).toHaveBeenCalledWith({
        include: { instructor: true },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('findOne', () => {
    it('returns the course when found', async () => {
      const course = { id: '1', title: 'Course A' };
      prisma.course.findUnique.mockResolvedValue(course);

      const result = await service.findOne('1');

      expect(result).toBe(course);
      expect(prisma.course.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        include: { instructor: true },
      });
    });

    it('throws NotFoundException when course does not exist', async () => {
      prisma.course.findUnique.mockResolvedValue(null);

      await expect(service.findOne('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('creates a course with the given data', async () => {
      const dto = {
        title: 'New Course',
        description: 'desc',
        category: '수학',
        level: '초급',
        tuition: 100000,
        schedule: '월 10:00',
        instructorId: 'instructor-1',
      };
      const created = { id: '2', ...dto };
      prisma.course.create.mockResolvedValue(created);

      const result = await service.create(dto);

      expect(result).toBe(created);
      expect(prisma.course.create).toHaveBeenCalledWith({ data: dto });
    });
  });

  describe('update', () => {
    it('updates an existing course', async () => {
      const updated = { id: '1', title: 'Updated' };
      prisma.course.update.mockResolvedValue(updated);

      const result = await service.update('1', { title: 'Updated' });

      expect(result).toBe(updated);
      expect(prisma.course.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { title: 'Updated' },
      });
    });

    it('throws NotFoundException when the course to update does not exist', async () => {
      prisma.course.update.mockRejectedValue({ code: 'P2025' });

      await expect(service.update('missing', { title: 'x' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('deletes an existing course', async () => {
      prisma.course.delete.mockResolvedValue({ id: '1' });

      await service.remove('1');

      expect(prisma.course.delete).toHaveBeenCalledWith({ where: { id: '1' } });
    });

    it('throws NotFoundException when the course to delete does not exist', async () => {
      prisma.course.delete.mockRejectedValue({ code: 'P2025' });

      await expect(service.remove('missing')).rejects.toThrow(NotFoundException);
    });
  });
});
