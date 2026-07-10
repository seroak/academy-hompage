import type { Page } from '@playwright/test'

export class AdminReservationsPagePO {
  constructor(private readonly page: Page) {}

  async navigate() {
    await this.page.goto('/admin/reservations')
  }

  // GroupConfirmForm과 GroupManagementCard 둘 다 "그룹 이름"/"정원" 라벨을 쓰기 때문에
  // getByLabel만으로는 strict mode 위반이 난다. GroupManagementCard 쪽엔 data-testid를 붙여 구분한다.
  private get groupManagementCard() {
    return this.page.getByTestId('group-management-card')
  }

  get blankGroupNameInput() {
    return this.groupManagementCard.getByLabel('그룹 이름')
  }

  get blankGroupCapacityInput() {
    return this.groupManagementCard.getByLabel('정원')
  }

  get createBlankGroupButton() {
    return this.groupManagementCard.getByRole('button', { name: '빈 그룹 만들기' })
  }

  groupListItem(label: string) {
    return this.groupManagementCard.locator('li').filter({ hasText: label })
  }

  deleteGroupButtonFor(label: string) {
    return this.groupListItem(label).getByRole('button', { name: '삭제' })
  }

  async switchToWalkInTab() {
    await this.page.getByRole('button', { name: '학생 직접 등록' }).click()
  }

  get walkInParentNameInput() {
    return this.page.getByLabel('보호자 이름')
  }

  get walkInChildNameInput() {
    return this.page.getByLabel('자녀 이름')
  }

  get walkInChildAgeInput() {
    // "최소 나이(만)"/"최대 나이(만)"(GroupManagementCard, 같은 페이지에 항상 DOM 존재)와
    // 부분 문자열이 겹치므로 정확히 일치하는 라벨만 선택한다.
    return this.page.getByLabel('나이(만)', { exact: true })
  }

  get walkInSubmitButton() {
    return this.page.getByRole('button', { name: /^(학생 등록|등록 중\.\.\.)$/ })
  }

  slotCell(dayOfWeek: string, minute: number) {
    return this.page.locator(`[data-slot-day="${dayOfWeek}"][data-slot-minute="${minute}"]`)
  }

  async selectSlotByKeyboard(dayOfWeek: string, startMinute: number, endMinute: number) {
    await this.slotCell(dayOfWeek, startMinute).focus()
    await this.slotCell(dayOfWeek, startMinute).press('Enter')
    const lastMinute = endMinute - 10
    await this.slotCell(dayOfWeek, lastMinute).focus()
    await this.slotCell(dayOfWeek, lastMinute).press('Enter')
  }
}
