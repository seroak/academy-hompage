import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { LevelTestsService } from './level-tests.service';
import { PrismaService } from '../prisma/prisma.service';

describe('LevelTestsService', () => {
  let service: LevelTestsService;
  let prisma: {
    levelTestQuestion: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    levelTestAgeConfig: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      upsert: jest.Mock;
    };
    levelTestResult: {
      create: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
    };
    parentUser: { findUnique: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      levelTestQuestion: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      levelTestAgeConfig: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        upsert: jest.fn(),
      },
      levelTestResult: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
      parentUser: { findUnique: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [LevelTestsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<LevelTestsService>(LevelTestsService);
  });

  describe('findAllQuestions', () => {
    it('나이 필터 없이 전체 문항을 반환한다', async () => {
      const questions = [{ id: 'q1' }];
      prisma.levelTestQuestion.findMany.mockResolvedValue(questions);

      const result = await service.findAllQuestions();

      expect(result).toBe(questions);
      expect(prisma.levelTestQuestion.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: [{ age: 'asc' }, { createdAt: 'desc' }],
      });
    });

    it('나이로 필터링한다', async () => {
      prisma.levelTestQuestion.findMany.mockResolvedValue([]);

      await service.findAllQuestions(5);

      expect(prisma.levelTestQuestion.findMany).toHaveBeenCalledWith({
        where: { age: 5 },
        orderBy: [{ age: 'asc' }, { createdAt: 'desc' }],
      });
    });
  });

  describe('findOneQuestion', () => {
    it('존재하면 반환한다', async () => {
      const question = { id: 'q1' };
      prisma.levelTestQuestion.findUnique.mockResolvedValue(question);

      await expect(service.findOneQuestion('q1')).resolves.toBe(question);
    });

    it('없으면 NotFoundException을 던진다', async () => {
      prisma.levelTestQuestion.findUnique.mockResolvedValue(null);

      await expect(service.findOneQuestion('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createQuestion / updateQuestion / removeQuestion', () => {
    it('문항을 생성한다', async () => {
      const dto = {
        age: 5,
        type: 'MULTIPLE_CHOICE',
        prompt: '다음 중 사과는?',
        choices: ['사과', '바나나'],
        correctChoiceIndex: 0,
      } as any;
      const created = { id: 'q1', ...dto };
      prisma.levelTestQuestion.create.mockResolvedValue(created);

      const result = await service.createQuestion(dto);

      expect(result).toBe(created);
      expect(prisma.levelTestQuestion.create).toHaveBeenCalledWith({ data: dto });
    });

    it('문항을 수정한다', async () => {
      const updated = { id: 'q1', prompt: '수정됨' };
      prisma.levelTestQuestion.update.mockResolvedValue(updated);

      await expect(service.updateQuestion('q1', { prompt: '수정됨' } as any)).resolves.toBe(
        updated,
      );
    });

    it('수정 대상이 없으면 NotFoundException을 던진다', async () => {
      prisma.levelTestQuestion.update.mockRejectedValue({ code: 'P2025' });

      await expect(service.updateQuestion('missing', {} as any)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('문항을 삭제한다', async () => {
      prisma.levelTestQuestion.delete.mockResolvedValue({ id: 'q1' });

      await service.removeQuestion('q1');

      expect(prisma.levelTestQuestion.delete).toHaveBeenCalledWith({ where: { id: 'q1' } });
    });

    it('삭제 대상이 없으면 NotFoundException을 던진다', async () => {
      prisma.levelTestQuestion.delete.mockRejectedValue({ code: 'P2025' });

      await expect(service.removeQuestion('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('config', () => {
    it('나이별 출제 수 목록을 반환한다', async () => {
      const configs = [{ age: 5, drawCount: 3 }];
      prisma.levelTestAgeConfig.findMany.mockResolvedValue(configs);

      await expect(service.findAllConfigs()).resolves.toBe(configs);
      expect(prisma.levelTestAgeConfig.findMany).toHaveBeenCalledWith({
        orderBy: { age: 'asc' },
      });
    });

    it('나이별 출제 수를 upsert한다', async () => {
      const upserted = { age: 5, drawCount: 3 };
      prisma.levelTestAgeConfig.upsert.mockResolvedValue(upserted);

      await expect(service.upsertConfig(5, { drawCount: 3 })).resolves.toBe(upserted);
      expect(prisma.levelTestAgeConfig.upsert).toHaveBeenCalledWith({
        where: { age: 5 },
        create: { age: 5, drawCount: 3 },
        update: { drawCount: 3 },
      });
    });
  });

  describe('getQuiz', () => {
    it('나이/활성 문항을 조회해 설정된 출제 수만큼 무작위로 반환하고 정답은 제외한다', async () => {
      const questions = [
        { id: 'q1', age: 5, type: 'MULTIPLE_CHOICE', prompt: 'p1', choices: ['a', 'b'], correctChoiceIndex: 0, active: true },
        { id: 'q2', age: 5, type: 'MULTIPLE_CHOICE', prompt: 'p2', choices: ['a', 'b'], correctChoiceIndex: 1, active: true },
        { id: 'q3', age: 5, type: 'SHORT_ANSWER', prompt: 'p3', choices: [], correctChoiceIndex: null, active: true },
        { id: 'q4', age: 5, type: 'SHORT_ANSWER', prompt: 'p4', choices: [], correctChoiceIndex: null, active: true },
      ];
      prisma.levelTestAgeConfig.findUnique.mockResolvedValue({ age: 5, drawCount: 2 });
      prisma.levelTestQuestion.findMany.mockResolvedValue(questions);

      const result = await service.getQuiz(5);

      expect(prisma.levelTestAgeConfig.findUnique).toHaveBeenCalledWith({ where: { age: 5 } });
      expect(prisma.levelTestQuestion.findMany).toHaveBeenCalledWith({
        where: { age: 5, active: true },
      });
      expect(result).toHaveLength(2);
      result.forEach((question) => {
        expect(question).not.toHaveProperty('correctChoiceIndex');
        expect(questions.map((q) => q.id)).toContain(question.id);
      });
    });

    it('설정이 없으면 기본 5문항까지 출제한다', async () => {
      const questions = [
        { id: 'q1', age: 6, type: 'SHORT_ANSWER', prompt: 'p1', choices: [], correctChoiceIndex: null, active: true },
        { id: 'q2', age: 6, type: 'SHORT_ANSWER', prompt: 'p2', choices: [], correctChoiceIndex: null, active: true },
      ];
      prisma.levelTestAgeConfig.findUnique.mockResolvedValue(null);
      prisma.levelTestQuestion.findMany.mockResolvedValue(questions);

      const result = await service.getQuiz(6);

      expect(result).toHaveLength(2);
    });
  });

  describe('submitResult', () => {
    const dto = {
      childName: '민준',
      childAge: 5,
      answers: [
        { questionId: 'q1', selectedChoiceIndex: 0 },
        { questionId: 'q2', selectedChoiceIndex: 1 },
        { questionId: 'q3', textAnswer: '제 답변입니다' },
      ],
    } as any;

    const questions = [
      { id: 'q1', type: 'MULTIPLE_CHOICE', prompt: 'p1', choices: ['a', 'b'], correctChoiceIndex: 0 },
      { id: 'q2', type: 'MULTIPLE_CHOICE', prompt: 'p2', choices: ['a', 'b'], correctChoiceIndex: 0 },
      { id: 'q3', type: 'SHORT_ANSWER', prompt: 'p3', choices: [], correctChoiceIndex: null },
    ];

    it('부모 계정이 없으면 NotFoundException을 던진다', async () => {
      prisma.parentUser.findUnique.mockResolvedValue(null);

      await expect(service.submitResult(dto, 'missing-parent')).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.levelTestResult.create).not.toHaveBeenCalled();
    });

    it('존재하지 않는 문항이 포함되면 NotFoundException을 던진다', async () => {
      prisma.parentUser.findUnique.mockResolvedValue({ id: 'parent-1' });
      prisma.levelTestQuestion.findMany.mockResolvedValue(questions.slice(0, 2));

      await expect(service.submitResult(dto, 'parent-1')).rejects.toThrow(NotFoundException);
      expect(prisma.levelTestResult.create).not.toHaveBeenCalled();
    });

    it('객관식은 자동 채점하고 주관식은 채점하지 않은 채 결과를 생성한다', async () => {
      prisma.parentUser.findUnique.mockResolvedValue({ id: 'parent-1' });
      prisma.levelTestQuestion.findMany.mockResolvedValue(questions);
      const created = { id: 'result-1' };
      prisma.levelTestResult.create.mockResolvedValue(created);

      const result = await service.submitResult(dto, 'parent-1');

      expect(result).toBe(created);
      expect(prisma.levelTestResult.create).toHaveBeenCalledWith({
        data: {
          parentUserId: 'parent-1',
          childName: '민준',
          childAge: 5,
          score: 1,
          scorableCount: 2,
          answers: [
            {
              questionId: 'q1',
              type: 'MULTIPLE_CHOICE',
              prompt: 'p1',
              choices: ['a', 'b'],
              correctChoiceIndex: 0,
              selectedChoiceIndex: 0,
              correct: true,
            },
            {
              questionId: 'q2',
              type: 'MULTIPLE_CHOICE',
              prompt: 'p2',
              choices: ['a', 'b'],
              correctChoiceIndex: 0,
              selectedChoiceIndex: 1,
              correct: false,
            },
            {
              questionId: 'q3',
              type: 'SHORT_ANSWER',
              prompt: 'p3',
              choices: [],
              textAnswer: '제 답변입니다',
              correct: null,
            },
          ],
        },
      });
    });
  });

  describe('findAllResults / findOneResult', () => {
    it('부모 정보를 포함해 결과 목록을 반환한다', async () => {
      const results = [{ id: 'r1' }];
      prisma.levelTestResult.findMany.mockResolvedValue(results);

      await expect(service.findAllResults()).resolves.toBe(results);
      expect(prisma.levelTestResult.findMany).toHaveBeenCalledWith({
        include: { parentUser: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('존재하면 상세 결과를 반환한다', async () => {
      const result = { id: 'r1' };
      prisma.levelTestResult.findUnique.mockResolvedValue(result);

      await expect(service.findOneResult('r1')).resolves.toBe(result);
    });

    it('없으면 NotFoundException을 던진다', async () => {
      prisma.levelTestResult.findUnique.mockResolvedValue(null);

      await expect(service.findOneResult('missing')).rejects.toThrow(NotFoundException);
    });
  });
});
