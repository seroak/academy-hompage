import { parseDayOfWeek } from "../../../../api/schemas/reservation.schema";
import { DayOfWeek, SelectedSlot } from "../types";

/**
 * 같은 신청·같은 요일로 개별 선택된 슬롯들 중 인접하거나 겹치는 것을 하나의 연속 구간으로 합친다.
 * 관리자가 시간표에서 10분 단위 칸을 여러 개 클릭해 그룹을 확정할 때, 클릭한 칸 수만큼
 * 조각난 슬롯이 그대로 저장되면(예: 730-740, 740-750, ...) 시간표에서 하나의 박스로 묶여 보이지 않는다.
 */
export function mergeContiguousSlots<
  T extends { reservationId: string; dayOfWeek: string; startMinute: number; endMinute: number },
>(slots: T[]): T[] {
  const byKey = new Map<string, T[]>();
  for (const slot of slots) {
    const key = `${slot.reservationId}-${slot.dayOfWeek}`;
    const list = byKey.get(key) ?? [];
    list.push(slot);
    byKey.set(key, list);
  }

  const merged: T[] = [];
  for (const list of byKey.values()) {
    const sorted = [...list].sort((a, b) => a.startMinute - b.startMinute);
    for (const slot of sorted) {
      const last = merged[merged.length - 1];
      if (last && last.reservationId === slot.reservationId && last.dayOfWeek === slot.dayOfWeek && slot.startMinute <= last.endMinute) {
        last.endMinute = Math.max(last.endMinute, slot.endMinute);
      } else {
        merged.push({ ...slot });
      }
    }
  }

  return merged;
}

/**
 * 같은 신청(학생)·같은 요일로 묶이는 슬롯들이 끊김 없이 이어지는지 확인한다.
 * 빈 시간이 있으면 그 갭 뒤에 오는 슬롯을 반환하고, 없으면 null을 반환한다.
 */
export function findSlotGap(slots: SelectedSlot[]): SelectedSlot | null {
  const byReservationDay = new Map<string, SelectedSlot[]>();
  for (const slot of slots) {
    const key = `${slot.reservationId}-${slot.dayOfWeek}`;
    const list = byReservationDay.get(key) ?? [];
    list.push(slot);
    byReservationDay.set(key, list);
  }

  for (const list of byReservationDay.values()) {
    const sorted = [...list].sort((a, b) => a.startMinute - b.startMinute);
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].startMinute !== sorted[i - 1].endMinute) {
        return sorted[i];
      }
    }
  }

  return null;
}

/**
 * 슬롯 배열이 정확히 하나의 (요일, 시작, 종료) 블록만으로 이뤄져 있으면 그 블록을,
 * 아니면 null을 반환한다. 반 확정 시 단일 시간블록인지 판별해 그룹의 고정 일정
 * (scheduleDayOfWeek 등)으로 함께 저장할지 결정하는 데 쓰인다.
 */
export function singleScheduleBlock<
  T extends { dayOfWeek: string; startMinute: number; endMinute: number },
>(slots: T[]): { dayOfWeek: DayOfWeek; startMinute: number; endMinute: number } | null {
  if (slots.length === 0) return null;
  const seen = new Set<string>();
  for (const slot of slots) {
    seen.add(`${slot.dayOfWeek}-${slot.startMinute}-${slot.endMinute}`);
  }
  if (seen.size !== 1) return null;
  const { dayOfWeek, startMinute, endMinute } = slots[0];
  const parsedDayOfWeek = parseDayOfWeek(dayOfWeek);
  return parsedDayOfWeek ? { dayOfWeek: parsedDayOfWeek, startMinute, endMinute } : null;
}
