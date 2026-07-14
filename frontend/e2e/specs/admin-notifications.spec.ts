import { test, expect } from '@playwright/test'
import { routeByMethod, fulfillJson, fulfillNoContent, apiPattern } from '../helpers/intercept'
import { ADMIN_STORAGE_STATE } from '../helpers/authPaths'
import adminNotificationsFixture from '../fixtures/admin-notifications.json' with { type: 'json' }

test.use({ storageState: ADMIN_STORAGE_STATE })

test.describe('관리자 - 수업 신청 알림', () => {
  test.beforeEach(async ({ page }) => {
    let notifications = JSON.parse(JSON.stringify(adminNotificationsFixture)) as typeof adminNotificationsFixture

    function unreadCount() {
      return notifications.filter((notification) => !notification.readAt).length
    }

    await routeByMethod(page, apiPattern('/admin-notifications$'), {
      GET: (route) => fulfillJson(route, 200, notifications),
    })
    await routeByMethod(page, apiPattern('/admin-notifications/unread-count$'), {
      GET: (route) => fulfillJson(route, 200, { count: unreadCount() }),
    })
    await routeByMethod(page, apiPattern('/admin-notifications/[^/]+/read$'), {
      PATCH: async (route) => {
        const url = route.request().url()
        const id = url.split('/').slice(-2, -1)[0]
        notifications = notifications.map((notification) =>
          notification.id === id ? { ...notification, readAt: new Date().toISOString() } : notification,
        )
        const updated = notifications.find((notification) => notification.id === id)
        await fulfillJson(route, 200, updated)
      },
    })
    await routeByMethod(page, apiPattern('/admin-notifications/read-all$'), {
      POST: async (route) => {
        notifications = notifications.map((notification) => ({
          ...notification,
          readAt: notification.readAt ?? new Date().toISOString(),
        }))
        await fulfillNoContent(route)
      },
    })
  })

  test('안 읽은 알림 수가 벨 뱃지에 표시된다', async ({ page }) => {
    await page.goto('/admin/notices')

    await expect(page.getByTestId('notification-bell-badge')).toHaveText('1')
  })

  test('벨을 클릭하면 알림 목록이 표시된다', async ({ page }) => {
    await page.goto('/admin/notices')

    await page.getByTestId('notification-bell-button').click()

    await expect(page.getByTestId('notification-panel')).toBeVisible()
    await expect(page.getByTestId('notification-item-notification-1')).toContainText('박아이')
    await expect(page.getByTestId('notification-item-notification-2')).toContainText('김아이')
  })

  test('안 읽은 알림을 클릭하면 읽음 처리되고 뱃지 수가 줄어든다', async ({ page }) => {
    await page.goto('/admin/notices')

    await page.getByTestId('notification-bell-button').click()
    await page.getByTestId('notification-item-notification-1').click()

    await expect(page.getByTestId('notification-bell-badge')).toHaveCount(0)
  })

  test('모두 읽음 버튼을 누르면 모든 알림이 읽음 처리되고 뱃지가 사라진다', async ({ page }) => {
    await page.goto('/admin/notices')

    await page.getByTestId('notification-bell-button').click()
    await page.getByTestId('notification-mark-all-read').click()

    await expect(page.getByTestId('notification-bell-badge')).toHaveCount(0)
  })
})
