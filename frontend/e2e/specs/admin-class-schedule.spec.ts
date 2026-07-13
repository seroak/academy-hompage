import { expect, test } from '@playwright/test'
import { ADMIN_STORAGE_STATE } from '../helpers/authPaths'
import { apiPattern, fulfillJson, fulfillNoContent, routeByMethod } from '../helpers/intercept'
import fixture from '../fixtures/class-schedules.json' with { type: 'json' }

test.use({ storageState: ADMIN_STORAGE_STATE })

test.describe('관리자 수업 일정', () => {
  test.beforeEach(async ({ page }) => {
    let schedules = structuredClone(fixture)
    await routeByMethod(page, apiPattern('/class-schedules$'), {
      GET: (route) => fulfillJson(route, 200, schedules),
      POST: async (route) => {
        const input = route.request().postDataJSON()
        const created = { id: 'schedule-new', status: 'DRAFT', publishedAt: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), ...input }
        schedules = [created, ...schedules]
        await fulfillJson(route, 201, created)
      },
    })
    await routeByMethod(page, apiPattern('/class-schedules/[^/]+$'), {
      PATCH: async (route) => {
        const id = route.request().url().split('/').pop()!
        const input = route.request().postDataJSON()
        schedules = schedules.map((schedule) => schedule.id === id ? { ...schedule, ...input, updatedAt: new Date().toISOString() } : schedule)
        await fulfillJson(route, 200, schedules.find((schedule) => schedule.id === id))
      },
      DELETE: async (route) => {
        const id = route.request().url().split('/').pop()!
        schedules = schedules.filter((schedule) => schedule.id !== id)
        await fulfillNoContent(route)
      },
    })
    await page.route(apiPattern('/class-schedules/[^/]+/publish$'), async (route) => {
      const id = route.request().url().split('/').at(-2)!
      schedules = schedules.map((schedule) => schedule.id === id ? { ...schedule, status: 'PUBLISHED' as const, publishedAt: new Date().toISOString() } : schedule)
      await fulfillJson(route, 200, schedules.find((schedule) => schedule.id === id))
    })
  })

  test('분기를 만들고 날짜를 월분별로 지정한 뒤 게시한다', async ({ page }) => {
    await page.goto('/admin/schedules')
    await page.getByLabel('연도').fill('2027')
    await page.getByLabel('분기', { exact: true }).selectOption('1')
    await page.getByRole('button', { name: '새 일정 만들기' }).click()

    for (const [date, label, month] of [['2027-01-04', '1월분', 1], ['2027-02-01', '2월분', 2], ['2027-03-01', '3월분', 3]] as const) {
      await page.getByRole('table', { name: `2027년 ${month}월` }).getByRole('cell', { name: new RegExp(`^${date}`) }).click()
      await page.getByRole('region', { name: '선택 날짜 편집' }).getByRole('button', { name: label, exact: true }).click()
    }
    await page.getByRole('button', { name: '임시저장' }).click()
    await expect(page.getByText('저장했습니다.')).toBeVisible()
    await page.getByRole('button', { name: '게시하기' }).click()
    await expect(page.getByText('게시 중')).toBeVisible()
  })

  test('휴일 메모를 날짜 셀에 반영하고 미저장 상태를 표시한다', async ({ page }) => {
    await page.goto('/admin/schedules')
    await page.getByRole('cell', { name: /^2026-08-18/ }).click()
    await page.getByRole('region', { name: '선택 날짜 편집' }).getByRole('button', { name: '공휴일', exact: true }).click()
    await page.getByLabel('날짜 메모').fill('학원 휴무')
    await expect(page.getByText('저장하지 않은 변경사항')).toBeVisible()
    await expect(page.getByRole('cell', { name: /2026-08-18 학원 휴무/ })).toBeVisible()
  })

  test('선택한 도구로 여러 날짜를 드래그해 한 번에 지정한다', async ({ page }) => {
    await page.goto('/admin/schedules')
    await page.getByRole('toolbar', { name: '드래그 도구' }).getByRole('button', { name: '7월분' }).click()

    const calendar = page.getByRole('table', { name: '2026년 7월' })
    const first = calendar.getByRole('cell', { name: /^2026-07-06/ }).getByRole('button')
    const middle = calendar.getByRole('cell', { name: /^2026-07-07/ }).getByRole('button')
    const last = calendar.getByRole('cell', { name: /^2026-07-08/ }).getByRole('button')
    await first.scrollIntoViewIfNeeded()
    const firstBox = await first.boundingBox()
    const lastBox = await last.boundingBox()
    if (!firstBox || !lastBox) throw new Error('드래그할 날짜 셀 위치를 찾지 못했습니다.')

    await page.mouse.move(firstBox.x + firstBox.width / 2, firstBox.y + firstBox.height / 2)
    await page.mouse.down()
    await page.mouse.move(lastBox.x + lastBox.width / 2, lastBox.y + lastBox.height / 2, { steps: 10 })
    await page.mouse.up()

    for (const day of [first, middle, last]) {
      await expect(day).toHaveClass(/bg-\[#c9ecff\]/)
    }
    await expect(page.getByText('저장하지 않은 변경사항')).toBeVisible()
  })

  test('전월·다음월 도구를 표시하고 전월 마지막 주를 드래그 지정한다', async ({ page }) => {
    await page.goto('/admin/schedules')
    await page.getByLabel('등록된 일정').selectOption('schedule-2026-q2')
    const toolbar = page.getByRole('toolbar', { name: '드래그 도구' })
    await expect(toolbar.getByRole('button', { name: '3월분' })).toBeVisible()
    await expect(toolbar.getByRole('button', { name: '7월분' })).toBeVisible()
    await toolbar.getByRole('button', { name: '3월분' }).click()

    const calendar = page.getByRole('table', { name: '2026년 4월' })
    const first = calendar.getByRole('cell', { name: /^2026-03-29/ }).getByRole('button')
    const last = calendar.getByRole('cell', { name: /^2026-03-31/ }).getByRole('button')
    await first.scrollIntoViewIfNeeded()
    const firstBox = await first.boundingBox()
    const lastBox = await last.boundingBox()
    if (!firstBox || !lastBox) throw new Error('확장 날짜 셀 위치를 찾지 못했습니다.')

    await page.mouse.move(firstBox.x + firstBox.width / 2, firstBox.y + firstBox.height / 2)
    await page.mouse.down()
    await page.mouse.move(lastBox.x + lastBox.width / 2, lastBox.y + lastBox.height / 2, { steps: 10 })
    await page.mouse.up()

    await expect(last).toHaveClass(/bg-\[#eadcff\]/)
  })

  test('일정을 삭제하면 목록에서 제거한다', async ({ page }) => {
    await page.goto('/admin/schedules')
    page.once('dialog', (dialog) => dialog.accept())
    await page.getByRole('button', { name: '일정 삭제' }).click()
    await expect(page.getByRole('option', { name: '2026년 3분기' })).toHaveCount(0)
  })
})
