'use client'

import {
  LEVEL_TEST_AGE_OPTIONS,
  LEVEL_TEST_QUESTION_TYPE_LABELS,
  type LevelTestQuestion,
} from '../../../../api/schemas/levelTest.schema'
import { API_BASE_URL } from '../../../../lib/apiClient'

type Props = {
  questions: LevelTestQuestion[]
  ageFilter: number | undefined
  onAgeFilterChange: (age: number | undefined) => void
  onEdit: (question: LevelTestQuestion) => void
  onDelete: (id: string) => void
}

export default function QuestionList({ questions, ageFilter, onAgeFilterChange, onEdit, onDelete }: Props) {
  return (
    <div className="mt-6">
      <div className="flex items-center gap-2">
        <label className="text-sm font-bold text-[#6f6253]">나이 필터</label>
        <select
          className="rounded-lg border border-[#f2dfb9] px-3 py-2 text-sm font-semibold text-[#222222]"
          value={ageFilter ?? ''}
          onChange={(event) =>
            onAgeFilterChange(event.target.value === '' ? undefined : Number(event.target.value))
          }
        >
          <option value="">전체</option>
          {LEVEL_TEST_AGE_OPTIONS.map((age) => (
            <option key={age} value={age}>
              만 {age}세
            </option>
          ))}
        </select>
      </div>

      <ul className="mt-4 divide-y divide-[#f2dfb9] rounded-2xl border border-[#f2dfb9] bg-white">
        {questions.length === 0 && (
          <li className="px-5 py-6 text-center text-sm font-semibold text-[#6f6253]">등록된 문항이 없습니다.</li>
        )}
        {questions.map((question) => (
          <li key={question.id} className="flex items-start justify-between gap-3 px-5 py-4">
            <div className="flex items-start gap-3">
              {question.promptImageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`${API_BASE_URL}${question.promptImageUrl}`}
                  alt="문제 이미지"
                  className="h-14 w-14 shrink-0 rounded-lg border border-[#f2dfb9] object-cover"
                />
              )}
              <div>
                <p className="text-sm font-black text-[#222222]">
                  <span className="mr-2 rounded-full bg-[#fff3c8] px-2 py-0.5 text-xs font-black text-[#9f4d00]">
                    만 {question.age}세
                  </span>
                  <span className="mr-2 rounded-full bg-[#eaf7ea] px-2 py-0.5 text-xs font-black text-[#2f7a3d]">
                    {LEVEL_TEST_QUESTION_TYPE_LABELS[question.type]}
                  </span>
                  {!question.active && (
                    <span className="mr-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-black text-slate-500">
                      비활성
                    </span>
                  )}
                  {question.prompt}
                </p>
                {question.type === 'MULTIPLE_CHOICE' && (
                  <p className="mt-1 text-xs font-semibold text-[#6f6253]">
                    보기: {question.choices.join(', ')} · 정답:{' '}
                    {question.choices[question.correctChoiceIndex ?? -1] ?? '-'}
                  </p>
                )}
              </div>
            </div>
            <div className="flex shrink-0 gap-3">
              <button
                type="button"
                onClick={() => onEdit(question)}
                className="text-sm font-bold text-[#9f4d00] hover:underline"
              >
                수정
              </button>
              <button
                type="button"
                onClick={() => onDelete(question.id)}
                className="text-sm font-bold text-[#d6452f] hover:underline"
              >
                삭제
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
