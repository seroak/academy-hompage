import { ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { AdminAccountsService } from './admin-accounts.service';

describe('AdminAccountsService', () => {
  let service: AdminAccountsService;
  let prisma: { admin: { findUnique: jest.Mock; create: jest.Mock } };

  beforeEach(async () => {
    prisma = { admin: { findUnique: jest.fn(), create: jest.fn() } };
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
});
