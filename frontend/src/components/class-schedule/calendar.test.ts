import assert from 'node:assert/strict'
import test from 'node:test'
import { buildMonthGrid, classMonthOptions, quarterMonths } from './calendar.ts'

void test('returns the three months in a quarter', () => {
  assert.deepEqual(quarterMonths(2026, 3), [7, 8, 9])
})

void test('builds only the weeks needed by a month', () => {
  const grid = buildMonthGrid(2026, 7)
  assert.equal(grid.length, 35)
  assert.equal(grid[0].date, '2026-06-28')
  assert.equal(grid.at(-1)?.date, '2026-08-01')
})

void test('handles leap-year February', () => {
  const grid = buildMonthGrid(2028, 2)
  assert.equal(grid.some((day) => day.date === '2028-02-29' && day.inMonth), true)
})

void test('starts an exact Sunday-starting month on day one', () => {
  const grid = buildMonthGrid(2026, 2)
  assert.equal(grid[0].date, '2026-02-01')
})

void test('shows only the previous final week in the first quarter calendar', () => {
  const grid = buildMonthGrid(2026, 4)
  assert.equal(grid[0].date, '2026-03-29')
  assert.equal(grid.at(-1)?.date, '2026-05-02')
})

void test('shows only the next first week in the last quarter calendar', () => {
  const grid = buildMonthGrid(2026, 6)
  assert.equal(grid[0].date, '2026-05-31')
  assert.equal(grid.at(-1)?.date, '2026-07-04')
})

void test('returns five color months from the previous through the next month', () => {
  assert.deepEqual(classMonthOptions(2026, 2), ['2026-03', '2026-04', '2026-05', '2026-06', '2026-07'])
})

void test('handles five color months across year boundaries', () => {
  assert.deepEqual(classMonthOptions(2026, 1), ['2025-12', '2026-01', '2026-02', '2026-03', '2026-04'])
  assert.deepEqual(classMonthOptions(2026, 4), ['2026-09', '2026-10', '2026-11', '2026-12', '2027-01'])
})
