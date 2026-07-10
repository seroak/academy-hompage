import type { Page } from '@playwright/test'

export class AdminNoticesPagePO {
  constructor(private readonly page: Page) {}

  async navigate() {
    await this.page.goto('/admin/notices')
  }

  get titleInput() {
    return this.page.getByLabel('제목')
  }

  get contentInput() {
    return this.page.getByLabel('내용')
  }

  get pinnedCheckbox() {
    return this.page.getByLabel('상단 고정')
  }

  get submitButton() {
    return this.page.getByRole('button', { name: /^(등록|수정 저장)$/ })
  }

  noticeListItem(title: string) {
    return this.page.locator('li').filter({ hasText: title })
  }

  editButtonFor(title: string) {
    return this.noticeListItem(title).getByRole('button', { name: '수정' })
  }

  deleteButtonFor(title: string) {
    return this.noticeListItem(title).getByRole('button', { name: '삭제' })
  }
}
