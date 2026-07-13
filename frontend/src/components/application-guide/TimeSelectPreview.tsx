'use client'

import { Fragment } from 'react'
import PreviewFrame from './PreviewFrame'
import { useGuideScene } from './useGuideScene'

const DAYS = ['월', '화', '수', '목', '금']
const ROWS = ['14:00', '14:30', '15:00']
const SELECTED_COLUMN = 1 // 화
const JOINABLE_CELL = { row: 2, column: 3 } // 목요일 15:00 · 모집 중인 반이 있다는 예시

// 0: 미선택 · 1: 첫 시간 선택 · 2: 두 시간 선택 + 요약 배지
const SCENE_COUNT = 3
const SCENE_DURATION_MS = 1700

export default function TimeSelectPreview() {
  const { scene } = useGuideScene(SCENE_COUNT, SCENE_DURATION_MS)
  const filledRows = scene === 0 ? 0 : scene === 1 ? 1 : 2

  return (
    <PreviewFrame testId="application-guide-animation-time-select">
      <p className="text-[11px] font-black text-slate-400">가능한 시간</p>

      <div className="mt-3 rounded-lg bg-brand-50/60 p-2">
        <div className="grid grid-cols-[26px_repeat(5,1fr)] gap-1">
          <div />
          {DAYS.map((day) => (
            <div key={day} className="text-center text-[9px] font-semibold text-slate-500">
              {day}
            </div>
          ))}
          {ROWS.map((label, rowIndex) => (
            <Fragment key={label}>
              <div className="flex items-center text-[8px] font-medium text-slate-400">{label}</div>
              {DAYS.map((_, columnIndex) => {
                const selected = columnIndex === SELECTED_COLUMN && rowIndex < filledRows
                const joinable = rowIndex === JOINABLE_CELL.row && columnIndex === JOINABLE_CELL.column
                return (
                  <div
                    key={columnIndex}
                    className={`h-5 rounded border transition-colors duration-300 ${
                      selected
                        ? 'border-brand-700 bg-brand-600'
                        : joinable
                          ? 'border-emerald-600 bg-emerald-500'
                          : 'border-slate-200 bg-white'
                    }`}
                  />
                )
              })}
            </Fragment>
          ))}
        </div>
      </div>

      <div className="mt-2 min-h-[26px]">
        {scene === 2 && (
          <p className="w-fit rounded-full bg-brand-100 px-2.5 py-1 text-[10px] font-bold text-brand-800">
            화요일 14:00~15:00
          </p>
        )}
      </div>
    </PreviewFrame>
  )
}
