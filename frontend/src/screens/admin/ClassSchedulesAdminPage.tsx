'use client'

import { useEffect, useRef, useState } from 'react'
import type { ClassSchedule, ClassScheduleDay } from '../../api/schemas/class-schedule.schema'
import { ApiError } from '../../lib/apiClient'
import MonthCalendar, { monthColor } from '../../components/class-schedule/MonthCalendar'
import { classMonthLabel, classMonthOptions, quarterMonths } from '../../components/class-schedule/calendar'
import { useClassSchedulesQuery } from '../../queries/useClassSchedulesQuery'
import { useClassScheduleMutations } from './hooks/useClassScheduleMutations'

type EditTool =
  | { kind: 'CLASS'; classMonth: string }
  | { kind: 'HOLIDAY' | 'CLOSED' | 'CLEAR' }

function ScheduleEditor({ schedule, schedules, onSelect, onDeleted }: {
  schedule: ClassSchedule; schedules: ClassSchedule[]; onSelect: (id: string) => void; onDeleted: () => void
}) {
  const [days, setDays] = useState(schedule.days)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [dirty, setDirty] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeTool, setActiveTool] = useState<EditTool>({ kind: 'CLASS', classMonth: `${schedule.year}-${String(quarterMonths(schedule.year, schedule.quarter)[0]).padStart(2, '0')}` })
  const isDragging = useRef(false)
  const { updateSchedule, publishSchedule, deleteSchedule, isSaving, isPublishing } = useClassScheduleMutations()
  const months = quarterMonths(schedule.year, schedule.quarter)
  const colorMonths = classMonthOptions(schedule.year, schedule.quarter)
  const selectedEntry = days.find((day) => day.date === selectedDate)

  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => { if (dirty) event.preventDefault() }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [dirty])

  useEffect(() => {
    const stopDragging = () => { isDragging.current = false }
    window.addEventListener('pointerup', stopDragging)
    window.addEventListener('pointercancel', stopDragging)
    return () => {
      window.removeEventListener('pointerup', stopDragging)
      window.removeEventListener('pointercancel', stopDragging)
    }
  }, [])

  function applyTool(date: string, tool: EditTool = activeTool) {
    setDays((current) => {
      if (tool.kind === 'CLEAR') return current.filter((day) => day.date !== date)
      const currentEntry = current.find((day) => day.date === date)
      const next: Omit<ClassScheduleDay, 'id'> = {
        date,
        kind: tool.kind,
        classMonth: tool.kind === 'CLASS' ? tool.classMonth : null,
        note: tool.kind === 'CLASS' ? null : currentEntry?.note ?? null,
      }
      return [...current.filter((day) => day.date !== date), next].sort((a, b) => a.date.localeCompare(b.date))
    })
    setSelectedDate(date)
    setDirty(true); setMessage(null); setError(null)
  }

  function startPainting(date: string, pointerType: string) {
    setSelectedDate(date)
    if (pointerType === 'touch') return
    isDragging.current = true
    applyTool(date)
  }

  function continuePainting(date: string, pointerType: string) {
    if (!isDragging.current || pointerType === 'touch') return
    applyTool(date)
  }

  function replaceSelected(next: Omit<ClassScheduleDay, 'id'> | null) {
    if (!selectedDate) return
    setDays((current) => next ? [...current.filter((day) => day.date !== selectedDate), next].sort((a, b) => a.date.localeCompare(b.date)) : current.filter((day) => day.date !== selectedDate))
    setDirty(true); setMessage(null); setError(null)
  }
  function setKind(kind: 'CLASS' | 'HOLIDAY' | 'CLOSED', classMonth?: string) {
    if (!selectedDate) return
    replaceSelected({ date: selectedDate, kind, classMonth: kind === 'CLASS' ? classMonth : null, note: kind === 'CLASS' ? null : selectedEntry?.note ?? null })
  }
  async function save() {
    try {
      const saved = await updateSchedule({ id: schedule.id, days: days.map(({ id: _id, ...day }) => day) })
      setDays(saved.days); setDirty(false); setMessage('저장했습니다.'); setError(null)
    } catch (cause) { setError(cause instanceof ApiError ? cause.message : '저장하지 못했습니다.') }
  }
  async function publish() {
    try { await publishSchedule(schedule.id); setMessage('게시했습니다.'); setError(null) }
    catch (cause) { setError(cause instanceof ApiError ? cause.message : '게시하지 못했습니다.') }
  }
  async function remove() {
    if (!window.confirm('이 수업 일정을 삭제하시겠습니까?')) return
    try { await deleteSchedule(schedule.id); onDeleted() }
    catch (cause) { setError(cause instanceof ApiError ? cause.message : '삭제하지 못했습니다.') }
  }

  return (
    <div className="mt-8">
      <div className="flex flex-wrap items-end justify-between gap-4 rounded-[28px] bg-white p-5 shadow-[0_18px_46px_rgba(95,67,18,0.08)]">
        <label className="flex min-w-56 flex-col gap-2 text-sm font-black text-[#3f3a31]">등록된 일정<select value={schedule.id} onChange={(event) => { if (!dirty || window.confirm('저장하지 않은 변경사항이 있습니다. 일정을 전환할까요?')) onSelect(event.target.value) }} className="h-12 rounded-2xl border border-[#f2dfb9] bg-[#fffdf8] px-4 font-black">{schedules.map((item) => <option key={item.id} value={item.id}>{item.year}년 {item.quarter}분기</option>)}</select></label>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-3 py-2 text-xs font-black ${schedule.status === 'PUBLISHED' ? 'bg-[#e8f4c7] text-[#516b16]' : 'bg-[#f3eee4] text-[#6f6253]'}`}>{schedule.status === 'PUBLISHED' ? '게시 중' : '임시저장'}</span>
          {dirty && <span className="text-xs font-black text-[#d45c2f]">저장하지 않은 변경사항</span>}
          <button type="button" onClick={save} disabled={!dirty || isSaving} className="h-11 rounded-full bg-[#ffd66b] px-5 text-sm font-black disabled:opacity-50">임시저장</button>
          <button type="button" onClick={publish} disabled={dirty || isPublishing} className="h-11 rounded-full bg-[#3f3a31] px-5 text-sm font-black text-white disabled:opacity-50">게시하기</button>
          <button type="button" onClick={remove} className="h-11 rounded-full border border-[#efb5a8] px-4 text-sm font-black text-[#bd402b]">일정 삭제</button>
        </div>
      </div>
      {schedule.status === 'PUBLISHED' && <p className="mt-3 text-sm font-bold text-[#6f6253]">게시된 일정을 저장하면 공개 화면에도 바로 반영됩니다.</p>}
      {message && <p className="mt-3 text-sm font-black text-[#516b16]">{message}</p>}
      {error && <p tabIndex={-1} className="mt-3 rounded-2xl bg-[#fff0ed] px-4 py-3 text-sm font-black text-[#bd402b]">{error}</p>}
      <section className="mt-6 rounded-[24px] border border-[#f2dfb9] bg-[#fffdf8] p-4" aria-label="일정 드래그 설정">
        <p className="text-sm font-black text-[#3f3a31]">도구를 선택하고 날짜 위를 드래그하세요.</p>
        <div role="toolbar" aria-label="드래그 도구" className="mt-3 flex flex-wrap gap-2">
          {colorMonths.map((classMonth, index) => {
            const selected = activeTool.kind === 'CLASS' && activeTool.classMonth === classMonth
            return <button type="button" key={classMonth} aria-pressed={selected} onClick={() => setActiveTool({ kind: 'CLASS', classMonth })} className={`h-11 rounded-full border px-4 text-sm font-black ${monthColor(index)} ${selected ? 'ring-2 ring-[#9f4d00] ring-offset-2' : ''}`}>{classMonthLabel(classMonth)}</button>
          })}
          <button type="button" aria-pressed={activeTool.kind === 'HOLIDAY'} onClick={() => setActiveTool({ kind: 'HOLIDAY' })} className={`h-11 rounded-full border border-[#f2b8aa] bg-[#fff0eb] px-4 text-sm font-black text-[#a23a2c] ${activeTool.kind === 'HOLIDAY' ? 'ring-2 ring-[#9f4d00] ring-offset-2' : ''}`}>공휴일</button>
          <button type="button" aria-pressed={activeTool.kind === 'CLOSED'} onClick={() => setActiveTool({ kind: 'CLOSED' })} className={`h-11 rounded-full border border-[#d9cdbb] bg-[#f3eee4] px-4 text-sm font-black ${activeTool.kind === 'CLOSED' ? 'ring-2 ring-[#9f4d00] ring-offset-2' : ''}`}>휴강</button>
          <button type="button" aria-pressed={activeTool.kind === 'CLEAR'} onClick={() => setActiveTool({ kind: 'CLEAR' })} className={`h-11 rounded-full border border-[#d9cdbb] bg-white px-4 text-sm font-black ${activeTool.kind === 'CLEAR' ? 'ring-2 ring-[#9f4d00] ring-offset-2' : ''}`}>초기화</button>
        </div>
        <p className="mt-3 text-xs font-bold text-[#6f6253]">모바일에서는 날짜를 탭한 뒤 아래 편집 영역에서 설정할 수 있습니다.</p>
      </section>
      <div className="mt-8 grid gap-8 lg:grid-cols-3">{months.map((month) => <MonthCalendar key={month} year={schedule.year} month={month} classMonths={colorMonths} days={days} selectedDate={selectedDate} onDateClick={setSelectedDate} onDatePointerStart={startPainting} onDatePointerEnter={continuePainting} />)}</div>
      {selectedDate && <section className="mt-6 rounded-[28px] border border-[#f2dfb9] bg-white p-6" aria-label="선택 날짜 편집"><h2 className="text-xl font-black text-[#2b2418]">{selectedDate} 설정</h2><div className="mt-4 flex flex-wrap gap-2">{colorMonths.map((value) => <button type="button" key={value} onClick={() => setKind('CLASS', value)} className="h-11 rounded-full bg-[#fff0cf] px-4 text-sm font-black">{classMonthLabel(value)}</button>)}<button type="button" onClick={() => setKind('HOLIDAY')} className="h-11 rounded-full bg-[#fff0eb] px-4 text-sm font-black text-[#a23a2c]">공휴일</button><button type="button" onClick={() => setKind('CLOSED')} className="h-11 rounded-full bg-[#f3eee4] px-4 text-sm font-black">휴강</button><button type="button" onClick={() => replaceSelected(null)} className="h-11 rounded-full border border-[#d9cdbb] px-4 text-sm font-black">초기화</button></div><label className="mt-5 flex max-w-md flex-col gap-2 text-sm font-black">날짜 메모<input aria-label="날짜 메모" maxLength={30} disabled={!selectedEntry || selectedEntry.kind === 'CLASS'} value={selectedEntry?.note ?? ''} onChange={(event) => selectedEntry && replaceSelected({ ...selectedEntry, note: event.target.value })} className="h-12 rounded-2xl border border-[#f2dfb9] px-4 disabled:bg-[#f3eee4]" /></label></section>}
    </div>
  )
}

