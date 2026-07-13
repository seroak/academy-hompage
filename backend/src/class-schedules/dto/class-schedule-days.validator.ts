import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import type { ClassScheduleDayDto } from './class-schedule-day.dto.js';

function dateString(date: Date) {
  return date.toISOString().slice(0, 10);
}

function visibleBounds(year: number, quarter: number) {
  const firstMonth = (quarter - 1) * 3;
  const first = new Date(Date.UTC(year, firstMonth, 1));
  const last = new Date(Date.UTC(year, firstMonth + 3, 0));
  const start = new Date(first);
  start.setUTCDate(first.getUTCDate() - first.getUTCDay());
  const end = new Date(last);
  end.setUTCDate(last.getUTCDate() + (6 - last.getUTCDay()));
  return { start: dateString(start), end: dateString(end) };
}

export function scheduleClassMonths(year: number, quarter: number) {
  const previousMonth = (quarter - 1) * 3 - 1;
  return Array.from({ length: 5 }, (_, index) => {
    const date = new Date(Date.UTC(year, previousMonth + index, 1));
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
  });
}

export function quarterClassMonths(year: number, quarter: number) {
  const firstMonth = (quarter - 1) * 3 + 1;
  return Array.from(
    { length: 3 },
    (_, index) => `${year}-${String(firstMonth + index).padStart(2, '0')}`,
  );
}

export function areScheduleDaysValid(
  year: number,
  quarter: number,
  days: ClassScheduleDayDto[],
) {
  const { start, end } = visibleBounds(year, quarter);
  const months = new Set(scheduleClassMonths(year, quarter));
  const dates = new Set<string>();
  return days.every((day) => {
    if (!day || dates.has(day.date) || day.date < start || day.date > end)
      return false;
    dates.add(day.date);
    if (day.kind === 'CLASS')
      return typeof day.classMonth === 'string' && months.has(day.classMonth);
    return day.classMonth === undefined || day.classMonth === null;
  });
}

@ValidatorConstraint({ name: 'validClassScheduleDays', async: false })
export class ClassScheduleDaysConstraint implements ValidatorConstraintInterface {
  validate(days: ClassScheduleDayDto[], args: ValidationArguments) {
    if (!Array.isArray(days)) return false;
    const source = args.object as { year?: number; quarter?: number };
    if (!source.year || !source.quarter) return false;
    return areScheduleDaysValid(source.year, source.quarter, days);
  }

  defaultMessage() {
    return '날짜가 중복되었거나 분기 범위와 수업 월 지정이 올바르지 않습니다.';
  }
}
