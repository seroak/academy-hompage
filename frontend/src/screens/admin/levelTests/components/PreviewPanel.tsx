'use client'

import { useState } from 'react'
import { useLevelTestQuestionsQuery } from '../../hooks/useLevelTestQuestionsQuery'
import { LEVEL_TEST_AGE_OPTIONS } from '../../../../api/schemas/levelTest.schema'
import LevelTestQuestionList, { type AnswerDraft } from '../../../../components/LevelTestQuestionList'

export default function PreviewPanel() {
  const [previewAge, setPreviewAge] = useState<number>(LEVEL_TEST_AGE_OPTIONS[0])
  const [showAnswers, setShowAnswers] = useState(false)
  const [answers, setAnswers] = useState<Record<string, AnswerDraft>>({})

  const { questions, isLoading } = useLevelTestQuestionsQuery(previewAge)

  function setChoiceAnswer(questionId: string, selectedChoiceIndex: number) {
    setAnswers({ ...answers, [questionId]: { selectedChoiceIndex } })
  }

  function setTextAnswer(questionId: string, textAnswer: string) {
    setAnswers({ ...answers, [questionId]: { textAnswer } })
  }

  const correctChoiceIndexByQuestionId = showAnswers
    ? Object.fromEntries(questions.map((question) => [question.id, question.correctChoiceIndex]))
    : undefined

  return (
    <div className="mt-6 rounded-2xl border border-[#f2dfb9] bg-white p-6">
      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-sm font-bold text-[#6f6253]">
          나이
          <select
            className="rounded-lg border border-[#f2dfb9] px-3 py-2 text-sm font-semibold text-[#222222]"
            value={previewAge}
            onChange={(event) => setPreviewAge(Number(event.target.value))}
          >
            {LEVEL_TEST_AGE_OPTIONS.map((age) => (
              <option key={age} value={age}>
                만 {age}세
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2 text-sm font-bold text-[#6f6253]">
          <input
            type="checkbox"
            checked={showAnswers}
            onChange={(event) => setShowAnswers(event.target.checked)}
          />
          정답 표시
        </label>
      </div>

      <p className="mt-3 rounded-xl bg-[#fff9ec] px-4 py-3 text-xs font-semibold text-[#9f4d00]">
        실제 응시 시에는 설정된 수만큼 무작위로 출제됩니다. 여기서는 등록된 전체 문항을 보여주며, 제출되지 않습니다.
      </p>

      {isLoading && <p className="mt-4 text-sm font-semibold text-[#6f6253]">불러오는 중...</p>}

      {!isLoading && questions.length === 0 && (
        <p className="mt-4 text-sm font-semibold text-[#6f6253]">현재 이 나이대에 등록된 레벨테스트 문항이 없습니다.</p>
      )}

      {!isLoading && questions.length > 0 && (
        <div className="mt-4">
          <LevelTestQuestionList
            questions={questions}
            answers={answers}
            onChoiceChange={setChoiceAnswer}
            onTextChange={setTextAnswer}
            correctChoiceIndexByQuestionId={correctChoiceIndexByQuestionId}
          />
        </div>
      )}
    </div>
  )
}
