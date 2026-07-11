import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { NotificationService } from '../notifications/notification.service.js';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: {
    admin: { findUnique: jest.Mock };
    parentUser: { findUnique: jest.Mock; create: jest.Mock; update: jest.Mock };
    parentEmailVerification: { findUnique: jest.Mock; upsert: jest.Mock; update: jest.Mock };
  };
  let jwtService: { sign: jest.Mock };
  let notificationService: { sendParentEmailVerification: jest.Mock };

  beforeEach(async () => {
    prisma = {
      admin: { findUnique: jest.fn() },
      parentUser: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
      parentEmailVerification: { findUnique: jest.fn(), upsert: jest.fn(), update: jest.fn() },
    };
    jwtService = { sign: jest.fn().mockReturnValue('signed-token') };
    notificationService = { sendParentEmailVerification: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: { get: jest.fn((_key: string, def?: string) => def) } },
        { provide: NotificationService, useValue: notificationService },
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

      expect(result).toEqual({
        accessToken: 'signed-token',
        admin: { id: 'admin-1', username: 'admin' },
      });
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
    it('stores a pending email verification and sends a verification email instead of creating an account', async () => {
      prisma.parentUser.findUnique.mockResolvedValue(null);
      prisma.parentEmailVerification.upsert.mockResolvedValue({
        email: 'parent@example.com',
        token: 'some-token',
      });

      const result = await service.signupParent({
        name: '김엄마',
        email: 'parent@example.com',
        password: 'password123',
      });

      expect(result).toEqual({ email: 'parent@example.com', verificationSent: true });
      expect(prisma.parentUser.create).not.toHaveBeenCalled();
      expect(prisma.parentEmailVerification.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { email: 'parent@example.com' },
          create: expect.objectContaining({
            email: 'parent@example.com',
            name: '김엄마',
            passwordHash: expect.any(String),
            token: expect.any(String),
            expiresAt: expect.any(Date),
          }),
          update: expect.objectContaining({
            name: '김엄마',
            passwordHash: expect.any(String),
            token: expect.any(String),
            expiresAt: expect.any(Date),
            consumedAt: null,
          }),
        }),
      );
      const upsertArg = prisma.parentEmailVerification.upsert.mock.calls[0][0];
      await expect(
        bcrypt.compare('password123', upsertArg.create.passwordHash),
      ).resolves.toBe(true);
      expect(notificationService.sendParentEmailVerification).toHaveBeenCalledWith(
        'parent@example.com',
        '김엄마',
        expect.stringContaining(upsertArg.create.token),
      );
      expect(jwtService.sign).not.toHaveBeenCalled();
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
      expect(prisma.parentEmailVerification.upsert).not.toHaveBeenCalled();
      expect(notificationService.sendParentEmailVerification).not.toHaveBeenCalled();
    });

    it('stores a pending verification for an existing social-only parent user without conflict', async () => {
      prisma.parentUser.findUnique.mockResolvedValue({
        id: 'parent-1',
        email: 'parent@example.com',
        name: '소셜이름',
        passwordHash: null,
      });
      prisma.parentEmailVerification.upsert.mockResolvedValue({
        email: 'parent@example.com',
        token: 'some-token',
      });

      const result = await service.signupParent({
        name: '김엄마',
        email: 'parent@example.com',
        password: 'password123',
      });

      expect(result).toEqual({ email: 'parent@example.com', verificationSent: true });
      expect(notificationService.sendParentEmailVerification).toHaveBeenCalled();
    });
  });

  describe('verifyParentEmail', () => {
    it('creates a parent user and returns a login response for a valid token', async () => {
      prisma.parentEmailVerification.findUnique.mockResolvedValue({
        id: 'verification-1',
        email: 'parent@example.com',
        name: '김엄마',
        passwordHash: 'hashed-pw',
        token: 'valid-token',
        expiresAt: new Date(Date.now() + 60_000),
        consumedAt: null,
      });
      prisma.parentUser.findUnique.mockResolvedValue(null);
      prisma.parentUser.create.mockResolvedValue({
        id: 'parent-1',
        email: 'parent@example.com',
        name: '김엄마',
      });

      const result = await service.verifyParentEmail('valid-token');

      expect(result).toEqual({
        accessToken: 'signed-token',
        parent: { id: 'parent-1', email: 'parent@example.com', name: '김엄마' },
      });
      expect(prisma.parentUser.create).toHaveBeenCalledWith({
        data: {
          email: 'parent@example.com',
          name: '김엄마',
          passwordHash: 'hashed-pw',
        },
      });
      expect(prisma.parentEmailVerification.update).toHaveBeenCalledWith({
        where: { id: 'verification-1' },
        data: { consumedAt: expect.any(Date) },
      });
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: 'parent-1',
        email: 'parent@example.com',
        name: '김엄마',
        tokenType: 'parent',
      });
    });

    it('merges into an existing social-only parent user', async () => {
      prisma.parentEmailVerification.findUnique.mockResolvedValue({
        id: 'verification-1',
        email: 'parent@example.com',
        name: '김엄마',
        passwordHash: 'hashed-pw',
        token: 'valid-token',
        expiresAt: new Date(Date.now() + 60_000),
        consumedAt: null,
      });
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

      const result = await service.verifyParentEmail('valid-token');

      expect(result.parent).toEqual({
        id: 'parent-1',
        email: 'parent@example.com',
        name: '소셜이름',
      });
      expect(prisma.parentUser.update).toHaveBeenCalledWith({
        where: { id: 'parent-1' },
        data: { passwordHash: 'hashed-pw', name: '소셜이름' },
      });
      expect(prisma.parentUser.create).not.toHaveBeenCalled();
    });

    it('throws ConflictException when the email already gained a password login elsewhere', async () => {
      prisma.parentEmailVerification.findUnique.mockResolvedValue({
        id: 'verification-1',
        email: 'parent@example.com',
        name: '김엄마',
        passwordHash: 'hashed-pw',
        token: 'valid-token',
        expiresAt: new Date(Date.now() + 60_000),
        consumedAt: null,
      });
      prisma.parentUser.findUnique.mockResolvedValue({
        id: 'parent-1',
        email: 'parent@example.com',
        name: '다른경로가입',
        passwordHash: 'already-set',
      });

      await expect(service.verifyParentEmail('valid-token')).rejects.toThrow(
        ConflictException,
      );
      expect(prisma.parentUser.update).not.toHaveBeenCalled();
      expect(prisma.parentUser.create).not.toHaveBeenCalled();
    });

    it('throws BadRequestException for an unknown token', async () => {
      prisma.parentEmailVerification.findUnique.mockResolvedValue(null);

      await expect(service.verifyParentEmail('missing-token')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws BadRequestException for an expired token', async () => {
      prisma.parentEmailVerification.findUnique.mockResolvedValue({
        id: 'verification-1',
        email: 'parent@example.com',
        name: '김엄마',
        passwordHash: 'hashed-pw',
        token: 'expired-token',
        expiresAt: new Date(Date.now() - 1000),
        consumedAt: null,
      });

      await expect(service.verifyParentEmail('expired-token')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws BadRequestException for an already consumed token', async () => {
      prisma.parentEmailVerification.findUnique.mockResolvedValue({
        id: 'verification-1',
        email: 'parent@example.com',
        name: '김엄마',
        passwordHash: 'hashed-pw',
        token: 'consumed-token',
        expiresAt: new Date(Date.now() + 60_000),
        consumedAt: new Date(),
      });

      await expect(service.verifyParentEmail('consumed-token')).rejects.toThrow(
        BadRequestException,
      );
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
