'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useLevelTestQuizQuery } from './hooks/useLevelTestQuizQuery'
import { useSubmitLevelTestResultMutation } from './hooks/useSubmitLevelTestResultMutation'
import LevelTestQuestionList, { type AnswerDraft } from '../components/LevelTestQuestionList'
import { LEVEL_TEST_AGE_OPTIONS, type SubmitLevelTestAnswer } from '../api/schemas/levelTest.schema'
import { useChildrenQuery } from '../queries/useChildrenQuery'
import type { Child } from '../api/schemas/child.schema'

const DEFAULT_AGE = LEVEL_TEST_AGE_OPTIONS[0]

export default function LevelTestPage({ isAdminPreview = false }: { isAdminPreview?: boolean }) {
  const { children, isLoading: isChildrenLoading } = useChildrenQuery()
  const [selectedChild, setSelectedChild] = useState<Child | null>(null)
  const [childName, setChildName] = useState('')
  const [childAge, setChildAge] = useState<number>(DEFAULT_AGE)
  const [started, setStarted] = useState(false)
  const [answers, setAnswers] = useState<Record<string, AnswerDraft>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [summary, setSummary] = useState<{ score: number; scorableCount: number } | null>(null)

  const { questions, isLoading, start } = useLevelTestQuizQuery(childAge)
  const { submit, isSubmitting } = useSubmitLevelTestResultMutation()

  function selectChild(childId: string) {
    const child = children.find((candidate) => candidate.id === childId) ?? null
    setSelectedChild(child)
    if (!child) return
    setChildName(child.name)
    setChildAge(child.age)
    handleRetry()
  }

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
    if (isAdminPreview) {
      alert('관리자는 레벨테스트 결과를 제출할 수 없습니다.')
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
      const result = await submit({ childId: selectedChild!.id, childName, childAge, answers: submittedAnswers })
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
        <p className="text-xs font-black uppercase tracking-wide text-[#e86f00]">무료 진단</p>
        <h1 className="mt-2 text-3xl font-black text-[#222222]">레벨테스트</h1>
        <p className="mt-3 text-sm font-semibold leading-6 text-[#6f6253]">
          아이의 나이에 맞는 문제를 무작위로 출제합니다. 예약 없이도 바로 응시할 수 있어요.
        </p>
        {isAdminPreview && (
          <p className="mt-4 rounded-2xl border border-[#f6ead0] bg-[#fff3c8] px-4 py-3 text-sm font-bold text-[#9f4d00]">
            관리자 미리보기 화면입니다. 답안을 제출해도 결과는 저장되지 않습니다.
          </p>
        )}
      </div>

      {!isAdminPreview && !isChildrenLoading && children.length === 0 ? (
        <div className="rounded-[28px] bg-white p-6 text-sm font-semibold text-[#6f6253] shadow-[0_18px_46px_rgba(95,67,18,0.08)]">먼저 <Link href="/children" className="font-black text-[#e86f00] underline">내 자녀</Link>에서 자녀를 등록해 주세요.</div>
      ) : summary ? (
        <div className="rounded-[28px] bg-[#eaf7ea] px-6 py-5 text-sm font-bold text-[#2f7a3d] shadow-[0_18px_46px_rgba(95,67,18,0.08)]">
          레벨테스트 응시를 완료했습니다. (객관식 채점: {summary.score} / {summary.scorableCount}점)
          <div>
            <button
              type="button"
              onClick={handleRetry}
              className="mt-3 rounded-full border border-[#bfe3bf] bg-white px-4 py-2 text-sm font-black text-[#2f7a3d] transition duration-200 hover:-translate-y-0.5 hover:border-[#2f7a3d]"
            >
              다시 응시하기
            </button>
          </div>
        </div>
      ) : !started ? (
        <div className="flex flex-col gap-4 rounded-[28px] bg-white p-6 shadow-[0_18px_46px_rgba(95,67,18,0.08)] sm:p-8">
          {isAdminPreview ? <>
            <label className="flex flex-col gap-2 text-sm font-black text-[#3f3a31]">아이 이름<input className="h-12 rounded-2xl border border-[#f2dfb9] bg-[#fffdf8] px-4 text-sm font-semibold text-[#3f3a31] outline-none transition focus:border-[#ff8a1f]" value={childName} onChange={(e) => setChildName(e.target.value)} /></label>
            <label className="flex flex-col gap-2 text-sm font-black text-[#3f3a31]">나이<select className="h-12 rounded-2xl border border-[#f2dfb9] bg-[#fffdf8] px-4 text-sm font-semibold text-[#3f3a31] outline-none transition focus:border-[#ff8a1f]" value={childAge} onChange={(e) => setChildAge(Number(e.target.value))}>{LEVEL_TEST_AGE_OPTIONS.map((age) => <option key={age} value={age}>만 {age}세</option>)}</select></label>
          </> : <>
            <label className="flex flex-col gap-2 text-sm font-black text-[#3f3a31]">응시할 자녀<select className="h-12 rounded-2xl border border-[#f2dfb9] bg-[#fffdf8] px-4 text-sm font-semibold text-[#3f3a31] outline-none transition focus:border-[#ff8a1f]" value={selectedChild?.id ?? ''} onChange={(e) => selectChild(e.target.value)}><option value="">자녀를 선택해 주세요</option>{children.map((child) => <option key={child.id} value={child.id}>{child.name} · 만 {child.age}세</option>)}</select></label>
            {selectedChild && <p className="text-sm font-semibold text-[#3f3a31]">{selectedChild.name} · 만 {selectedChild.age}세</p>}
          </>}

          {submitError && <p className="text-sm font-bold text-[#d6452f]">{submitError}</p>}

          <button
            type="button"
            onClick={handleStart}
            disabled={!isAdminPreview && !selectedChild}
            className="self-start rounded-full bg-[#ffd66b] px-5 py-2.5 text-sm font-black text-[#2b2418] transition duration-200 hover:-translate-y-0.5 hover:bg-[#ffcf4d] disabled:opacity-60"
          >
            레벨테스트 시작
          </button>
        </div>
      ) : (
        <div className="rounded-[28px] bg-white p-6 shadow-[0_18px_46px_rgba(95,67,18,0.08)] sm:p-8">
          <h2 className="text-sm font-black text-[#3f3a31]">
            {childName} (만 {childAge}세)
          </h2>

          {isLoading && <p className="mt-3 text-sm font-semibold text-[#8a7a61]">문제를 불러오는 중...</p>}

          {!isLoading && questions.length === 0 && (
            <p className="mt-3 text-sm font-semibold text-[#8a7a61]">현재 이 나이대에 등록된 레벨테스트 문항이 없습니다.</p>
          )}

          {!isLoading && questions.length > 0 && (
            <div className="mt-4 flex flex-col gap-4">
              <LevelTestQuestionList
                questions={questions}
                answers={answers}
                onChoiceChange={setChoiceAnswer}
                onTextChange={setTextAnswer}
              />

              {submitError && <p className="text-sm font-bold text-[#d6452f]">{submitError}</p>}

              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="self-start rounded-full bg-[#ffd66b] px-5 py-2.5 text-sm font-black text-[#2b2418] transition duration-200 hover:-translate-y-0.5 hover:bg-[#ffcf4d] disabled:opacity-60"
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
