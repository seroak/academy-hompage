import type { Page } from '@playwright/test'

export class AdminCoursesPagePO {
  constructor(private readonly page: Page) {}

  async navigate() {
    await this.page.goto('/admin/courses')
  }

  get titleInput() {
    return this.page.getByLabel('제목')
  }

  get instructorSelect() {
    return this.page.getByLabel('담당 강사')
  }

  get categoryInput() {
    return this.page.getByLabel('분류')
  }

  get levelInput() {
    return this.page.getByLabel('난이도')
  }

  get tuitionInput() {
    return this.page.getByLabel('수강료(원)')
  }

  get scheduleInput() {
    return this.page.getByLabel('수업 일정')
  }

  get descriptionInput() {
    return this.page.getByLabel('설명')
  }

  get submitButton() {
    return this.page.getByRole('button', { name: /^(등록|수정 저장)$/ })
  }

  courseListItem(title: string) {
    return this.page.locator('li').filter({ hasText: title })
  }

  editButtonFor(title: string) {
    return this.courseListItem(title).getByRole('button', { name: '수정' })
  }

  deleteButtonFor(title: string) {
    return this.courseListItem(title).getByRole('button', { name: '삭제' })
  }

  async fillForm(input: {
    title: string
    instructorLabel: string
    category: string
    level: string
    tuition: number
    schedule: string
    description: string
  }) {
    await this.titleInput.fill(input.title)
    await this.instructorSelect.selectOption({ label: input.instructorLabel })
    await this.categoryInput.fill(input.category)
    await this.levelInput.fill(input.level)
    await this.tuitionInput.fill(String(input.tuition))
    await this.scheduleInput.fill(input.schedule)
    await this.descriptionInput.fill(input.description)
  }
}
