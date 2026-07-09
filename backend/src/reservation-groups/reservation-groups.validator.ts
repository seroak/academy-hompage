import { ConflictException, Injectable } from '@nestjs/common';
import { GroupSlotDto } from './dto/create-reservation-group.dto';

interface PreferredSlot {
  dayOfWeek: string;
  startMinute: number;
  endMinute: number;
}

interface ExistingSlot {
  dayOfWeek: string;
  startMinute: number;
  endMinute: number;
}

@Injectable()
export class ReservationGroupsValidator {
  validateCapacity(capacity: number, reservationCount: number): void {
    if (capacity < reservationCount) {
      throw new ConflictException('정원은 선택된 인원 수 이상이어야 합니다');
    }
  }

  validateUpdateBounds(
    members: { childAge: number }[],
    capacity?: number,
    minAge?: number,
    maxAge?: number,
  ): void {
    if (capacity !== undefined && capacity < members.length) {
      throw new ConflictException('정원은 현재 인원 수 이상이어야 합니다');
    }
    if (
      minAge !== undefined &&
      members.some((member) => member.childAge < minAge)
    ) {
      throw new ConflictException(
        '최소 연령은 기존 멤버의 나이보다 클 수 없습니다',
      );
    }
    if (
      maxAge !== undefined &&
      members.some((member) => member.childAge > maxAge)
    ) {
      throw new ConflictException(
        '최대 연령은 기존 멤버의 나이보다 작을 수 없습니다',
      );
    }
  }

  validateAgeBounds(childAge: number, minAge: number, maxAge: number): void {
    if (childAge < minAge || childAge > maxAge) {
      throw new ConflictException('그룹의 나이대와 맞지 않습니다');
    }
  }

  validateReservationStatus(
    status: string,
    expectedStatus: string,
    errorMessage: string,
  ): void {
    if (status !== expectedStatus) {
      throw new ConflictException(errorMessage);
    }
  }

  validateGroupStatus(
    status: string,
    expectedStatus: string,
    errorMessage: string,
  ): void {
    if (status !== expectedStatus) {
      throw new ConflictException(errorMessage);
    }
  }

  validateSlotsWithinPreferred(
    slots: GroupSlotDto[],
    preferredSlots: PreferredSlot[],
  ): void {
    const isOutOfBound = slots.some(
      (slot) =>
        !preferredSlots.some(
          (preferred) =>
            preferred.dayOfWeek === slot.dayOfWeek &&
            preferred.startMinute <= slot.startMinute &&
            preferred.endMinute >= slot.endMinute,
        ),
    );

    if (isOutOfBound) {
      throw new ConflictException(
        '확정 시간은 해당 신청의 후보 시간 범위 안에 포함되어야 합니다',
      );
    }
  }

  validateSlotsOverlap(
    newSlots: GroupSlotDto[],
    existingSlots: ExistingSlot[],
  ): void {
    const isNotOverlapping = newSlots.some(
      (slot) =>
        !existingSlots.some(
          (existing) =>
            existing.dayOfWeek === slot.dayOfWeek &&
            slot.startMinute < existing.endMinute &&
            slot.endMinute > existing.startMinute,
        ),
    );

    if (isNotOverlapping) {
      throw new ConflictException(
        '추가할 시간이 그룹의 기존 시간대와 겹치지 않습니다',
      );
    }
  }

  assertNoGaps(slots: GroupSlotDto[]): void {
    const byReservationDay = new Map<string, GroupSlotDto[]>();
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
          throw new ConflictException(
            '선택한 슬롯 사이에 빈 시간이 있어 그룹으로 묶을 수 없습니다',
          );
        }
      }
    }
  }
}
