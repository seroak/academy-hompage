import { test, expect } from '@playwright/test'
import { AdminCoursesPagePO } from '../pages/AdminCoursesPage'
import { AdminNoticesPagePO } from '../pages/AdminNoticesPage'
import { routeByMethod, fulfillJson, fulfillNoContent, apiPattern } from '../helpers/intercept'
import { ADMIN_STORAGE_STATE } from '../helpers/authPaths'
import coursesFixture from '../fixtures/courses.json' with { type: 'json' }
import instructorsFixture from '../fixtures/instructors.json' with { type: 'json' }
import noticesFixture from '../fixtures/notices.json' with { type: 'json' }

test.use({ storageState: ADMIN_STORAGE_STATE })

test.describe('관리자 - 강좌 CRUD', () => {
  test.beforeEach(async ({ page }) => {
    let courses = JSON.parse(JSON.stringify(coursesFixture)) as typeof coursesFixture
    let nextId = 100

    await routeByMethod(page, apiPattern('/instructors$'), {
      GET: (route) => fulfillJson(route, 200, instructorsFixture),
    })
    await routeByMethod(page, apiPattern('/courses$'), {
      GET: (route) => fulfillJson(route, 200, courses),
      POST: async (route) => {
        const input = route.request().postDataJSON()
        const instructor = instructorsFixture.find((i) => i.id === input.instructorId)
        const created = {
          id: `course-e2e-${nextId++}`,
          ...input,
          instructor,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        courses = [...courses, created]
        await fulfillJson(route, 201, created)
      },
    })
    await routeByMethod(page, apiPattern('/courses/[^/]+$'), {
      PATCH: async (route) => {
        const url = route.request().url()
        const id = url.split('/').pop()!
        const input = route.request().postDataJSON()
        const instructor = input.instructorId
          ? instructorsFixture.find((i) => i.id === input.instructorId)
          : undefined
        courses = courses.map((course) =>
          course.id === id ? { ...course, ...input, instructor: instructor ?? course.instructor } : course,
        )
        await fulfillJson(route, 200, courses.find((c) => c.id === id))
      },
      DELETE: async (route) => {
        const url = route.request().url()
        const id = url.split('/').pop()!
        courses = courses.filter((course) => course.id !== id)
        await fulfillNoContent(route)
      },
    })
  })

  test('강좌를 등록하면 목록에 나타난다', async ({ page }) => {
    const admin = new AdminCoursesPagePO(page)
    await admin.navigate()

    const instructor = instructorsFixture[0]
    await admin.fillForm({
      title: 'E2E 신규 강좌',
      instructorLabel: `${instructor.name} (${instructor.subject})`,
      category: '수학',
      level: '중급',
      tuition: 200000,
      schedule: '금 18:00~19:00',
      description: 'E2E 테스트로 등록한 강좌입니다.',
    })
    await admin.submitButton.click()

    await expect(admin.courseListItem('E2E 신규 강좌')).toBeVisible()
  })

  test('강좌를 수정하면 변경 내용이 반영된다', async ({ page }) => {
    const admin = new AdminCoursesPagePO(page)
    await admin.navigate()

    const target = coursesFixture[0]
    await admin.editButtonFor(target.title).click()
    await admin.titleInput.fill('수정된 강좌 제목')
    await admin.submitButton.click()

    await expect(admin.courseListItem('수정된 강좌 제목')).toBeVisible()
    await expect(admin.courseListItem(target.title)).toHaveCount(0)
  })

  test('강좌를 삭제하면 목록에서 사라진다', async ({ page }) => {
    const admin = new AdminCoursesPagePO(page)
    await admin.navigate()

    const target = coursesFixture[1]
    page.once('dialog', (dialog) => dialog.accept())
    await admin.deleteButtonFor(target.title).click()

    await expect(admin.courseListItem(target.title)).toHaveCount(0)
  })
})

test.describe('관리자 - 공지 CRUD', () => {
  test.beforeEach(async ({ page }) => {
    let notices = JSON.parse(JSON.stringify(noticesFixture)) as typeof noticesFixture
    let nextId = 100

    await routeByMethod(page, apiPattern('/notices$'), {
      GET: (route) => fulfillJson(route, 200, notices),
      POST: async (route) => {
        const input = route.request().postDataJSON()
        const created = {
          id: `notice-e2e-${nextId++}`,
          pinned: false,
          ...input,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        notices = [...notices, created]
        await fulfillJson(route, 201, created)
      },
    })
    await routeByMethod(page, apiPattern('/notices/[^/]+$'), {
      PATCH: async (route) => {
        const url = route.request().url()
        const id = url.split('/').pop()!
        const input = route.request().postDataJSON()
        notices = notices.map((notice) => (notice.id === id ? { ...notice, ...input } : notice))
        await fulfillJson(route, 200, notices.find((n) => n.id === id))
      },
      DELETE: async (route) => {
        const url = route.request().url()
        const id = url.split('/').pop()!
        notices = notices.filter((notice) => notice.id !== id)
        await fulfillNoContent(route)
      },
    })
  })

  test('공지를 등록하면 목록에 나타난다', async ({ page }) => {
    const admin = new AdminNoticesPagePO(page)
    await admin.navigate()

    await admin.titleInput.fill('E2E 신규 공지')
    await admin.contentInput.fill('E2E 테스트로 등록한 공지입니다.')
    await admin.submitButton.click()

    await expect(admin.noticeListItem('E2E 신규 공지')).toBeVisible()
  })

  test('공지를 수정하면 변경 내용이 반영된다', async ({ page }) => {
    const admin = new AdminNoticesPagePO(page)
    await admin.navigate()

    const target = noticesFixture[0]
    await admin.editButtonFor(target.title).click()
    await admin.titleInput.fill('수정된 공지 제목')
    await admin.submitButton.click()

    await expect(admin.noticeListItem('수정된 공지 제목')).toBeVisible()
    await expect(admin.noticeListItem(target.title)).toHaveCount(0)
  })

  test('공지를 삭제하면 목록에서 사라진다', async ({ page }) => {
    const admin = new AdminNoticesPagePO(page)
    await admin.navigate()

    const target = noticesFixture[1]
    page.once('dialog', (dialog) => dialog.accept())
    await admin.deleteButtonFor(target.title).click()

    await expect(admin.noticeListItem(target.title)).toHaveCount(0)
  })
})
