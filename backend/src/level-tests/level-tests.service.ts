import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { LevelTestQuestionType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLevelTestQuestionDto } from './dto/create-level-test-question.dto';
import { UpdateLevelTestQuestionDto } from './dto/update-level-test-question.dto';
import { UpsertLevelTestAgeConfigDto } from './dto/upsert-level-test-age-config.dto';
import { CreateLevelTestResultDto } from './dto/create-level-test-result.dto';
import { LevelTestImageStorageService } from './level-test-image-storage.service';

const DEFAULT_DRAW_COUNT = 5;

@Injectable()
export class LevelTestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly imageStorage: LevelTestImageStorageService,
  ) {}

  // 문제 은행 (관리자)
  findAllQuestions(age?: number) {
    return this.prisma.levelTestQuestion.findMany({
      where: age !== undefined ? { age } : {},
      orderBy: [{ age: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async findOneQuestion(id: string) {
    const question = await this.prisma.levelTestQuestion.findUnique({
      where: { id },
    });

    if (!question) {
      throw new NotFoundException(`LevelTestQuestion ${id} not found`);
    }

    return question;
  }

  createQuestion(dto: CreateLevelTestQuestionDto) {
    return this.prisma.levelTestQuestion.create({ data: dto });
  }

  async updateQuestion(id: string, dto: UpdateLevelTestQuestionDto) {
    const touchesImage = Object.prototype.hasOwnProperty.call(dto, 'promptImageUrl');
    const previous = touchesImage
      ? await this.prisma.levelTestQuestion.findUnique({ where: { id } })
      : null;

    let updated;
    try {
      updated = await this.prisma.levelTestQuestion.update({
        where: { id },
        data: dto,
      });
    } catch (error) {
      if (this.isNotFoundError(error)) {
        throw new NotFoundException(`LevelTestQuestion ${id} not found`);
      }
      throw error;
    }

    if (touchesImage && previous?.promptImageUrl && previous.promptImageUrl !== dto.promptImageUrl) {
      await this.imageStorage.deleteUploadedImage(previous.promptImageUrl);
    }

    return updated;
  }

  async removeQuestion(id: string) {
    const existing = await this.prisma.levelTestQuestion.findUnique({ where: { id } });

    try {
      await this.prisma.levelTestQuestion.delete({ where: { id } });
    } catch (error) {
      if (this.isNotFoundError(error)) {
        throw new NotFoundException(`LevelTestQuestion ${id} not found`);
      }
      throw error;
    }

    if (existing?.promptImageUrl) {
      await this.imageStorage.deleteUploadedImage(existing.promptImageUrl);
    }
  }

  // 나이별 출제 수 설정 (관리자)
  findAllConfigs() {
    return this.prisma.levelTestAgeConfig.findMany({ orderBy: { age: 'asc' } });
  }

  upsertConfig(age: number, dto: UpsertLevelTestAgeConfigDto) {
    return this.prisma.levelTestAgeConfig.upsert({
      where: { age },
      create: { age, drawCount: dto.drawCount },
      update: { drawCount: dto.drawCount },
    });
  }

  // 랜덤 출제 (공개)
  async getQuiz(age: number) {
    const [config, questions] = await Promise.all([
      this.prisma.levelTestAgeConfig.findUnique({ where: { age } }),
      this.prisma.levelTestQuestion.findMany({ where: { age, active: true } }),
    ]);

    const drawCount = config?.drawCount ?? DEFAULT_DRAW_COUNT;
    const drawn = this.shuffle(questions).slice(0, drawCount);

    return drawn.map(
      ({ correctChoiceIndex: _correctChoiceIndex, ...question }) => question,
    );
  }

  // 결과 제출 (부모)
  async submitResult(dto: CreateLevelTestResultDto, parentUserId?: string) {
    if (!parentUserId) {
      throw new NotFoundException('Parent user not found');
    }

    const parentUser = await this.prisma.parentUser.findUnique({
      where: { id: parentUserId },
    });

    if (!parentUser) {
      throw new UnauthorizedException('Login required');
    }

    const questionIds = dto.answers.map((a) => a.questionId);

    if (new Set(questionIds).size !== questionIds.length) {
      throw new BadRequestException('중복된 문항이 포함되어 있습니다.');
    }
    const questions = await this.prisma.levelTestQuestion.findMany({
      where: { id: { in: questionIds } },
    });

    if (questions.length !== questionIds.length) {
      throw new NotFoundException('일부 문항을 찾을 수 없습니다');
    }

    const questionById = new Map(
      questions.map((question) => [question.id, question]),
    );

    let score = 0;
    let scorableCount = 0;

    const answers = dto.answers.map((answer) => {
      const question = questionById.get(answer.questionId)!;

      if (question.type === LevelTestQuestionType.MULTIPLE_CHOICE) {
        scorableCount += 1;
        const correct =
          answer.selectedChoiceIndex === question.correctChoiceIndex;
        if (correct) score += 1;

        return {
          questionId: question.id,
          type: question.type,
          prompt: question.prompt,
          promptImageUrl: question.promptImageUrl ?? null,
          choices: question.choices,
          correctChoiceIndex: question.correctChoiceIndex,
          selectedChoiceIndex: answer.selectedChoiceIndex ?? null,
          correct,
        };
      }

      return {
        questionId: question.id,
        type: question.type,
        prompt: question.prompt,
        promptImageUrl: question.promptImageUrl ?? null,
        choices: question.choices,
        textAnswer: answer.textAnswer ?? null,
        correct: null,
      };
    });

    return this.prisma.levelTestResult.create({
      data: {
        parentUserId,
        childName: dto.childName,
        childAge: dto.childAge,
        score,
        scorableCount,
        answers: answers as unknown as Prisma.InputJsonValue,
      },
    });
  }

  // 결과 조회 (관리자)
  findAllResults() {
    return this.prisma.levelTestResult.findMany({
      include: {
        parentUser: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneResult(id: string) {
    const result = await this.prisma.levelTestResult.findUnique({
      where: { id },
      include: {
        parentUser: { select: { id: true, name: true, email: true } },
      },
    });

    if (!result) {
      throw new NotFoundException(`LevelTestResult ${id} not found`);
    }

    return result;
  }

  private shuffle<T>(items: T[]): T[] {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  private isNotFoundError(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      (error as { code?: string }).code === 'P2025'
    );
  }
}
