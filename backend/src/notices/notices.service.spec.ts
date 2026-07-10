import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { NoticesService } from './notices.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

describe('NoticesService', () => {
  let service: NoticesService;
  let prisma: {
    notice: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      notice: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [NoticesService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<NoticesService>(NoticesService);
  });

  describe('findAll', () => {
    it('returns notices with pinned first, then newest first', async () => {
      const notices = [{ id: '1', title: 'Notice A' }];
      prisma.notice.findMany.mockResolvedValue(notices);

      const result = await service.findAll();

      expect(result).toBe(notices);
      expect(prisma.notice.findMany).toHaveBeenCalledWith({
        orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
      });
    });
  });

  describe('findOne', () => {
    it('returns the notice when found', async () => {
      const notice = { id: '1', title: 'Notice A' };
      prisma.notice.findUnique.mockResolvedValue(notice);

      const result = await service.findOne('1');

      expect(result).toBe(notice);
      expect(prisma.notice.findUnique).toHaveBeenCalledWith({ where: { id: '1' } });
    });

    it('throws NotFoundException when notice does not exist', async () => {
      prisma.notice.findUnique.mockResolvedValue(null);

      await expect(service.findOne('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('creates a notice with the given data', async () => {
      const dto = { title: 'New Notice', content: 'body', pinned: false };
      const created = { id: '2', ...dto };
      prisma.notice.create.mockResolvedValue(created);

      const result = await service.create(dto);

      expect(result).toBe(created);
      expect(prisma.notice.create).toHaveBeenCalledWith({ data: dto });
    });
  });

  describe('update', () => {
    it('updates an existing notice', async () => {
      const updated = { id: '1', title: 'Updated' };
      prisma.notice.update.mockResolvedValue(updated);

      const result = await service.update('1', { title: 'Updated' });

      expect(result).toBe(updated);
      expect(prisma.notice.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { title: 'Updated' },
      });
    });

    it('throws NotFoundException when the notice to update does not exist', async () => {
      prisma.notice.update.mockRejectedValue({ code: 'P2025' });

      await expect(service.update('missing', { title: 'x' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('deletes an existing notice', async () => {
      prisma.notice.delete.mockResolvedValue({ id: '1' });

      await service.remove('1');

      expect(prisma.notice.delete).toHaveBeenCalledWith({ where: { id: '1' } });
    });

    it('throws NotFoundException when the notice to delete does not exist', async () => {
      prisma.notice.delete.mockRejectedValue({ code: 'P2025' });

      await expect(service.remove('missing')).rejects.toThrow(NotFoundException);
    });
  });
});
