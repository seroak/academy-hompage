import type { Page } from '@playwright/test'

export class ApplyPagePO {
  constructor(private readonly page: Page) {}

  async navigate() {
    await this.page.goto('/apply')
  }

  get childSelect() {
    return this.page.getByLabel('신청할 자녀')
  }

  get childNameInput() {
    return this.page.getByLabel('아이 이름')
  }

  get parentNameInput() {
    return this.page.getByLabel('보호자 이름')
  }

  get parentEmailInput() {
    return this.page.getByLabel('이메일')
  }

  get parentPhoneInput() {
    return this.page.getByLabel('전화번호')
  }

  get submitButton() {
    return this.page.getByRole('button', { name: '신청하기' })
  }

  get successHeading() {
    return this.page.getByRole('heading', { name: '접수 완료' })
  }

  joinGroupButton(label: string) {
    return this.page.getByRole('button', { name: new RegExp(`${label}.*합류`) })
  }

  // PreferredSlotsPicker의 각 셀은 [data-slot-day][data-slot-minute]로 식별된다(components/preferred-slots/PreferredSlotCell.tsx).
  slotCell(dayOfWeek: string, minute: number) {
    return this.page.locator(`[data-slot-day="${dayOfWeek}"][data-slot-minute="${minute}"]`)
  }

  // 드래그 대신 키보드(Enter)로 시작/종료 셀을 순서대로 선택한다 — pointer capture 기반
  // 드래그보다 결정론적이고, 컴포넌트가 이미 onKeyDown Enter 핸들러를 지원한다.
  async selectSlotByKeyboard(dayOfWeek: string, startMinute: number, endMinute: number) {
    await this.slotCell(dayOfWeek, startMinute).focus()
    await this.slotCell(dayOfWeek, startMinute).press('Enter')
    const lastMinute = endMinute - 10
    await this.slotCell(dayOfWeek, lastMinute).focus()
    await this.slotCell(dayOfWeek, lastMinute).press('Enter')
  }
}
