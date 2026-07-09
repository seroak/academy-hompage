import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateLevelTestQuestionDto } from './create-level-test-question.dto';

describe('CreateLevelTestQuestionDto', () => {
  function makeMultipleChoice(overrides: Record<string, unknown> = {}) {
    return plainToInstance(CreateLevelTestQuestionDto, {
      age: 5,
      type: 'MULTIPLE_CHOICE',
      prompt: '다음 중 사과는?',
      choices: ['사과', '바나나'],
      correctChoiceIndex: 0,
      ...overrides,
    });
  }

  it('유효한 객관식 문항은 통과한다', async () => {
    const errors = await validate(makeMultipleChoice());
    expect(errors).toHaveLength(0);
  });

  it('객관식인데 보기가 2개 미만이면 실패한다', async () => {
    const errors = await validate(makeMultipleChoice({ choices: ['사과'] }));
    expect(errors.some((error) => error.property === 'choices')).toBe(true);
  });

  it('객관식인데 정답 인덱스가 보기 범위를 벗어나면 실패한다', async () => {
    const errors = await validate(makeMultipleChoice({ correctChoiceIndex: 5 }));
    expect(errors.some((error) => error.property === 'correctChoiceIndex')).toBe(true);
  });

  it('객관식인데 정답 인덱스가 없으면 실패한다', async () => {
    const errors = await validate(
      makeMultipleChoice({ correctChoiceIndex: undefined }),
    );
    expect(errors.some((error) => error.property === 'correctChoiceIndex')).toBe(true);
  });

  it('주관식은 보기/정답 인덱스 없이 통과한다', async () => {
    const errors = await validate(
      plainToInstance(CreateLevelTestQuestionDto, {
        age: 5,
        type: 'SHORT_ANSWER',
        prompt: '자유롭게 답해 주세요',
      }),
    );
    expect(errors).toHaveLength(0);
  });

  it('나이가 4~10 범위를 벗어나면 실패한다', async () => {
    const errors = await validate(makeMultipleChoice({ age: 11 }));
    expect(errors.some((error) => error.property === 'age')).toBe(true);
  });
});
