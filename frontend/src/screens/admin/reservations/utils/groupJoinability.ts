import { parseDayOfWeek, Reservation } from "../../../../api/schemas/reservation.schema";
import { ReservationGroup } from "../../../../api/schemas/reservation-group.schema";
import { DayOfWeek } from "../types";

function resolveGroupSchedule(
  group: ReservationGroup,
): { dayOfWeek: DayOfWeek; startMinute: number; endMinute: number } | null {
  if (
    group.scheduleDayOfWeek &&
    group.scheduleStartMinute !== null &&
    group.scheduleStartMinute !== undefined &&
    group.scheduleEndMinute !== null &&
    group.scheduleEndMinute !== undefined
  ) {
    return {
      dayOfWeek: group.scheduleDayOfWeek,
      startMinute: group.scheduleStartMinute,
      endMinute: group.scheduleEndMinute,
    };
  }
  return null;
}

/**
 * 대기 신청의 희망 시간(preferredSlots)과 그룹의 기존 확정 시간(slots)이 특정 요일에 겹치는 구간을
 * 계산해, 그대로 그룹 편입 API에 보낼 수 있는 연속된 슬롯 목록으로 합쳐 반환한다.
 *
 * 그룹에 고정 일정(schedule)이 있으면 "일정이 지정된 수업"으로 취급된다 — 백엔드가
 * 이런 그룹에는 일정 전체와 정확히 같은 시간만 배정하도록 강제하므로(
 * validateScheduledMemberSlots), 부분 겹침이 아니라 희망 시간이 일정 블록을
 * 완전히 포함할 때만 그 블록 전체를 반환한다.
 */
export function joinableSlotsForDay(
  reservation: Reservation,
  group: ReservationGroup,
  day: DayOfWeek,
): { dayOfWeek: DayOfWeek; startMinute: number; endMinute: number }[] {
  const preferredRanges = reservation.preferredSlots.filter((slot) => slot.dayOfWeek === day);

  const schedule = resolveGroupSchedule(group);
  if (schedule) {
    if (schedule.dayOfWeek !== day) return [];
    const fullyContained = preferredRanges.some(
      (preferred) => preferred.startMinute <= schedule.startMinute && preferred.endMinute >= schedule.endMinute,
    );
    return fullyContained ? [schedule] : [];
  }

  const seen = new Set<string>();
  const groupRanges = group.slots.filter((slot) => {
    if (slot.dayOfWeek !== day) return false;
    const key = `${slot.startMinute}-${slot.endMinute}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const overlaps: { dayOfWeek: DayOfWeek; startMinute: number; endMinute: number }[] = [];
  for (const groupRange of groupRanges) {
    for (const preferred of preferredRanges) {
      const startMinute = Math.max(groupRange.startMinute, preferred.startMinute);
      const endMinute = Math.min(groupRange.endMinute, preferred.endMinute);
      if (startMinute < endMinute) {
        overlaps.push({ dayOfWeek: day, startMinute, endMinute });
      }
    }
  }

  overlaps.sort((a, b) => a.startMinute - b.startMinute);
  const merged: typeof overlaps = [];
  for (const range of overlaps) {
    const last = merged[merged.length - 1];
    if (last && range.startMinute <= last.endMinute) {
      last.endMinute = Math.max(last.endMinute, range.endMinute);
    } else {
      merged.push({ ...range });
    }
  }
  return merged;
}

/**
 * 신청의 희망 요일 전체에 대해 그룹과 겹치는 슬롯을 모아 반환한다.
 * "합류 희망" 신청을 승인할 때(어느 요일 칸에서 클릭했는지 알 수 없는 경우) 사용한다.
 */
export function joinableSlotsForAllDays(
  reservation: Reservation,
  group: ReservationGroup,
): { dayOfWeek: DayOfWeek; startMinute: number; endMinute: number }[] {
  const days = [...new Set(reservation.preferredSlots.map((slot) => slot.dayOfWeek))];
  return days.flatMap((day) => joinableSlotsForDay(reservation, group, day));
}

/**
 * 그룹에 이미 확정된 시간 전체를 요일·시간 기준으로 중복 제거해 반환한다.
 * 반 이동(드래그앤드롭) 시, 학생의 희망 시간과 겹치는지 여부와 무관하게 대상 반의 시간을
 * 그대로 새 스케줄로 채택할 때 사용한다.
 */
export function groupSlotsDeduped(
  group: ReservationGroup,
): { dayOfWeek: DayOfWeek; startMinute: number; endMinute: number }[] {
  const seen = new Set<string>();
  const result: { dayOfWeek: DayOfWeek; startMinute: number; endMinute: number }[] = [];
  const schedule = resolveGroupSchedule(group);
  const sourceSlots = group.slots.length > 0 ? group.slots : schedule ? [schedule] : [];
  for (const slot of sourceSlots) {
    const key = `${slot.dayOfWeek}-${slot.startMinute}-${slot.endMinute}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const dayOfWeek = parseDayOfWeek(slot.dayOfWeek);
    if (dayOfWeek) result.push({ dayOfWeek, startMinute: slot.startMinute, endMinute: slot.endMinute });
  }
  return result;
}

/**
 * 학생이 그룹에 합류 가능한지: 확정 그룹 + 여석 + 나이대 + 희망 시간 겹침을 모두 만족하는지 확인한다.
 */
export function isGroupJoinableForReservation(
  group: ReservationGroup,
  reservation: Reservation,
  day: DayOfWeek,
): boolean {
  if (group.status !== "CONFIRMED" && group.status !== "EMPTY") return false;
  const memberCount = group.reservations?.length ?? 0;
  if (memberCount >= group.capacity) return false;
  if (reservation.childAge < group.minAge || reservation.childAge > group.maxAge) return false;
  return joinableSlotsForDay(reservation, group, day).length > 0;
}
