import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service.js';
import { AdminAccountsService } from './admin-accounts.service.js';

describe('AdminAccountsService', () => {
  let service: AdminAccountsService;
  let prisma: {
    admin: {
      findUnique: jest.Mock;
      create: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
      delete: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      admin: {
        findUnique: jest.fn(),
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        delete: jest.fn(),
      },
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminAccountsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get(AdminAccountsService);
  });

  it('creates an administrator with a hashed password', async () => {
    prisma.admin.findUnique.mockResolvedValue(null);
    prisma.admin.create.mockResolvedValue({
      id: 'admin-2',
      username: 'reservation',
      createdAt: new Date('2026-07-10T00:00:00.000Z'),
    });

    const result = await service.create({
      username: 'reservation',
      password: 'password123',
    });

    expect(result).toMatchObject({ username: 'reservation' });
    const createInput = prisma.admin.create.mock.calls[0][0];
    await expect(bcrypt.compare('password123', createInput.data.passwordHash)).resolves.toBe(true);
    expect(createInput.data).toEqual({
      username: 'reservation',
      passwordHash: expect.any(String),
    });
  });

  it('rejects a duplicate administrator username', async () => {
    prisma.admin.findUnique.mockResolvedValue({ id: 'admin-1' });

    await expect(
      service.create({
        username: 'admin',
        password: 'password123',
      }),
    ).rejects.toThrow(ConflictException);
    expect(prisma.admin.create).not.toHaveBeenCalled();
  });

  describe('findAll', () => {
    it('returns admins with a safe select shape', async () => {
      const admins = [{ id: 'admin-1', username: 'admin', createdAt: new Date() }];
      prisma.admin.findMany.mockResolvedValue(admins);

      const result = await service.findAll();

      expect(result).toBe(admins);
      expect(prisma.admin.findMany).toHaveBeenCalledWith({
        select: { id: true, username: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
      });
    });
  });

  describe('remove', () => {
    it('rejects deleting your own account', async () => {
      await expect(service.remove('admin-1', 'admin-1')).rejects.toThrow(BadRequestException);
      expect(prisma.admin.count).not.toHaveBeenCalled();
      expect(prisma.admin.delete).not.toHaveBeenCalled();
    });

    it('rejects deleting the last remaining admin', async () => {
      prisma.admin.count.mockResolvedValue(1);

      await expect(service.remove('admin-2', 'admin-1')).rejects.toThrow(BadRequestException);
      expect(prisma.admin.delete).not.toHaveBeenCalled();
    });

    it('deletes another admin when more than one remains', async () => {
      prisma.admin.count.mockResolvedValue(2);
      prisma.admin.delete.mockResolvedValue({ id: 'admin-2' });

      await service.remove('admin-2', 'admin-1');

      expect(prisma.admin.delete).toHaveBeenCalledWith({ where: { id: 'admin-2' } });
    });

    it('throws NotFoundException when the admin no longer exists', async () => {
      prisma.admin.count.mockResolvedValue(2);
      prisma.admin.delete.mockRejectedValue({ code: 'P2025' });

      await expect(service.remove('admin-2', 'admin-1')).rejects.toThrow(NotFoundException);
    });
  });
});
