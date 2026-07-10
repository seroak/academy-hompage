import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service.js';
import { ChildrenService } from './children.service.js';

describe('ChildrenService', () => {
  let service: ChildrenService;
  let prisma: {
    child: { findMany: jest.Mock; create: jest.Mock; updateMany: jest.Mock; deleteMany: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      child: {
        findMany: jest.fn(),
        create: jest.fn(),
        updateMany: jest.fn(),
        deleteMany: jest.fn(),
      },
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [ChildrenService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get(ChildrenService);
  });

  it('보호자 소유 자녀만 생성한다', async () => {
    const created = { id: 'child-1', parentUserId: 'parent-1', name: '민준', age: 5 };
    prisma.child.create.mockResolvedValue(created);

    await expect(service.create({ name: '민준', age: 5 }, 'parent-1')).resolves.toBe(created);
    expect(prisma.child.create).toHaveBeenCalledWith({
      data: { name: '민준', age: 5, parentUserId: 'parent-1' },
    });
  });

  it('보호자 소유 자녀를 생성일 역순으로 조회한다', async () => {
    prisma.child.findMany.mockResolvedValue([]);

    await service.findAll('parent-1');

    expect(prisma.child.findMany).toHaveBeenCalledWith({
      where: { parentUserId: 'parent-1' },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('다른 보호자의 자녀는 수정할 수 없어 404를 반환한다', async () => {
    prisma.child.updateMany.mockResolvedValue({ count: 0 });

    await expect(service.update('child-1', { name: '수정', age: 6 }, 'parent-1')).rejects.toThrow(
      NotFoundException,
    );
    expect(prisma.child.updateMany).toHaveBeenCalledWith({
      where: { id: 'child-1', parentUserId: 'parent-1' },
      data: { name: '수정', age: 6 },
    });
  });

  it('자녀 삭제 시 연결된 이력은 보존하고 childId만 해제한다', async () => {
    prisma.child.deleteMany.mockResolvedValue({ count: 1 });

    await service.remove('child-1', 'parent-1');

    expect(prisma.child.deleteMany).toHaveBeenCalledWith({
      where: { id: 'child-1', parentUserId: 'parent-1' },
    });
  });
});
