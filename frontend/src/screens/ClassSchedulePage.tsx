'use client'

import { useState } from 'react'
import type { ClassSchedule } from '../api/schemas/class-schedule.schema'
import MonthCalendar, { monthColor } from '../components/class-schedule/MonthCalendar'
import { classMonthLabel, classMonthOptions, quarterMonths } from '../components/class-schedule/calendar'

export default function ClassSchedulePage({ schedules, loadFailed }: { schedules: ClassSchedule[]; loadFailed: boolean }) {
  const [selectedKey, setSelectedKey] = useState(schedules[0] ? `${schedules[0].year}-${schedules[0].quarter}` : '')
  const schedule = schedules.find((item) => `${item.year}-${item.quarter}` === selectedKey) ?? schedules[0]
  if (loadFailed) return <div className="rounded-[28px] bg-white px-6 py-16 text-center"><h1 className="text-2xl font-black">수업 일정을 불러오지 못했습니다</h1><p className="mt-3 text-[#6f6253]">잠시 후 다시 확인해 주세요.</p></div>
  if (!schedule) return <div className="rounded-[28px] bg-white px-6 py-16 text-center"><h1 className="text-2xl font-black">등록된 수업 일정이 없습니다</h1><p className="mt-3 text-[#6f6253]">새 일정이 게시되면 이곳에서 안내해 드립니다.</p></div>
  const months = quarterMonths(schedule.year, schedule.quarter)
  const classMonths = classMonthOptions(schedule.year, schedule.quarter)
  return (
    <div className="pb-16">
      <header className="relative overflow-hidden rounded-[36px] bg-[#fff0cf] px-6 py-10 sm:px-10">
        <p className="text-sm font-black tracking-[0.12em] text-[#c65f00]">QUARTERLY CLASS CALENDAR</p>
        <h1 className="mt-3 text-3xl font-black tracking-[-0.03em] text-[#2b2418] sm:text-5xl">{schedule.year}년 {schedule.quarter}분기 수업 일정</h1>
        <p className="mt-4 max-w-2xl text-sm font-semibold leading-6 text-[#6f5741]">월별 수업일과 휴강·공휴일을 한눈에 확인하세요. 색상은 각 월분 수업일을 뜻합니다.</p>
        <label className="mt-6 flex w-full max-w-xs flex-col gap-2 text-sm font-black text-[#4d3c2b]">일정 선택<select value={selectedKey} onChange={(event) => setSelectedKey(event.target.value)} className="h-12 rounded-2xl border border-[#e5c88c] bg-[#fffdf7] px-4 font-black outline-none focus:border-[#e86f00]">{schedules.map((item) => <option key={item.id} value={`${item.year}-${item.quarter}`}>{item.year}년 {item.quarter}분기</option>)}</select></label>
      </header>
      <section aria-label="월별 수업일 범례" className="mt-8 flex flex-wrap gap-3">
        {classMonths.map((item, index) => <span key={item} className={`rounded-full border px-4 py-2 text-sm font-black text-[#332c22] ${monthColor(index)}`}>{classMonthLabel(item)}</span>)}
        <span className="rounded-full border border-[#f2b8aa] bg-[#fff0eb] px-4 py-2 text-sm font-black text-[#a23a2c]">공휴일</span><span className="rounded-full border border-[#d9cdbb] bg-[#f3eee4] px-4 py-2 text-sm font-black text-[#655b4c]">휴강</span>
      </section>
      <div className="mt-8 grid gap-10 lg:grid-cols-3 lg:gap-5">{months.map((month) => <MonthCalendar key={month} year={schedule.year} month={month} classMonths={classMonths} days={schedule.days} />)}</div>
    </div>
  )
}
