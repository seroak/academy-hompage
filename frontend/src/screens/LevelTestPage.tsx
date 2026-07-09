'use client'

import { useState } from 'react'
import { useLevelTestQuizQuery } from './hooks/useLevelTestQuizQuery'
import { useSubmitLevelTestResultMutation } from './hooks/useSubmitLevelTestResultMutation'
import LevelTestQuestionList, { type AnswerDraft } from '../components/LevelTestQuestionList'
import { LEVEL_TEST_AGE_OPTIONS, type SubmitLevelTestAnswer } from '../api/schemas/levelTest.schema'

const DEFAULT_AGE = LEVEL_TEST_AGE_OPTIONS[0]

export default function LevelTestPage() {
  const [childName, setChildName] = useState('')
  const [childAge, setChildAge] = useState<number>(DEFAULT_AGE)
  const [started, setStarted] = useState(false)
  const [answers, setAnswers] = useState<Record<string, AnswerDraft>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [summary, setSummary] = useState<{ score: number; scorableCount: number } | null>(null)

  const { questions, isLoading, start } = useLevelTestQuizQuery(childAge)
  const { submit, isSubmitting } = useSubmitLevelTestResultMutation()

  async function handleStart() {
    if (!childName.trim()) {
      setSubmitError('아이 이름을 먼저 입력해 주세요.')
      return
    }
    setSubmitError(null)
    setStarted(true)
    setAnswers({})
    setSummary(null)
    await start()
  }

  function setChoiceAnswer(questionId: string, selectedChoiceIndex: number) {
    setAnswers({ ...answers, [questionId]: { selectedChoiceIndex } })
  }

  function setTextAnswer(questionId: string, textAnswer: string) {
    setAnswers({ ...answers, [questionId]: { textAnswer } })
  }

  async function handleSubmit() {
    const submittedAnswers: SubmitLevelTestAnswer[] = questions
      .filter((question) => answers[question.id] !== undefined)
      .map((question) => ({ questionId: question.id, ...answers[question.id] }))

    if (submittedAnswers.length === 0) {
      setSubmitError('답변을 1개 이상 입력해 주세요.')
      return
    }

    setSubmitError(null)
    try {
      const result = await submit({ childName, childAge, answers: submittedAnswers })
      setSummary({ score: result.score ?? 0, scorableCount: result.scorableCount ?? 0 })
      alert('제출이 완료되었습니다.')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 에러가 발생했습니다.'
      alert(errorMessage)
      setSubmitError('레벨테스트 제출에 실패했습니다. 잠시 후 다시 시도해 주세요.')
    }
  }

  function handleRetry() {
    setStarted(false)
    setAnswers({})
    setSummary(null)
    setSubmitError(null)
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">레벨테스트</h1>
        <p className="mt-2 text-sm text-slate-600">
          아이의 나이에 맞는 문제를 무작위로 출제합니다. 예약 없이도 바로 응시할 수 있어요.
        </p>
      </div>

      {summary ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          레벨테스트 응시를 완료했습니다. (객관식 채점: {summary.score} / {summary.scorableCount}점)
          <div>
            <button
              type="button"
              onClick={handleRetry}
              className="mt-3 rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-sm font-medium text-emerald-700 hover:border-emerald-500"
            >
              다시 응시하기
            </button>
          </div>
        </div>
      ) : !started ? (
        <div className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <label className="flex flex-col gap-1 text-sm text-slate-700">
            아이 이름
            <input
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={childName}
              onChange={(e) => setChildName(e.target.value)}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm text-slate-700">
            나이
            <select
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={childAge}
              onChange={(e) => setChildAge(Number(e.target.value))}
            >
              {LEVEL_TEST_AGE_OPTIONS.map((age) => (
                <option key={age} value={age}>
                  만 {age}세
                </option>
              ))}
            </select>
          </label>

          {submitError && <p className="text-sm text-red-600">{submitError}</p>}

          <button
            type="button"
            onClick={handleStart}
            className="self-start rounded-lg border border-brand-300 bg-white px-4 py-2 text-sm font-medium text-brand-700 hover:border-brand-500"
          >
            레벨테스트 시작
          </button>
        </div>
      ) : (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <h2 className="text-sm font-semibold text-slate-800">
            {childName} (만 {childAge}세)
          </h2>

          {isLoading && <p className="mt-3 text-sm text-slate-500">문제를 불러오는 중...</p>}

          {!isLoading && questions.length === 0 && (
            <p className="mt-3 text-sm text-slate-500">현재 이 나이대에 등록된 레벨테스트 문항이 없습니다.</p>
          )}

          {!isLoading && questions.length > 0 && (
            <div className="mt-3 flex flex-col gap-4">
              <LevelTestQuestionList
                questions={questions}
                answers={answers}
                onChoiceChange={setChoiceAnswer}
                onTextChange={setTextAnswer}
              />

              {submitError && <p className="text-sm text-red-600">{submitError}</p>}

              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="self-start rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
              >
                레벨테스트 제출
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
