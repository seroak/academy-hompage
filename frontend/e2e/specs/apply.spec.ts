import { test, expect } from '@playwright/test'
import { ApplyPagePO } from '../pages/ApplyPage'
import { routeByMethod, fulfillJson, apiPattern } from '../helpers/intercept'
import { PARENT_STORAGE_STATE, ADMIN_STORAGE_STATE } from '../helpers/authPaths'
import joinableGroupsFixture from '../fixtures/joinable-groups.json' with { type: 'json' }
import confirmedSlotsFixture from '../fixtures/confirmed-slots.json' with { type: 'json' }

const childrenFixture = [
  { id: 'child-e2e-1', name: '김아이', age: 5, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
  { id: 'child-e2e-2', name: '이아이', age: 6, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
]

async function mockApplyDependencies(page: import('@playwright/test').Page) {
  await routeByMethod(page, apiPattern('/children$'), {
    GET: (route) => fulfillJson(route, 200, childrenFixture),
  })
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

    await apply.childSelect.selectOption('child-e2e-1')
    await apply.parentNameInput.fill('김부모')
    await apply.parentEmailInput.fill('parent.e2e@example.com')
    await apply.parentPhoneInput.fill('010-1234-5678')

    await apply.selectSlotByKeyboard('MON', 840, 860)

    await apply.submitButton.click()

    await expect(apply.successHeading).toBeVisible()
  })

  test('모집중인 반에 합류 신청하면 희망 시간이 자동으로 채워진다', async ({ page }) => {
    const apply = new ApplyPagePO(page)
    await apply.navigate()

    await apply.childSelect.selectOption('child-e2e-2')
    await apply.parentNameInput.fill('이부모')
    await apply.parentEmailInput.fill('parent2.e2e@example.com')
    await apply.parentPhoneInput.fill('010-2345-6789')

    const group = joinableGroupsFixture[0]
    await apply.joinGroupButton(group.label).click()
    await expect(page.getByText(`"${group.label}" 반에 합류를 신청했습니다`)).toBeVisible()

    await apply.submitButton.click()

    await expect(apply.successHeading).toBeVisible()
  })

  test('전화번호 없이 신청하면 필수 입력 오류를 표시하고 전송하지 않는다', async ({ page }) => {
    const apply = new ApplyPagePO(page)
    await apply.navigate()

    await apply.childSelect.selectOption('child-e2e-1')
    await apply.parentNameInput.fill('보호자')
    await apply.parentEmailInput.fill('no-phone@example.com')
    await apply.selectSlotByKeyboard('MON', 840, 860)

    await apply.submitButton.click()

    await expect(page.getByText('전화번호를 입력해 주세요')).toBeVisible()
    await expect(apply.successHeading).not.toBeVisible()
  })

  test('모집 중인 시간은 잔여석을 채운 배경으로 명확히 표시한다', async ({ page }) => {
    const apply = new ApplyPagePO(page)
    await apply.navigate()

    const cell = apply.slotCell('MON', 900)
    const remainingSeats = cell.getByText('잔여 2석')
    await expect(remainingSeats).toBeVisible()
    await expect(remainingSeats).toHaveCSS('font-size', '10px')
    await expect(cell).toHaveClass(/bg-emerald-500/)
  })

  test('모바일에서 시간표는 요일 탭으로 하루씩 보여주며 가로 스크롤이 없다', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 844 })
    const apply = new ApplyPagePO(page)
    await apply.navigate()

    // matchMedia 기반 useIsNarrow는 마운트 후 useEffect에서 갱신되므로,
    // 요일 탭이 실제로 뜰 때까지 기다린 뒤 폭을 측정해야 하이드레이션 타이밍에
    // 흔들리지 않는다.
    await expect(apply.dayTabs).toBeVisible()

    const widths = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      document: document.documentElement.scrollWidth,
      picker: document.querySelector('[data-testid="preferred-slots-scroll"]')?.scrollWidth ?? 0,
      pickerViewport: document.querySelector('[data-testid="preferred-slots-scroll"]')?.clientWidth ?? 0,
    }))

    expect(widths.document).toBe(widths.viewport)
    expect(widths.picker).toBe(widths.pickerViewport)
  })

  test('데스크톱에서는 요일 탭 없이 5일 그리드를 그대로 보여준다', async ({ page }) => {
    const apply = new ApplyPagePO(page)
    await apply.navigate()

    await expect(apply.dayTabs).toHaveCount(0)
    await expect(apply.slotCell('FRI', 840)).toBeVisible()
  })

  test('시간표 셀은 모바일 터치에 충분한 높이를 제공한다', async ({ page }) => {
    const apply = new ApplyPagePO(page)
    await apply.navigate()

    const box = await apply.slotCell('MON', 840).boundingBox()

    expect(box?.height).toBeGreaterThanOrEqual(44)
  })

  test('모바일에서 두 번 탭하는 사이에 스크롤해도 시간이 정상적으로 선택된다', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 844 })
    const apply = new ApplyPagePO(page)
    await apply.navigate()
    await expect(apply.dayTabs).toBeVisible()

    await apply.childSelect.selectOption('child-e2e-1')
    await apply.parentNameInput.fill('김부모')
    await apply.parentEmailInput.fill('parent.tap.e2e@example.com')
    await apply.parentPhoneInput.fill('010-1234-5678')

    await apply.selectSlotByTap('MON', 840, 860, { scrollBetween: true })

    await apply.submitButton.click()

    await expect(apply.successHeading).toBeVisible()
  })

  test('희망 시간을 먼저 선택한 뒤 자녀를 선택해도 시간 선택이 유지된다', async ({ page }) => {
    const apply = new ApplyPagePO(page)
    await apply.navigate()

    await apply.selectSlotByKeyboard('MON', 840, 860)
    await apply.childSelect.selectOption('child-e2e-1')

    await expect(page.getByText('월 14:00~14:20 · 20분')).toBeVisible()
  })

  test('자녀가 없어도 레벨테스트 안내 없이 상담 신청만 안내한다', async ({ page }) => {
    await routeByMethod(page, apiPattern('/children$'), {
      GET: (route) => fulfillJson(route, 200, []),
    })

    const apply = new ApplyPagePO(page)
    await apply.navigate()

    await expect(
      page.getByText('등록한 자녀 정보로 상담 신청을 편리하게 진행할 수 있습니다.'),
    ).toBeVisible()
    await expect(page.getByText(/레벨테스트/)).toHaveCount(0)
  })

  test('모바일에서 요일 탭을 바꾸면 진행 중인 선택이 초기화된다', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 844 })
    const apply = new ApplyPagePO(page)
    await apply.navigate()
    await expect(apply.dayTabs).toBeVisible()

    // 시작 탭만 해서 anchor를 잡아둔 뒤, 다른 요일 탭으로 전환한다.
    await apply.tapSlotCell('MON', 840)
    await apply.dayTab('화').click()

    await expect(page.getByText('시작 시각을 탭한 뒤 종료 시각을 한 번 더 탭하세요')).toBeVisible()
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

      // 관리자는 자녀 관리와 분리된 기존 미리보기 흐름을 유지한다.
      await apply.childNameInput.fill('관리자테스트')
      await apply.parentNameInput.fill('관리자')
      await apply.parentEmailInput.fill('admin-preview@example.com')
      await apply.parentPhoneInput.fill('010-3456-7890')
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
