'use client'

import { useState } from 'react'
import { LEVEL_TEST_AGE_OPTIONS, type LevelTestAgeConfig } from '../../../../api/schemas/levelTest.schema'

const DEFAULT_DRAW_COUNT = 5

type Props = {
  configs: LevelTestAgeConfig[]
  onSave: (age: number, drawCount: number) => void
  isSaving: boolean
}

export default function AgeConfigPanel({ configs, onSave, isSaving }: Props) {
  const configByAge = new Map(configs.map((config) => [config.age, config.drawCount]))
  const [drafts, setDrafts] = useState<Record<number, number>>({})

  function draftFor(age: number): number {
    return drafts[age] ?? configByAge.get(age) ?? DEFAULT_DRAW_COUNT
  }

  return (
    <div className="mt-6 rounded-2xl border border-[#f2dfb9] bg-white p-6">
      <h2 className="font-black text-[#222222]">나이별 랜덤 출제 문항 수</h2>
      <p className="mt-1 text-xs font-semibold text-[#6f6253]">
        설정하지 않으면 기본 {DEFAULT_DRAW_COUNT}문항이 출제됩니다.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {LEVEL_TEST_AGE_OPTIONS.map((age) => (
          <div key={age} className="flex items-center gap-2 rounded-xl border border-[#f2dfb9] px-3 py-2">
            <span className="w-14 shrink-0 text-sm font-bold text-[#6f6253]">만 {age}세</span>
            <input
              type="number"
              min={1}
              className="w-16 rounded-lg border border-[#f2dfb9] px-2 py-1 text-sm font-semibold text-[#222222]"
              value={draftFor(age)}
              onChange={(event) =>
                setDrafts({ ...drafts, [age]: Number(event.target.value) })
              }
            />
            <button
              type="button"
              disabled={isSaving}
              onClick={() => onSave(age, draftFor(age))}
              className="ml-auto rounded-full bg-[#e86f00] px-3 py-1 text-xs font-black text-white transition hover:-translate-y-0.5 disabled:opacity-50"
            >
              저장
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
