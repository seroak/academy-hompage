import type { Page } from '@playwright/test'

export class LevelTestPagePO {
  constructor(private readonly page: Page) {}

  async navigate() {
    await this.page.goto('/level-test')
  }

  get childNameInput() {
    return this.page.getByLabel('아이 이름')
  }

  get startButton() {
    return this.page.getByRole('button', { name: '레벨테스트 시작' })
  }

  get submitButton() {
    return this.page.getByRole('button', { name: '레벨테스트 제출' })
  }

  choiceRadio(choiceLabel: string) {
    return this.page.getByLabel(choiceLabel, { exact: true })
  }

  get resultBanner() {
    return this.page.getByText(/레벨테스트 응시를 완료했습니다/)
  }
}
