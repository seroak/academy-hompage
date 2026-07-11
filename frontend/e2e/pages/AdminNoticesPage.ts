import type { Page } from '@playwright/test'

export class AdminNoticesPagePO {
  constructor(private readonly browserPage: Page) {}

  async navigate() {
    await this.browserPage.goto('/admin/notices')
  }

  get page() {
    return this.browserPage.getByTestId('notices-admin-page')
  }

  get formPanel() {
    return this.browserPage.getByTestId('notice-form-panel')
  }

  get titleInput() {
    return this.browserPage.getByLabel('제목')
  }

  get contentInput() {
    return this.browserPage.getByLabel('내용')
  }

  get pinnedCheckbox() {
    return this.browserPage.getByLabel('상단 고정')
  }

  get submitButton() {
    return this.browserPage.getByRole('button', { name: /^(등록|수정 저장)$/ })
  }

  noticeListItem(title: string) {
    return this.browserPage.locator('li').filter({ hasText: title })
  }

  editButtonFor(title: string) {
    return this.noticeListItem(title).getByRole('button', { name: '수정' })
  }

  deleteButtonFor(title: string) {
    return this.noticeListItem(title).getByRole('button', { name: '삭제' })
  }
}
