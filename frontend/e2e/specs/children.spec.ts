import { test, expect } from '@playwright/test'
import { apiPattern, fulfillJson, fulfillNoContent, routeByMethod } from '../helpers/intercept'
import { PARENT_STORAGE_STATE } from '../helpers/authPaths'

test.describe('내 자녀 관리', () => {
  test.use({ storageState: PARENT_STORAGE_STATE })

  test('자녀 등록 응답을 기다리지 않고 목록에 즉시 표시한다', async ({ page }) => {
    const children: Array<{ id: string; name: string; age: number; createdAt: string; updatedAt: string }> = []
    let fulfillCreate: (() => Promise<void>) | undefined

    await routeByMethod(page, apiPattern('/children$'), {
      GET: (route) => fulfillJson(route, 200, children),
      POST: (route) => {
        fulfillCreate = async () => {
          const input = route.request().postDataJSON()
          const child = { id: 'child-e2e-optimistic', ...input, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' }
          children.push(child)
          await fulfillJson(route, 201, child)
        }
      },
    })

    await page.goto('/children')
    await expect(page.getByText('등록한 자녀 정보는 상담 신청에 그대로 사용할 수 있습니다.')).toBeVisible()
    await page.getByLabel('자녀 이름').fill('즉시 표시 아이')
    await page.getByLabel('만 나이').selectOption('5')
    await page.getByRole('button', { name: '자녀 등록' }).click()

    await expect(page.getByText('즉시 표시 아이 · 만 5세')).toBeVisible({ timeout: 1_000 })
    await fulfillCreate?.()
  })

  test('자녀 등록이 실패하면 즉시 표시한 항목을 되돌린다', async ({ page }) => {
    let rejectCreate: (() => Promise<void>) | undefined

    await routeByMethod(page, apiPattern('/children$'), {
      GET: (route) => fulfillJson(route, 200, []),
      POST: (route) => {
        rejectCreate = () => fulfillJson(route, 500, { message: '저장 실패' })
      },
    })

    await page.goto('/children')
    await page.getByLabel('자녀 이름').fill('롤백 아이')
    await page.getByLabel('만 나이').selectOption('6')
    await page.getByRole('button', { name: '자녀 등록' }).click()
    await expect(page.getByText('롤백 아이 · 만 6세')).toBeVisible()

    await rejectCreate?.()
    await expect(page.getByText('롤백 아이 · 만 6세')).toHaveCount(0)
    await expect(page.getByText('자녀 정보를 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.')).toBeVisible()
  })

  test('자녀를 등록하고 수정한 뒤 삭제할 수 있다', async ({ page }) => {
    let children: Array<{ id: string; name: string; age: number; createdAt: string; updatedAt: string }> = []
    await routeByMethod(page, apiPattern('/children(?:/[^/]+)?$'), {
      GET: (route) => fulfillJson(route, 200, children),
      POST: async (route) => {
        const input = route.request().postDataJSON()
        const child = { id: 'child-e2e-1', ...input, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' }
        children = [child]
        await fulfillJson(route, 201, child)
      },
      PATCH: async (route) => {
        const input = route.request().postDataJSON()
        children = children.map((child) => ({ ...child, ...input }))
        await fulfillJson(route, 200, children[0])
      },
      DELETE: async (route) => {
        children = []
        await fulfillNoContent(route)
      },
    })

    await page.goto('/children')
    await page.getByLabel('자녀 이름').fill('김아이')
    await page.getByLabel('만 나이').selectOption('5')
    await page.getByRole('button', { name: '자녀 등록' }).click()
    await expect(page.getByText('김아이 · 만 5세')).toBeVisible()

    await page.getByRole('button', { name: '수정' }).click()
    await page.getByLabel('자녀 이름').fill('김새이름')
    await page.getByRole('button', { name: '변경 저장' }).click()
    await expect(page.getByText('김새이름 · 만 5세')).toBeVisible()

    page.once('dialog', (dialog) => dialog.accept())
    await page.getByRole('button', { name: '삭제' }).click()
    await expect(page.getByText('등록된 자녀가 없습니다.')).toBeVisible()
  })
})
