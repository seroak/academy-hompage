import assert from 'node:assert/strict'
import test from 'node:test'
import { buildMonthGrid, classMonthOptions, quarterMonths } from './calendar.ts'

void test('returns the three months in a quarter', () => {
  assert.deepEqual(quarterMonths(2026, 3), [7, 8, 9])
})

void test('builds only the weeks needed by a month, padding adjacent-month days with null', () => {
  const grid = buildMonthGrid(2026, 7)
  assert.equal(grid.length, 35)
  assert.equal(grid[0], null)
  assert.equal(grid.at(-1), null)
  const inMonthDates = grid.filter((day) => day !== null).map((day) => day!.date)
  assert.equal(inMonthDates[0], '2026-07-01')
  assert.equal(inMonthDates.at(-1), '2026-07-31')
})

void test('handles leap-year February', () => {
  const grid = buildMonthGrid(2028, 2)
  assert.equal(grid.some((day) => day?.date === '2028-02-29'), true)
})

void test('starts an exact Sunday-starting month on day one', () => {
  const grid = buildMonthGrid(2026, 2)
  assert.equal(grid[0]?.date, '2026-02-01')
})

void test('pads the previous month as null in the first quarter calendar', () => {
  const grid = buildMonthGrid(2026, 4)
  assert.equal(grid[0], null)
  assert.equal(grid[1], null)
  assert.equal(grid[2], null)
  assert.equal(grid[3]?.date, '2026-04-01')
})

void test('pads the next month as null in the last quarter calendar', () => {
  const grid = buildMonthGrid(2026, 6)
  assert.equal(grid[0], null)
  assert.equal(grid.at(-1), null)
  const inMonthDates = grid.filter((day) => day !== null).map((day) => day!.date)
  assert.equal(inMonthDates.at(-1), '2026-06-30')
})

void test('returns five color months from the previous through the next month', () => {
  assert.deepEqual(classMonthOptions(2026, 2), ['2026-03', '2026-04', '2026-05', '2026-06', '2026-07'])
})

void test('handles five color months across year boundaries', () => {
  assert.deepEqual(classMonthOptions(2026, 1), ['2025-12', '2026-01', '2026-02', '2026-03', '2026-04'])
  assert.deepEqual(classMonthOptions(2026, 4), ['2026-09', '2026-10', '2026-11', '2026-12', '2027-01'])
})
