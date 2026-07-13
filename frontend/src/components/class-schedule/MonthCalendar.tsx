import type { ClassScheduleDay } from '../../api/schemas/class-schedule.schema'
import { buildMonthGrid } from './calendar'

const monthColors = ['bg-[#f0e5ff] border-[#a879d6]', 'bg-[#d7f4f0] border-[#4ca99f]', 'bg-[#dff3a8] border-[#acd85d]', 'bg-[#ffeaa1] border-[#f1c84b]', 'bg-[#ffd5c2] border-[#efaa8c]']
export function monthColor(index: number) { return monthColors[index] ?? monthColors[1] }

export default function MonthCalendar({ year, month, classMonths, days, onDateClick, onDatePointerStart, onDatePointerEnter, selectedDate }: {
  year: number; month: number; classMonths: string[]; days: ClassScheduleDay[]
  onDateClick?: (date: string) => void
  onDatePointerStart?: (date: string, pointerType: string) => void
  onDatePointerEnter?: (date: string, pointerType: string) => void
  selectedDate?: string | null
}) {
  const entries = new Map(days.map((day) => [day.date, day]))
  const grid = buildMonthGrid(year, month)
  const weeks = Array.from({ length: grid.length / 7 }, (_, index) => grid.slice(index * 7, index * 7 + 7))
  return (
    <section data-testid="month-calendar" className="min-w-0">
      <h2 className="mb-3 text-center text-xl font-black text-[#2b2418]">{month}월 수업일정</h2>
      <div className="overflow-hidden rounded-[22px] border border-[#ead9b8] bg-[#ead9b8]">
      <table className="w-full table-fixed select-none border-separate border-spacing-px" aria-label={`${year}년 ${month}월`}>
        <thead><tr>{['일', '월', '화', '수', '목', '금', '토'].map((label, index) => <th scope="col" key={label} className={`bg-[#fffdf7] py-2 text-center text-xs font-black ${index === 0 ? 'text-[#d44732]' : index === 6 ? 'text-[#3466c2]' : 'text-[#655b4c]'}`}>{label}</th>)}</tr></thead>
        <tbody>{weeks.map((week, weekIndex) => <tr key={weekIndex}>{week.map((calendarDay, dayIndex) => {
          if (!calendarDay) return <td key={`blank-${weekIndex}-${dayIndex}`} aria-hidden="true" className="bg-[#fffdf7] p-0" />
          const entry = entries.get(calendarDay.date)
          const colorIndex = entry?.classMonth ? classMonths.indexOf(entry.classMonth) : -1
          const cellClass = entry?.kind === 'CLASS' ? `${monthColor(colorIndex)} border` : entry?.kind === 'HOLIDAY' ? 'bg-[#fff0eb] border border-[#f2b8aa]' : entry?.kind === 'CLOSED' ? 'bg-[#f3eee4] border border-[#d9cdbb]' : 'bg-[#fffdf7] border border-transparent'
          const weekdayClass = entry?.kind === 'HOLIDAY' || calendarDay.weekday === 0 ? 'text-[#d44732]' : calendarDay.weekday === 6 ? 'text-[#3466c2]' : 'text-[#332c22]'
          const displayedDay = calendarDay.inMonth ? String(calendarDay.day) : `${Number(calendarDay.date.slice(5, 7))}/${calendarDay.day}`
          const content = <><span className={`text-sm font-black ${weekdayClass}`}>{displayedDay}</span>{entry?.note && <span className="mt-1 line-clamp-2 text-[10px] font-black leading-tight text-[#a23a2c]">{entry.note}</span>}</>
          const common = `min-h-[68px] p-2 text-left align-top transition ${cellClass} ${calendarDay.inMonth || entry ? '' : 'opacity-55'} ${selectedDate === calendarDay.date ? 'ring-2 ring-inset ring-[#e86f00]' : ''}`
          return <td key={calendarDay.date} aria-label={`${calendarDay.date}${entry?.note ? ` ${entry.note}` : ''}`} className="p-0">{onDateClick ? <button
            type="button"
            onClick={() => onDateClick(calendarDay.date)}
            onPointerDown={(event) => {
              if (event.pointerType !== 'touch') event.preventDefault()
              onDatePointerStart?.(calendarDay.date, event.pointerType)
            }}
            onPointerEnter={(event) => onDatePointerEnter?.(calendarDay.date, event.pointerType)}
            className={`block w-full touch-pan-y ${common} focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-[#9f4d00]`}
          >{content}</button> : <div className={common}>{content}</div>}</td>
        })}</tr>)}</tbody>
      </table>
      </div>
    </section>
  )
}
