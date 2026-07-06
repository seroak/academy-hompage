import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { InstructorsService } from './instructors.service';
import { PrismaService } from '../prisma/prisma.service';

describe('InstructorsService', () => {
  let service: InstructorsService;
  let prisma: {
    instructor: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      instructor: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [InstructorsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<InstructorsService>(InstructorsService);
  });

  describe('findAll', () => {
    it('returns all instructors ordered by name', async () => {
      const instructors = [{ id: '1', name: 'A' }];
      prisma.instructor.findMany.mockResolvedValue(instructors);

      const result = await service.findAll();

      expect(result).toBe(instructors);
      expect(prisma.instructor.findMany).toHaveBeenCalledWith({
        orderBy: { name: 'asc' },
      });
    });
  });

  describe('findOne', () => {
    it('returns the instructor with their courses when found', async () => {
      const instructor = { id: '1', name: 'A', courses: [] };
      prisma.instructor.findUnique.mockResolvedValue(instructor);

      const result = await service.findOne('1');

      expect(result).toBe(instructor);
      expect(prisma.instructor.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        include: { courses: true },
      });
    });

    it('throws NotFoundException when instructor does not exist', async () => {
      prisma.instructor.findUnique.mockResolvedValue(null);

      await expect(service.findOne('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('creates an instructor with the given data', async () => {
      const dto = { name: 'New', subject: '수학', bio: 'bio' };
      const created = { id: '2', ...dto };
      prisma.instructor.create.mockResolvedValue(created);

      const result = await service.create(dto);

      expect(result).toBe(created);
      expect(prisma.instructor.create).toHaveBeenCalledWith({ data: dto });
    });
  });

  describe('update', () => {
    it('updates an existing instructor', async () => {
      const updated = { id: '1', name: 'Updated' };
      prisma.instructor.update.mockResolvedValue(updated);

      const result = await service.update('1', { name: 'Updated' });

      expect(result).toBe(updated);
      expect(prisma.instructor.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { name: 'Updated' },
      });
    });

    it('throws NotFoundException when the instructor to update does not exist', async () => {
      prisma.instructor.update.mockRejectedValue({ code: 'P2025' });

      await expect(service.update('missing', { name: 'x' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('deletes an existing instructor', async () => {
      prisma.instructor.delete.mockResolvedValue({ id: '1' });

      await service.remove('1');

      expect(prisma.instructor.delete).toHaveBeenCalledWith({ where: { id: '1' } });
    });

    it('throws NotFoundException when the instructor to delete does not exist', async () => {
      prisma.instructor.delete.mockRejectedValue({ code: 'P2025' });

      await expect(service.remove('missing')).rejects.toThrow(NotFoundException);
    });

    it('throws ConflictException when the instructor still has courses', async () => {
      prisma.instructor.delete.mockRejectedValue({ code: 'P2003' });

      await expect(service.remove('1')).rejects.toThrow(ConflictException);
    });
  });
});
