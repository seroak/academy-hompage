import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: {
    admin: { findUnique: jest.Mock };
    parentUser: { findUnique: jest.Mock; create: jest.Mock; update: jest.Mock };
  };
  let jwtService: { sign: jest.Mock };

  beforeEach(async () => {
    prisma = {
      admin: { findUnique: jest.fn() },
      parentUser: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
    };
    jwtService = { sign: jest.fn().mockReturnValue('signed-token') };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('login', () => {
    it('returns an access token for valid credentials', async () => {
      const passwordHash = await bcrypt.hash('correct-password', 10);
      prisma.admin.findUnique.mockResolvedValue({
        id: 'admin-1',
        username: 'admin',
        passwordHash,
      });

      const result = await service.login('admin', 'correct-password');

      expect(result).toEqual({ accessToken: 'signed-token' });
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: 'admin-1',
        username: 'admin',
        tokenType: 'admin',
      });
    });

    it('throws UnauthorizedException for an unknown username', async () => {
      prisma.admin.findUnique.mockResolvedValue(null);

      await expect(service.login('nobody', 'whatever')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('throws UnauthorizedException for a wrong password', async () => {
      const passwordHash = await bcrypt.hash('correct-password', 10);
      prisma.admin.findUnique.mockResolvedValue({
        id: 'admin-1',
        username: 'admin',
        passwordHash,
      });

      await expect(service.login('admin', 'wrong-password')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('signupParent', () => {
    it('creates a parent user with a password hash and returns a parent token', async () => {
      prisma.parentUser.findUnique.mockResolvedValue(null);
      prisma.parentUser.create.mockResolvedValue({
        id: 'parent-1',
        email: 'parent@example.com',
        name: '김엄마',
      });

      const result = await service.signupParent({
        name: '김엄마',
        email: 'parent@example.com',
        password: 'password123',
      });

      expect(result).toEqual({
        accessToken: 'signed-token',
        parent: { id: 'parent-1', email: 'parent@example.com', name: '김엄마' },
      });
      expect(prisma.parentUser.create).toHaveBeenCalledWith({
        data: {
          name: '김엄마',
          email: 'parent@example.com',
          passwordHash: expect.any(String),
        },
      });
      const createArg = prisma.parentUser.create.mock.calls[0][0];
      await expect(bcrypt.compare('password123', createArg.data.passwordHash)).resolves.toBe(true);
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: 'parent-1',
        email: 'parent@example.com',
        name: '김엄마',
        tokenType: 'parent',
      });
    });

    it('throws ConflictException when the email already has a password login', async () => {
      prisma.parentUser.findUnique.mockResolvedValue({
        id: 'parent-1',
        email: 'parent@example.com',
        name: '김엄마',
        passwordHash: 'existing-hash',
      });

      await expect(
        service.signupParent({
          name: '김엄마',
          email: 'parent@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('adds a password hash to an existing social-only parent user', async () => {
      prisma.parentUser.findUnique.mockResolvedValue({
        id: 'parent-1',
        email: 'parent@example.com',
        name: '소셜이름',
        passwordHash: null,
      });
      prisma.parentUser.update.mockResolvedValue({
        id: 'parent-1',
        email: 'parent@example.com',
        name: '소셜이름',
      });

      const result = await service.signupParent({
        name: '김엄마',
        email: 'parent@example.com',
        password: 'password123',
      });

      expect(result.parent).toEqual({
        id: 'parent-1',
        email: 'parent@example.com',
        name: '소셜이름',
      });
      expect(prisma.parentUser.update).toHaveBeenCalledWith({
        where: { id: 'parent-1' },
        data: { passwordHash: expect.any(String), name: '소셜이름' },
      });
    });
  });

  describe('loginParent', () => {
    it('returns a parent token for valid credentials', async () => {
      const passwordHash = await bcrypt.hash('password123', 10);
      prisma.parentUser.findUnique.mockResolvedValue({
        id: 'parent-1',
        email: 'parent@example.com',
        name: '김엄마',
        passwordHash,
      });

      const result = await service.loginParent('parent@example.com', 'password123');

      expect(result).toEqual({
        accessToken: 'signed-token',
        parent: { id: 'parent-1', email: 'parent@example.com', name: '김엄마' },
      });
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: 'parent-1',
        email: 'parent@example.com',
        name: '김엄마',
        tokenType: 'parent',
      });
    });

    it('throws UnauthorizedException for an unknown email', async () => {
      prisma.parentUser.findUnique.mockResolvedValue(null);

      await expect(
        service.loginParent('missing@example.com', 'password123'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException for a social-only parent user', async () => {
      prisma.parentUser.findUnique.mockResolvedValue({
        id: 'parent-1',
        email: 'parent@example.com',
        name: '김엄마',
        passwordHash: null,
      });

      await expect(
        service.loginParent('parent@example.com', 'password123'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException for a wrong password', async () => {
      const passwordHash = await bcrypt.hash('password123', 10);
      prisma.parentUser.findUnique.mockResolvedValue({
        id: 'parent-1',
        email: 'parent@example.com',
        name: '김엄마',
        passwordHash,
      });

      await expect(
        service.loginParent('parent@example.com', 'wrong-password'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
