import { test, expect } from '@playwright/test'
import { ApplyPagePO } from '../pages/ApplyPage'
import { routeByMethod, fulfillJson, apiPattern } from '../helpers/intercept'
import { PARENT_STORAGE_STATE, ADMIN_STORAGE_STATE } from '../helpers/authPaths'
import joinableGroupsFixture from '../fixtures/joinable-groups.json' with { type: 'json' }
import confirmedSlotsFixture from '../fixtures/confirmed-slots.json' with { type: 'json' }

async function mockApplyDependencies(page: import('@playwright/test').Page) {
  await routeByMethod(page, apiPattern('/reservation-groups/joinable$'), {
    GET: (route) => fulfillJson(route, 200, joinableGroupsFixture),
  })
  await routeByMethod(page, apiPattern('/reservation-groups/confirmed-slots$'), {
    GET: (route) => fulfillJson(route, 200, confirmedSlotsFixture),
  })
  await routeByMethod(page, apiPattern('/reservations$'), {
    POST: async (route) => {
      const input = route.request().postDataJSON()
      await fulfillJson(route, 201, {
        id: 'reservation-e2e-1',
        childName: input.childName,
        childAge: input.childAge,
        parentName: input.parentName,
        parentEmail: input.parentEmail,
        parentPhone: input.parentPhone ?? null,
        preferredSlots: input.preferredSlots,
        note: input.note ?? null,
        status: 'WAITING',
        groupId: null,
        requestedGroupId: input.requestedGroupId ?? null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    },
  })
}

test.describe('보호자 수업 신청 (정상 플로우)', () => {
  test.use({ storageState: PARENT_STORAGE_STATE })

  test.beforeEach(async ({ page }) => {
    await mockApplyDependencies(page)
  })

  test('희망 시간을 직접 선택해 신청하면 접수 완료 화면이 뜬다', async ({ page }) => {
    const apply = new ApplyPagePO(page)
    await apply.navigate()

    await apply.childNameInput.fill('김아이')
    await apply.parentNameInput.fill('김부모')
    await apply.parentEmailInput.fill('parent.e2e@example.com')

    await apply.selectSlotByKeyboard('MON', 840, 860)

    await apply.submitButton.click()

    await expect(apply.successHeading).toBeVisible()
  })

  test('모집중인 반에 합류 신청하면 희망 시간이 자동으로 채워진다', async ({ page }) => {
    const apply = new ApplyPagePO(page)
    await apply.navigate()

    await apply.childNameInput.fill('이아이')
    await apply.parentNameInput.fill('이부모')
    await apply.parentEmailInput.fill('parent2.e2e@example.com')

    const group = joinableGroupsFixture[0]
    await apply.joinGroupButton(group.label).click()
    await expect(page.getByText(`"${group.label}" 반에 합류를 신청했습니다`)).toBeVisible()

    await apply.submitButton.click()

    await expect(apply.successHeading).toBeVisible()
  })
})

test.describe('보호자 수업 신청 (접근 제어)', () => {
  test('로그인하지 않으면 로그인 유도 화면으로 리다이렉트된다', async ({ page }) => {
    await page.goto('/apply')
    await expect(page).toHaveURL(/[?&]login=1/)
  })

  test.describe('관리자 프리뷰', () => {
    test.use({ storageState: ADMIN_STORAGE_STATE })

    test('관리자만 로그인한 상태면 프리뷰로 열리고 제출은 alert로 차단된다', async ({ page }) => {
      await mockApplyDependencies(page)
      const apply = new ApplyPagePO(page)
      await apply.navigate()

      await expect(page.getByText('관리자 미리보기 화면입니다.')).toBeVisible()

      await apply.childNameInput.fill('관리자테스트')
      await apply.parentNameInput.fill('관리자')
      await apply.parentEmailInput.fill('admin-preview@example.com')
      await apply.selectSlotByKeyboard('TUE', 840, 860)

      // alert()는 브라우저 렌더러 스레드를 동기적으로 막기 때문에, click()을 await한 뒤
      // waitForEvent로 다이얼로그를 기다리면 click() 자체가 절대 resolve되지 않고 데드락된다.
      // page.on('dialog', ...)로 미리 등록해 CDP 레벨에서 즉시 처리되게 한다.
      let dialogMessage: string | null = null
      page.once('dialog', async (dialog) => {
        dialogMessage = dialog.message()
        await dialog.accept()
      })
      await apply.submitButton.click()
      await expect.poll(() => dialogMessage).toContain('관리자는 상담 신청을 할 수 없습니다')

      await expect(apply.successHeading).not.toBeVisible()
    })
  })
})
