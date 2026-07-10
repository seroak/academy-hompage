import type { Page } from '@playwright/test'

// 공개(비로그인) 페이지 공통 Page Object. 모두 SSR + 목 API 서버 픽스처 기반이라
// 별도 인터셉터 없이 접속 자체가 데이터를 검증하는 스모크 테스트에 쓰인다.
export class PublicPages {
  constructor(private readonly page: Page) {}

  async gotoHome() {
    await this.page.goto('/')
  }

  async gotoNotices() {
    await this.page.goto('/notices')
    await this.page.waitForSelector('h1:has-text("공지사항")')
  }

  async gotoNoticeDetail(id: string) {
    return this.page.goto(`/notices/${id}`)
  }
}
