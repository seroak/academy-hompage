import { z } from 'zod'

export const LEVEL_TEST_QUESTION_TYPE_OPTIONS = ['MULTIPLE_CHOICE', 'SHORT_ANSWER'] as const

export const LEVEL_TEST_QUESTION_TYPE_LABELS: Record<
  (typeof LEVEL_TEST_QUESTION_TYPE_OPTIONS)[number],
  string
> = {
  MULTIPLE_CHOICE: '객관식',
  SHORT_ANSWER: '주관식',
}

export const LEVEL_TEST_AGE_OPTIONS = [4, 5, 6, 7, 8, 9, 10] as const

// 관리자용 문항(정답 포함)
export const LevelTestQuestionSchema = z.object({
  id: z.string(),
  age: z.number(),
  type: z.enum(LEVEL_TEST_QUESTION_TYPE_OPTIONS),
  prompt: z.string(),
  promptImageUrl: z.string().nullable().optional(),
  choices: z.array(z.string()),
  correctChoiceIndex: z.number().nullable().optional(),
  active: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const LevelTestQuestionListSchema = z.array(LevelTestQuestionSchema)

export type LevelTestQuestion = z.infer<typeof LevelTestQuestionSchema>

export const CreateLevelTestQuestionInputSchema = z
  .object({
    age: z.number().int('나이는 정수로 입력해 주세요').min(4, '만 4세 이상이어야 합니다').max(10, '만 10세 이하여야 합니다'),
    type: z.enum(LEVEL_TEST_QUESTION_TYPE_OPTIONS),
    prompt: z.string().min(1, '문제를 입력해 주세요'),
    promptImageUrl: z.string().optional(),
    choices: z.array(z.string().min(1, '보기 내용을 입력해 주세요')).optional(),
    correctChoiceIndex: z.number().int().optional(),
    active: z.boolean().optional(),
  })
  .refine((input) => input.type !== 'MULTIPLE_CHOICE' || (input.choices?.length ?? 0) >= 2, {
    message: '객관식은 보기를 2개 이상 입력해 주세요',
    path: ['choices'],
  })
  .refine(
    (input) =>
      input.type !== 'MULTIPLE_CHOICE' ||
      (input.correctChoiceIndex !== undefined &&
        input.correctChoiceIndex >= 0 &&
        input.correctChoiceIndex < (input.choices?.length ?? 0)),
    { message: '정답 보기를 선택해 주세요', path: ['correctChoiceIndex'] },
  )

export type CreateLevelTestQuestionInput = z.infer<typeof CreateLevelTestQuestionInputSchema>

// 부모용 출제 문항(정답 미포함)
export const QuizQuestionSchema = z.object({
  id: z.string(),
  age: z.number(),
  type: z.enum(LEVEL_TEST_QUESTION_TYPE_OPTIONS),
  prompt: z.string(),
  promptImageUrl: z.string().nullable().optional(),
  choices: z.array(z.string()),
})

export const QuizQuestionListSchema = z.array(QuizQuestionSchema)

export type QuizQuestion = z.infer<typeof QuizQuestionSchema>

// 나이별 출제 수 설정
export const LevelTestAgeConfigSchema = z.object({
  age: z.number(),
  drawCount: z.number(),
  updatedAt: z.string(),
})

export const LevelTestAgeConfigListSchema = z.array(LevelTestAgeConfigSchema)

export type LevelTestAgeConfig = z.infer<typeof LevelTestAgeConfigSchema>

export const UpsertLevelTestAgeConfigInputSchema = z.object({
  drawCount: z.number().int('정수로 입력해 주세요').min(1, '1개 이상이어야 합니다'),
})

export type UpsertLevelTestAgeConfigInput = z.infer<typeof UpsertLevelTestAgeConfigInputSchema>

// 부모의 결과 제출
export const SubmitLevelTestAnswerSchema = z.object({
  questionId: z.string(),
  selectedChoiceIndex: z.number().optional(),
  textAnswer: z.string().optional(),
})

export type SubmitLevelTestAnswer = z.infer<typeof SubmitLevelTestAnswerSchema>

export const SubmitLevelTestResultInputSchema = z.object({
  childName: z.string().min(1, '아이 이름을 입력해 주세요'),
  childAge: z.number().int().min(4).max(10),
  answers: z.array(SubmitLevelTestAnswerSchema).min(1, '답변을 1개 이상 입력해 주세요'),
})

export type SubmitLevelTestResultInput = z.infer<typeof SubmitLevelTestResultInputSchema>

// 관리자용 결과 조회(부모/자녀/채점 포함)
const LevelTestResultAnswerSchema = z.object({
  questionId: z.string(),
  type: z.enum(LEVEL_TEST_QUESTION_TYPE_OPTIONS),
  prompt: z.string(),
  promptImageUrl: z.string().nullable().optional(),
  choices: z.array(z.string()),
  correctChoiceIndex: z.number().nullable().optional(),
  selectedChoiceIndex: z.number().nullable().optional(),
  textAnswer: z.string().nullable().optional(),
  correct: z.boolean().nullable().optional(),
})

export const LevelTestResultSchema = z.object({
  id: z.string(),
  parentUserId: z.string(),
  parentUser: z
    .object({
      id: z.string(),
      name: z.string().nullable().optional(),
      email: z.string().nullable().optional(),
    })
    .nullable()
    .optional(),
  childName: z.string(),
  childAge: z.number(),
  answers: z.array(LevelTestResultAnswerSchema),
  score: z.number().nullable().optional(),
  scorableCount: z.number().nullable().optional(),
  createdAt: z.string(),
})

export const LevelTestResultListSchema = z.array(LevelTestResultSchema)

export type LevelTestResult = z.infer<typeof LevelTestResultSchema>
