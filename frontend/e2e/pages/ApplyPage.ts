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

  // 모바일 좁은 화면에서만 노출되는 요일 탭 바(PreferredSlotsPicker.tsx).
  get dayTabs() {
    return this.page.getByTestId('preferred-slots-day-tabs')
  }

  dayTab(label: string) {
    return this.dayTabs.getByRole('button', { name: label })
  }

  // 셀 하나를 터치(pointerType: 'touch') 탭으로 누른다. setPointerCapture 없이
  // pointerdown+pointerup만 보내 usePreferredSlotsSelection의 handleCellTap 경로를 태운다
  // (PreferredSlotCell.tsx의 마우스/터치 분기 참고).
  async tapSlotCell(dayOfWeek: string, minute: number) {
    const cell = this.slotCell(dayOfWeek, minute)
    const box = await cell.boundingBox()
    if (!box) {
      throw new Error(`slot cell not found or not visible: ${dayOfWeek} ${minute}`)
    }
    const point = { x: box.x + box.width / 2, y: box.y + box.height / 2 }
    await cell.evaluate((node, coords) => {
      const options: PointerEventInit = {
        pointerId: Math.floor(Math.random() * 100000),
        pointerType: 'touch',
        bubbles: true,
        cancelable: true,
        clientX: coords.x,
        clientY: coords.y,
      }
      node.dispatchEvent(new PointerEvent('pointerdown', options))
      node.dispatchEvent(new PointerEvent('pointerup', options))
    }, point)
  }

  // 터치 "탭 2번"으로 시작~종료 시간을 선택한다. scrollBetween을 켜면 두 탭 사이에
  // 실제로 페이지를 스크롤해, 세로로 긴 모바일 그리드에서 스크롤이 선택을 방해하지
  // 않는지 함께 검증한다.
  async selectSlotByTap(
    dayOfWeek: string,
    startMinute: number,
    endMinute: number,
    options?: { scrollBetween?: boolean },
  ) {
    await this.tapSlotCell(dayOfWeek, startMinute)
    if (options?.scrollBetween) {
      await this.page.mouse.wheel(0, 300)
    }
    await this.tapSlotCell(dayOfWeek, endMinute - 10)
  }
}
