'use client'

import type { LevelTestResult } from '../../../../api/schemas/levelTest.schema'

type Props = {
  results: LevelTestResult[]
  onSelect: (result: LevelTestResult) => void
}

export default function ResultsList({ results, onSelect }: Props) {
  return (
    <ul className="mt-6 divide-y divide-[#f2dfb9] rounded-2xl border border-[#f2dfb9] bg-white">
      {results.length === 0 && (
        <li className="px-5 py-6 text-center text-sm font-semibold text-[#6f6253]">
          아직 제출된 레벨테스트 결과가 없습니다.
        </li>
      )}
      {results.map((result) => (
        <li key={result.id}>
          <button
            type="button"
            onClick={() => onSelect(result)}
            className="flex w-full flex-wrap items-center justify-between gap-2 px-5 py-4 text-left transition hover:bg-[#fff9ec]"
          >
            <div>
              <p className="text-sm font-black text-[#222222]">
                {result.childName} <span className="font-semibold text-[#6f6253]">(만 {result.childAge}세)</span>
              </p>
              <p className="mt-1 text-xs font-semibold text-[#6f6253]">
                보호자: {result.parentUser?.name ?? result.parentUser?.email ?? '-'} ·{' '}
                {new Date(result.createdAt).toLocaleDateString('ko-KR')}
              </p>
            </div>
            <span className="rounded-full bg-[#fff3c8] px-3 py-1 text-xs font-black text-[#9f4d00]">
              {result.score ?? 0} / {result.scorableCount ?? 0}점
            </span>
          </button>
        </li>
      ))}
    </ul>
  )
}
