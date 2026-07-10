import { test, expect } from '@playwright/test'
import { apiPattern, fulfillJson, fulfillNoContent, routeByMethod } from '../helpers/intercept'
import { PARENT_STORAGE_STATE } from '../helpers/authPaths'

test.describe('내 자녀 관리', () => {
  test.use({ storageState: PARENT_STORAGE_STATE })

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