export default function ClassSchedulesAdminPage() {
  const { schedules, isLoading, error } = useClassSchedulesQuery()
  const { createSchedule, isCreating } = useClassScheduleMutations()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [year, setYear] = useState(new Date().getFullYear())
  const [quarter, setQuarter] = useState(1)
  const [createError, setCreateError] = useState<string | null>(null)
  const selected = schedules.find((item) => item.id === selectedId) ?? schedules[0]
  async function create() {
    try { const result = await createSchedule({ year, quarter, days: [] }); setSelectedId(result.id); setCreateError(null) }
    catch (cause) { setCreateError(cause instanceof ApiError ? cause.message : '일정을 만들지 못했습니다.') }
  }
  return <div><p className="text-sm font-black text-[#e86f00]">관리자 전용</p><h1 className="mt-2 text-3xl font-black">수업 일정 관리</h1><p className="mt-3 text-sm font-semibold text-[#6f6253]">분기별 수업일을 달력에서 지정하고 검토 후 게시합니다.</p><section className="mt-6 flex flex-wrap items-end gap-3 rounded-[28px] bg-[#fff0cf] p-5"><label className="flex flex-col gap-2 text-sm font-black">연도<input aria-label="연도" type="number" min={2000} max={2100} value={year} onChange={(event) => setYear(Number(event.target.value))} className="h-12 w-32 rounded-2xl border border-[#e5c88c] bg-white px-4" /></label><label className="flex flex-col gap-2 text-sm font-black">분기<select aria-label="분기" value={quarter} onChange={(event) => setQuarter(Number(event.target.value))} className="h-12 w-28 rounded-2xl border border-[#e5c88c] bg-white px-4">{[1, 2, 3, 4].map((item) => <option key={item} value={item}>{item}분기</option>)}</select></label><button type="button" disabled={isCreating} onClick={create} className="h-12 rounded-full bg-[#3f3a31] px-6 text-sm font-black text-white">새 일정 만들기</button>{createError && <p className="w-full text-sm font-black text-[#bd402b]">{createError}</p>}</section>{isLoading && <p className="mt-8">불러오는 중...</p>}{error && <p className="mt-8 text-[#bd402b]">목록을 불러오지 못했습니다.</p>}{selected ? <ScheduleEditor key={selected.id} schedule={selected} schedules={schedules} onSelect={setSelectedId} onDeleted={() => setSelectedId(null)} /> : !isLoading && !error && <p className="mt-8 rounded-[28px] bg-white px-6 py-12 text-center font-bold text-[#6f6253]">등록된 일정이 없습니다. 새 일정을 만들어 주세요.</p>}</div>
}
