'use client'

import { useState } from 'react'
import { useLevelTestQuizQuery } from '../screens/hooks/useLevelTestQuizQuery'
import { useSubmitLevelTestResultMutation } from '../screens/hooks/useSubmitLevelTestResultMutation'
import type { SubmitLevelTestAnswer } from '../api/schemas/levelTest.schema'

interface Props {
  childName: string
  childAge: number
  completedResultId: string | null
  onCompleted: (resultId: string, summary: { score: number; scorableCount: number }) => void
}

type AnswerDraft = { selectedChoiceIndex?: number; textAnswer?: string }

export default function LevelTestSection({ childName, childAge, completedResultId, onCompleted }: Props) {
  const { questions, isLoading, start } = useLevelTestQuizQuery(childAge)
  const { submit, isSubmitting } = useSubmitLevelTestResultMutation()
  const [started, setStarted] = useState(false)
  const [answers, setAnswers] = useState<Record<string, AnswerDraft>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [summary, setSummary] = useState<{ score: number; scorableCount: number } | null>(null)

  async function handleStart() {
    setStarted(true)
    setSubmitError(null)
    await start()
  }

  function setChoiceAnswer(questionId: string, selectedChoiceIndex: number) {
    setAnswers({ ...answers, [questionId]: { selectedChoiceIndex } })
  }

  function setTextAnswer(questionId: string, textAnswer: string) {
    setAnswers({ ...answers, [questionId]: { textAnswer } })
  }

  async function handleSubmit() {
    if (!childName.trim()) {
      setSubmitError('아이 이름을 먼저 입력해 주세요.')
      return
    }

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
      const resultSummary = { score: result.score ?? 0, scorableCount: result.scorableCount ?? 0 }
      setSummary(resultSummary)
      alert('제출이 완료되었습니다.')
      onCompleted(result.id, resultSummary)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 에러가 발생했습니다.'
      alert(errorMessage)
      setSubmitError('레벨테스트 제출에 실패했습니다. 잠시 후 다시 시도해 주세요.')
    }
  }

  if (completedResultId && summary) {
    return (
      <div className="col-span-full rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
        레벨테스트 응시를 완료했습니다. (객관식 채점: {summary.score} / {summary.scorableCount}점)
      </div>
    )
  }

  if (!started) {
    return (
      <div className="col-span-full flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
        <p className="text-sm text-slate-700">
          예약 전에 아이 레벨테스트를 먼저 봐보시겠어요? <span className="text-slate-500">(선택 사항)</span>
        </p>
        <button
          type="button"
          onClick={handleStart}
          className="rounded-lg border border-brand-300 bg-white px-3 py-1.5 text-sm font-medium text-brand-700 hover:border-brand-500"
        >
          레벨테스트 시작
        </button>
      </div>
    )
  }

  return (
    <div className="col-span-full rounded-lg border border-slate-200 bg-slate-50 p-4">
      <h3 className="text-sm font-semibold text-slate-800">레벨테스트 (만 {childAge}세)</h3>

      {isLoading && <p className="mt-3 text-sm text-slate-500">문제를 불러오는 중...</p>}

      {!isLoading && questions.length === 0 && (
        <p className="mt-3 text-sm text-slate-500">현재 이 나이대에 등록된 레벨테스트 문항이 없습니다.</p>
      )}

      {!isLoading && questions.length > 0 && (
        <div className="mt-3 flex flex-col gap-4">
          {questions.map((question, index) => (
            <div key={question.id}>
              <p className="text-sm font-medium text-slate-800">
                {index + 1}. {question.prompt}
              </p>
              {question.type === 'MULTIPLE_CHOICE' ? (
                <div className="mt-2 flex flex-col gap-1.5">
                  {question.choices.map((choice, choiceIndex) => (
                    <label key={choiceIndex} className="flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="radio"
                        name={question.id}
                        checked={answers[question.id]?.selectedChoiceIndex === choiceIndex}
                        onChange={() => setChoiceAnswer(question.id, choiceIndex)}
                      />
                      {choice}
                    </label>
                  ))}
                </div>
              ) : (
                <textarea
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  rows={2}
                  value={answers[question.id]?.textAnswer ?? ''}
                  onChange={(e) => setTextAnswer(question.id, e.target.value)}
                />
              )}
            </div>
          ))}

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
  )
}
