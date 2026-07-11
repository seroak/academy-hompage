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
        const groupId = `group-e2e-${nextGroupId++}`
        const created = {
          id: groupId,
          label: input.label,
          status: 'CONFIRMED',
          capacity: input.capacity,
          minAge: input.minAge ?? 4,
          maxAge: input.maxAge ?? 10,
          scheduleDayOfWeek: input.scheduleDayOfWeek ?? null,
          scheduleStartMinute: input.scheduleStartMinute ?? null,
          scheduleEndMinute: input.scheduleEndMinute ?? null,
          slots: (input.slots ?? []).map((slot: Record<string, unknown>, index: number) => ({
            id: `${groupId}-slot-${index}`,
            ...slot,
          })),
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

  test('빈 수업을 만들면 지정한 시간표 칸에 바로 표시된다', async ({ page }) => {
    const admin = new AdminReservationsPagePO(page)
    await admin.navigateToGroups()

    await admin.blankGroupNameInput.fill('E2E 신규 그룹')
    await admin.blankGroupCapacityInput.fill('4')
    await admin.blankGroupDayInput.selectOption('WED')
    await admin.blankGroupStartTimeInput.selectOption('900')
    await admin.blankGroupEndTimeInput.selectOption('920')
    await admin.createBlankGroupButton.click()

    await expect(admin.groupListItem('E2E 신규 그룹')).toBeVisible()

    await admin.navigate()
    const scheduledCell = page.getByTestId('timetable-cell-WED-900')
    await expect(scheduledCell.getByTestId('empty-group-group-e2e-100')).toContainText('E2E 신규 그룹')
    await expect(scheduledCell.getByTestId('empty-group-group-e2e-100')).toContainText('0/4')
  })

  test('시간표에서 단일 시간블록으로 그룹을 확정하면 반의 고정 일정으로도 저장된다', async ({ page }) => {
    // 반이 나중에 학생 이동으로 비어도 그리드에서 사라지지 않으려면, 확정 시점에
    // scheduleDayOfWeek/StartMinute/EndMinute가 함께 저장돼야 한다(useGroupForm.ts).
    const admin = new AdminReservationsPagePO(page)
    await admin.navigate()

    for (let minute = 900; minute < 960; minute += 10) {
      await page.getByTestId(`timetable-cell-MON-${minute}`).locator('button').filter({ hasText: '박아이' }).click()
    }

    const createRequest = page.waitForRequest(
      (request) => request.url().includes('/reservation-groups') && request.method() === 'POST',
    )
    await page.getByLabel('그룹 이름', { exact: true }).fill('E2E 단일블록반')
    await page.getByRole('button', { name: '그룹 확정하기' }).click()
    const request = await createRequest
    const body = request.postDataJSON()

    expect(body.scheduleDayOfWeek).toBe('MON')
    expect(body.scheduleStartMinute).toBe(900)
    expect(body.scheduleEndMinute).toBe(960)
  })

  test('학생이 모두 빠져 빈 반이 된 그룹은 그리드에서 사라지지 않고, 삭제 버튼으로 지울 수 있다', async ({ page }) => {
    // moveMember/removeMember로 반이 비면(멤버 0, slots 0) 확정 시 저장해 둔 schedule 필드로
    // 그리드에 "빈 수업" 자리표시가 계속 남아야 한다(EmptyGroupsSection). 그 자리표시의
    // 삭제 버튼이 실제로 DELETE /reservation-groups/:id를 호출하는지 확인한다.
    const emptiedGroup = {
      id: 'group-emptied',
      label: '비워진 반',
      status: 'EMPTY',
      capacity: 4,
      minAge: 4,
      maxAge: 6,
      scheduleDayOfWeek: 'THU',
      scheduleStartMinute: 900,
      scheduleEndMinute: 960,
      slots: [],
      reservations: [],
      createdAt: '2026-01-10T00:00:00.000Z',
      updatedAt: '2026-01-10T00:00:00.000Z',
    }
    let deleteCalled = false
    await page.route(apiPattern('/reservation-groups$'), async (route) => {
      if (route.request().method() !== 'GET') return route.fallback()
      await fulfillJson(route, 200, deleteCalled ? [] : [emptiedGroup])
    })
    await page.route(apiPattern('/reservation-groups/group-emptied$'), async (route) => {
      if (route.request().method() !== 'DELETE') return route.fallback()
      deleteCalled = true
      await fulfillNoContent(route)
    })

    const admin = new AdminReservationsPagePO(page)
    await admin.navigate()

    const placeholder = page.getByTestId('timetable-cell-THU-900').getByTestId('empty-group-group-emptied')
    await expect(placeholder).toContainText('비워진 반')
    await expect(placeholder).toContainText('0/4')

    page.once('dialog', (dialog) => dialog.accept())
    await placeholder.getByTestId('delete-empty-group-group-emptied').click()

    await expect(page.getByTestId('timetable-cell-THU-900').getByTestId('empty-group-group-emptied')).toHaveCount(0)
  })

  test('학생을 다른 확정 그룹으로 드래그해도 대상 그룹이 빈 수업으로 바뀌지 않는다', async ({ page }) => {
    // 회귀 테스트: moveMember 응답에 reservations가 빠지면(과거 버그) onSuccess가 대상
    // 그룹 캐시를 멤버 0명으로 덮어써 타임테이블이 "빈 수업"으로 잘못 렌더링했다.
    // 이 목 응답은 수정된 백엔드 계약(reservations 포함)을 그대로 반영한다.
    const movingReservation = {
      id: 'reservation-drag-src',
      childName: '이동학생',
      childAge: 6,
      parentName: '이동부모',
      parentEmail: 'move-src.e2e@example.com',
      parentPhone: null,
      preferredSlots: [
        { id: 'p-src-1', reservationId: 'reservation-drag-src', dayOfWeek: 'MON', startMinute: 900, endMinute: 960 },
      ],
      note: null,
      status: 'GROUPED',
      groupId: 'group-drag-source',
      requestedGroupId: null,
      createdAt: '2026-01-10T00:00:00.000Z',
      updatedAt: '2026-01-10T00:00:00.000Z',
    }
    const existingMember = {
      id: 'reservation-drag-existing',
      childName: '기존학생',
      childAge: 6,
      parentName: '기존부모',
      parentEmail: 'move-existing.e2e@example.com',
      parentPhone: null,
      preferredSlots: [
        { id: 'p-tgt-1', reservationId: 'reservation-drag-existing', dayOfWeek: 'MON', startMinute: 900, endMinute: 960 },
      ],
      note: null,
      status: 'GROUPED',
      groupId: 'group-drag-target',
      requestedGroupId: null,
      createdAt: '2026-01-10T00:00:00.000Z',
      updatedAt: '2026-01-10T00:00:00.000Z',
    }
    type MockGroupSlot = {
      id: string
      reservationId: string | null
      dayOfWeek: string
      startMinute: number
      endMinute: number
    }
    type MockGroup = {
      id: string
      label: string
      status: string
      capacity: number
      minAge: number
      maxAge: number
      scheduleDayOfWeek: string
      scheduleStartMinute: number
      scheduleEndMinute: number
      slots: MockGroupSlot[]
      reservations: unknown[]
      createdAt: string
      updatedAt: string
    }

    const sourceGroup: MockGroup = {
      id: 'group-drag-source',
      label: 'A반',
      status: 'CONFIRMED',
      capacity: 4,
      minAge: 4,
      maxAge: 8,
      scheduleDayOfWeek: 'MON',
      scheduleStartMinute: 900,
      scheduleEndMinute: 960,
      slots: [{ id: 'src-slot-1', reservationId: 'reservation-drag-src', dayOfWeek: 'MON', startMinute: 900, endMinute: 960 }],
      reservations: [movingReservation],
      createdAt: '2026-01-10T00:00:00.000Z',
      updatedAt: '2026-01-10T00:00:00.000Z',
    }
    const targetGroup: MockGroup = {
      id: 'group-drag-target',
      label: 'B반',
      status: 'CONFIRMED',
      capacity: 4,
      minAge: 4,
      maxAge: 8,
      scheduleDayOfWeek: 'MON',
      scheduleStartMinute: 900,
      scheduleEndMinute: 960,
      slots: [{ id: 'tgt-slot-1', reservationId: 'reservation-drag-existing', dayOfWeek: 'MON', startMinute: 900, endMinute: 960 }],
      reservations: [existingMember],
      createdAt: '2026-01-10T00:00:00.000Z',
      updatedAt: '2026-01-10T00:00:00.000Z',
    }

    // onSettled의 invalidateAll이 refetch를 트리거하므로, GET 목이 정적이면 낙관적
    // 갱신 직후 재조회로 원상태(이동 전)가 다시 덮어써진다. beforeEach의 패턴처럼
    // 이동 결과를 반영하는 가변 상태로 관리한다.
    let currentReservations = [movingReservation, existingMember]
    let currentGroups: MockGroup[] = [sourceGroup, targetGroup]

    await page.route(apiPattern('/reservations(\\?.*)?$'), async (route) => {
      if (route.request().method() !== 'GET') return route.fallback()
      await fulfillJson(route, 200, currentReservations)
    })
    await page.route(apiPattern('/reservation-groups$'), async (route) => {
      if (route.request().method() !== 'GET') return route.fallback()
      await fulfillJson(route, 200, currentGroups)
    })
    await page.route(
      apiPattern('/reservation-groups/group-drag-source/members/reservation-drag-src/move$'),
      async (route) => {
        const updatedTarget = {
          ...targetGroup,
          slots: [...targetGroup.slots, { id: 'tgt-slot-2', reservationId: 'reservation-drag-src', dayOfWeek: 'MON', startMinute: 900, endMinute: 960 }],
          reservations: [existingMember, { ...movingReservation, groupId: 'group-drag-target' }],
        }
        const updatedSource = {
          ...sourceGroup,
          status: 'EMPTY',
          slots: [{ ...sourceGroup.slots[0], reservationId: null }],
          reservations: [],
        }
        currentGroups = currentGroups.map((group) => {
          if (group.id === updatedTarget.id) return updatedTarget
          if (group.id === updatedSource.id) return updatedSource
          return group
        })
        currentReservations = currentReservations.map((reservation) =>
          reservation.id === movingReservation.id
            ? { ...reservation, groupId: 'group-drag-target' }
            : reservation,
        )
        await fulfillJson(route, 200, updatedTarget)
      },
    )

    const admin = new AdminReservationsPagePO(page)
    await admin.navigate()

    const cell = page.getByTestId('timetable-cell-MON-900')
    const sourceContainer = cell.getByTestId('grouped-reservations-group-drag-source')
    const targetContainer = cell.getByTestId('grouped-reservations-group-drag-target')
    await expect(sourceContainer.getByText('이동학생')).toBeVisible()
    await expect(targetContainer.getByText('기존학생')).toBeVisible()

    await sourceContainer.getByText('이동학생').dragTo(targetContainer)

    // 대상 그룹은 이동 도중에도, 이동이 끝난 뒤에도 "빈 수업" 플레이스홀더로 바뀌지 않고
    // 계속 기존 멤버 + 새로 옮겨온 멤버를 함께 보여줘야 한다.
    await expect(cell.getByTestId('empty-group-group-drag-target')).toHaveCount(0)
    await expect(targetContainer.getByText('기존학생')).toBeVisible()
    await expect(targetContainer.getByText('이동학생')).toBeVisible()
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
