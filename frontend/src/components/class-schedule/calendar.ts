export interface CalendarDay {
  date: string
  day: number
  weekday: number
  inMonth: boolean
}

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10)
}

export function quarterMonths(_year: number, quarter: number) {
  const first = (quarter - 1) * 3 + 1
  return [first, first + 1, first + 2]
}

export function classMonthOptions(year: number, quarter: number) {
  const previousMonth = (quarter - 1) * 3 - 1
  return Array.from({ length: 5 }, (_, index) => {
    const date = new Date(Date.UTC(year, previousMonth + index, 1))
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
  })
}

export function buildMonthGrid(year: number, month: number): (CalendarDay | null)[] {
  const first = new Date(Date.UTC(year, month - 1, 1))
  const last = new Date(Date.UTC(year, month, 0))
  const start = new Date(first)
  start.setUTCDate(first.getUTCDate() - first.getUTCDay())
  const end = new Date(last)
  end.setUTCDate(last.getUTCDate() + (6 - last.getUTCDay()))
  const dayCount = Math.floor((end.getTime() - start.getTime()) / 86_400_000) + 1
  return Array.from({ length: dayCount }, (_, index) => {
    const date = new Date(start)
    date.setUTCDate(start.getUTCDate() + index)
    const inMonth = date.getUTCFullYear() === year && date.getUTCMonth() === month - 1
    return inMonth ? { date: isoDate(date), day: date.getUTCDate(), weekday: date.getUTCDay(), inMonth } : null
  })
}

export function classMonthLabel(classMonth: string) {
  return `${Number(classMonth.slice(5))}월분`
}
