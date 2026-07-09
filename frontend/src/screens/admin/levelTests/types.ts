import type { LEVEL_TEST_QUESTION_TYPE_OPTIONS } from '../../../api/schemas/levelTest.schema'

export type LevelTestQuestionType = (typeof LEVEL_TEST_QUESTION_TYPE_OPTIONS)[number]

export type QuestionFormState = {
  age: number
  type: LevelTestQuestionType
  prompt: string
  choices: string[]
  correctChoiceIndex?: number
  active: boolean
}

export const emptyQuestionForm: QuestionFormState = {
  age: 4,
  type: 'MULTIPLE_CHOICE',
  prompt: '',
  choices: ['', ''],
  correctChoiceIndex: 0,
  active: true,
}
