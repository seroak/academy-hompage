'use client'

import { X } from 'lucide-react'
import { LEVEL_TEST_QUESTION_TYPE_LABELS, type LevelTestResult } from '../../../../api/schemas/levelTest.schema'

type Props = {
  result: LevelTestResult | null
  onClose: () => void
}

export default function ResultDetailModal({ result, onClose }: Props) {
  if (!result) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8" onClick={onClose}>
      <div
        className="max-h-full w-full max-w-2xl overflow-y-auto rounded-[28px] bg-white p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-[#222222]">
              {result.childName} <span className="font-semibold text-[#6f6253]">(만 {result.childAge}세)</span>
            </h2>
            <p className="mt-1 text-sm font-semibold text-[#6f6253]">
              보호자: {result.parentUser?.name ?? result.parentUser?.email ?? '-'} ·{' '}
              {new Date(result.createdAt).toLocaleString('ko-KR')}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="grid size-8 place-items-center rounded-full text-slate-400 hover:bg-slate-100"
          >
            <X size={18} />
          </button>
        </div>

        <p className="mt-4 inline-block rounded-full bg-[#fff3c8] px-3 py-1 text-sm font-black text-[#9f4d00]">
          객관식 채점: {result.score ?? 0} / {result.scorableCount ?? 0}점
        </p>

        <ul className="mt-4 space-y-3">
          {result.answers.map((answer, index) => (
            <li key={`${answer.questionId}-${index}`} className="rounded-2xl border border-[#f2dfb9] p-4">
              <p className="text-xs font-black text-[#9f4d00]">
                {LEVEL_TEST_QUESTION_TYPE_LABELS[answer.type]}
                {answer.correct !== null && answer.correct !== undefined && (
                  <span className={answer.correct ? 'ml-2 text-[#2f7a3d]' : 'ml-2 text-[#d6452f]'}>
                    {answer.correct ? '정답' : '오답'}
                  </span>
                )}
              </p>
              <p className="mt-1 text-sm font-bold text-[#222222]">{answer.prompt}</p>
              {answer.type === 'MULTIPLE_CHOICE' ? (
                <p className="mt-1 text-sm font-semibold text-[#6f6253]">
                  응답: {answer.choices[answer.selectedChoiceIndex ?? -1] ?? '(응답 없음)'} · 정답:{' '}
                  {answer.choices[answer.correctChoiceIndex ?? -1] ?? '-'}
                </p>
              ) : (
                <p className="mt-1 text-sm font-semibold text-[#6f6253]">
                  응답: {answer.textAnswer || '(응답 없음)'}
                </p>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
