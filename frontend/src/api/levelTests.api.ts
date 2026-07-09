import { apiFetch } from '../lib/apiClient'
import {
  LevelTestQuestionListSchema,
  LevelTestQuestionSchema,
  LevelTestAgeConfigListSchema,
  LevelTestAgeConfigSchema,
  LevelTestResultListSchema,
  LevelTestResultSchema,
  type LevelTestQuestion,
  type CreateLevelTestQuestionInput,
  type LevelTestAgeConfig,
  type UpsertLevelTestAgeConfigInput,
  type LevelTestResult,
  type SubmitLevelTestResultInput,
} from './schemas/levelTest.schema'

// 관리자: 문제 은행
export async function fetchLevelTestQuestions(age?: number): Promise<LevelTestQuestion[]> {
  const query = age !== undefined ? `?age=${age}` : ''
  const raw = await apiFetch(`/level-tests/questions${query}`)
  return LevelTestQuestionListSchema.parse(raw)
}

export async function createLevelTestQuestion(
  input: CreateLevelTestQuestionInput,
): Promise<LevelTestQuestion> {
  const raw = await apiFetch('/level-tests/questions', {
    method: 'POST',
    body: JSON.stringify(input),
  })
  return LevelTestQuestionSchema.parse(raw)
}

export async function updateLevelTestQuestion(
  id: string,
  input: Partial<CreateLevelTestQuestionInput>,
): Promise<LevelTestQuestion> {
  const raw = await apiFetch(`/level-tests/questions/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
  return LevelTestQuestionSchema.parse(raw)
}

export async function deleteLevelTestQuestion(id: string): Promise<void> {
  await apiFetch(`/level-tests/questions/${id}`, { method: 'DELETE' })
}

// 관리자: 나이별 출제 수 설정
export async function fetchLevelTestConfigs(): Promise<LevelTestAgeConfig[]> {
  const raw = await apiFetch('/level-tests/config')
  return LevelTestAgeConfigListSchema.parse(raw)
}

export async function upsertLevelTestConfig(
  age: number,
  input: UpsertLevelTestAgeConfigInput,
): Promise<LevelTestAgeConfig> {
  const raw = await apiFetch(`/level-tests/config/${age}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
  return LevelTestAgeConfigSchema.parse(raw)
}

// 관리자: 결과 조회(개인정보 포함)
export async function fetchLevelTestResults(): Promise<LevelTestResult[]> {
  const raw = await apiFetch('/level-tests/results')
  return LevelTestResultListSchema.parse(raw)
}

export async function fetchLevelTestResult(id: string): Promise<LevelTestResult> {
  const raw = await apiFetch(`/level-tests/results/${id}`)
  return LevelTestResultSchema.parse(raw)
}

// 부모: 레벨테스트 결과 제출
export async function submitLevelTestResult(
  input: SubmitLevelTestResultInput,
): Promise<LevelTestResult> {
  const raw = await apiFetch(
    '/level-tests/results',
    { method: 'POST', body: JSON.stringify(input) },
    { authMode: 'parent' },
  )
  return LevelTestResultSchema.parse(raw)
}
