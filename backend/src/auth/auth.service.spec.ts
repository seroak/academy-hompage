import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: { admin: { findUnique: jest.Mock } };
  let jwtService: { sign: jest.Mock };

  beforeEach(async () => {
    prisma = { admin: { findUnique: jest.fn() } };
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
});
