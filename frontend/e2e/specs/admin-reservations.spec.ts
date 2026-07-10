import { test, expect } from '@playwright/test'
import { AdminReservationsPagePO } from '../pages/AdminReservationsPage'
import { routeByMethod, fulfillJson, fulfillNoContent, apiPattern } from '../helpers/intercept'
import { ADMIN_STORAGE_STATE } from '../helpers/authPaths'
import reservationsFixture from '../fixtures/reservations.json' with { type: 'json' }
import reservationGroupsFixture from '../fixtures/reservation-groups.json' with { type: 'json' }

test.use({ storageState: ADMIN_STORAGE_STATE })

test.describe('관리자 - 예약 관리', () => {
  test.beforeEach(async ({ page }) => {
    let reservations = JSON.parse(JSON.stringify(reservationsFixture)) as typeof reservationsFixture
    let groups = JSON.parse(JSON.stringify(reservationGroupsFixture)) as typeof reservationGroupsFixture
    let nextGroupId = 100
    let nextReservationId = 100

    await routeByMethod(page, apiPattern('/reservations(\\?.*)?$'), {
      GET: (route) => fulfillJson(route, 200, reservations),
    })
    await routeByMethod(page, apiPattern('/reservations/walk-in$'), {
      POST: async (route) => {
        const input = route.request().postDataJSON()
        const created = {
          id: `reservation-e2e-${nextReservationId++}`,
          childName: input.childName,
          childAge: input.childAge,
          parentName: input.parentName,
          // ReservationSchema.parentEmail은 nullable이 아닌 z.string()이라 null을 보내면
          // 클라이언트 Zod 파싱이 조용히 실패해(catch) alert 없이 에러 문구만 뜬다(실제로 겪은 버그).
          parentEmail: input.parentEmail ?? '',
          parentPhone: input.parentPhone || null,
          preferredSlots: input.preferredSlots,
          note: null,
          status: 'WAITING',
          groupId: null,
          requestedGroupId: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        reservations = [...reservations, created]
        await fulfillJson(route, 201, created)
      },
    })
    await routeByMethod(page, apiPattern('/reservation-groups$'), {
      GET: (route) => fulfillJson(route, 200, groups),
      POST: async (route) => {
        const input = route.request().postDataJSON()
        const created = {
          id: `group-e2e-${nextGroupId++}`,
          label: input.label,
          status: 'CONFIRMED',
          capacity: input.capacity,
          minAge: input.minAge ?? 4,
          maxAge: input.maxAge ?? 10,
          slots: input.slots ?? [],
          reservations: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        groups = [...groups, created]
        await fulfillJson(route, 201, created)
      },
    })
    await routeByMethod(page, apiPattern('/reservation-groups/[^/]+$'), {
      DELETE: async (route) => {
        const url = route.request().url()
        const id = url.split('/').pop()!
        groups = groups.filter((group) => group.id !== id)
        await fulfillNoContent(route)
      },
    })
  })

  test('예약 관리 화면에 대기 중인 신청 수가 표시된다', async ({ page }) => {
    const admin = new AdminReservationsPagePO(page)
    await admin.navigate()

    await expect(page.getByRole('heading', { name: '예약 관리' })).toBeVisible()
    await expect(page.getByText('총 예약').locator('..')).toContainText(String(reservationsFixture.length))
  })

  test('빈 그룹을 만들면 목록에 나타나고, 삭제하면 사라진다', async ({ page }) => {
    const admin = new AdminReservationsPagePO(page)
    await admin.navigate()

    await admin.blankGroupNameInput.fill('E2E 신규 그룹')
    await admin.blankGroupCapacityInput.fill('4')
    await admin.createBlankGroupButton.click()

    await expect(admin.groupListItem('E2E 신규 그룹')).toBeVisible()

    page.once('dialog', (dialog) => dialog.accept())
    await admin.deleteGroupButtonFor('E2E 신규 그룹').click()

    await expect(admin.groupListItem('E2E 신규 그룹')).toHaveCount(0)
  })

  test('학생 직접 등록으로 워크인 예약을 추가할 수 있다', async ({ page }) => {
    const admin = new AdminReservationsPagePO(page)
    await admin.navigate()
    await admin.switchToWalkInTab()

    await admin.walkInParentNameInput.fill('워크인 보호자')
    await admin.walkInChildNameInput.fill('워크인 아이')
    await admin.walkInChildAgeInput.fill('6')
    await admin.selectSlotByKeyboard('WED', 900, 920)
    await expect(page.getByLabel('희망 시간 삭제')).toBeVisible()

    let dialogMessage: string | null = null
    page.once('dialog', async (dialog) => {
      dialogMessage = dialog.message()
      await dialog.accept()
    })
    await admin.walkInSubmitButton.click()

    await expect.poll(() => dialogMessage).toContain('학생이 성공적으로 등록되었습니다')
  })
})
