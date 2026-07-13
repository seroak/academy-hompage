import { Test, TestingModule } from '@nestjs/testing';
import { OAuthProvider } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ParentSocialAccountService } from './parent-social-account.service.js';

describe('ParentSocialAccountService', () => {
  let service: ParentSocialAccountService;
  let prisma: {
    parentSocialAccount: { findUnique: jest.Mock; update: jest.Mock; create: jest.Mock };
    parentUser: { findUnique: jest.Mock; create: jest.Mock; update: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      parentSocialAccount: {
        findUnique: jest.fn(),
        update: jest.fn(),
        create: jest.fn(),
      },
      parentUser: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ParentSocialAccountService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<ParentSocialAccountService>(ParentSocialAccountService);
  });

  describe('upsertParentUser', () => {
    it('normalizes email casing/whitespace when looking up an existing password-signup account to merge into', async () => {
      prisma.parentSocialAccount.findUnique.mockResolvedValue(null);
      prisma.parentUser.findUnique.mockResolvedValue({
        id: 'parent-1',
        email: 'parent@example.com',
        name: null,
      });
      prisma.parentUser.update.mockResolvedValue({
        id: 'parent-1',
        email: 'parent@example.com',
        name: '김보호',
      });
      prisma.parentSocialAccount.create.mockResolvedValue({});

      await service.upsertParentUser('google', {
        providerAccountId: 'google-sub-1',
        email: ' Parent@Example.COM ',
        name: '김보호',
      });

      expect(prisma.parentUser.findUnique).toHaveBeenCalledWith({
        where: { email: 'parent@example.com' },
      });
      expect(prisma.parentUser.create).not.toHaveBeenCalled();
      expect(prisma.parentSocialAccount.create).toHaveBeenCalledWith({
        data: {
          provider: OAuthProvider.GOOGLE,
          providerAccountId: 'google-sub-1',
          profileEmail: ' Parent@Example.COM ',
          profileName: '김보호',
          parentUserId: 'parent-1',
        },
      });
    });

    it('stores a normalized email when creating a brand-new parent user', async () => {
      prisma.parentSocialAccount.findUnique.mockResolvedValue(null);
      prisma.parentUser.findUnique.mockResolvedValue(null);
      prisma.parentUser.create.mockResolvedValue({
        id: 'parent-2',
        email: 'newuser@example.com',
        name: '이보호',
      });
      prisma.parentSocialAccount.create.mockResolvedValue({});

      await service.upsertParentUser('google', {
        providerAccountId: 'google-sub-2',
        email: 'NewUser@Example.com',
        name: '이보호',
      });

      expect(prisma.parentUser.create).toHaveBeenCalledWith({
        data: { email: 'newuser@example.com', name: '이보호' },
      });
    });

    it('normalizes email when updating the parent user of an already-linked social account', async () => {
      prisma.parentSocialAccount.findUnique.mockResolvedValue({
        id: 'social-1',
        parentUserId: 'parent-3',
        parentUser: { id: 'parent-3', email: 'old@example.com', name: '김보호' },
      });
      prisma.parentSocialAccount.update.mockResolvedValue({});
      prisma.parentUser.update.mockResolvedValue({
        id: 'parent-3',
        email: 'changed@example.com',
        name: '김보호',
      });

      await service.upsertParentUser('google', {
        providerAccountId: 'google-sub-3',
        email: 'Changed@Example.com',
        name: '김보호',
      });

      expect(prisma.parentUser.update).toHaveBeenCalledWith({
        where: { id: 'parent-3' },
        data: { email: 'changed@example.com', name: '김보호' },
      });
    });
  });
});
