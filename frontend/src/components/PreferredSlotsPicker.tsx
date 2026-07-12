"use client";

import { Fragment, useMemo, useRef } from "react";
import {
  DAY_OF_WEEK_LABELS,
  DAY_OF_WEEK_OPTIONS,
  OPERATING_END_MINUTE,
  OPERATING_START_MINUTE,
  SLOT_STEP_MINUTES,
  timeLabel,
  type PreferredSlot,
} from "../api/schemas/reservation.schema";
import type { ConfirmedSlot, JoinableGroup } from "../api/schemas/reservation-group.schema";
import { usePreferredSlotsSelection } from "./preferred-slots/usePreferredSlotsSelection";
import { PreferredSlotCell } from "./preferred-slots/PreferredSlotCell";
import { SelectedSlotsList } from "./preferred-slots/SelectedSlotsList";

interface PreferredSlotsPickerProps {
  value: PreferredSlot[];
  onChange: (slots: PreferredSlot[]) => void;
  joinableGroups?: JoinableGroup[];
  confirmedSlots?: ConfirmedSlot[];
  appliedSlots?: PreferredSlot[];
  childAge?: number;
}

const minuteOptions = Array.from(
  { length: (OPERATING_END_MINUTE - OPERATING_START_MINUTE) / SLOT_STEP_MINUTES },
  (_, index) => OPERATING_START_MINUTE + index * SLOT_STEP_MINUTES,
);

export default function PreferredSlotsPicker({
  value,
  onChange,
  joinableGroups = [],
  confirmedSlots = [],
  appliedSlots = [],
  childAge,
}: PreferredSlotsPickerProps) {
  const gridRef = useRef<HTMLDivElement>(null);

  function joinableGroupsAt(dayOfWeek: (typeof DAY_OF_WEEK_OPTIONS)[number], minute: number): JoinableGroup[] {
    return joinableGroups.filter((group) => {
      if (childAge !== undefined && (childAge < group.minAge || childAge > group.maxAge)) {
        return false;
      }
      return group.slots.some(
        (slot) => slot.dayOfWeek === dayOfWeek && slot.startMinute <= minute && slot.endMinute > minute,
      );
    });
  }

  function isConfirmedAt(dayOfWeek: (typeof DAY_OF_WEEK_OPTIONS)[number], minute: number): boolean {
    return confirmedSlots.some(
      (slot) => slot.dayOfWeek === dayOfWeek && slot.startMinute <= minute && slot.endMinute > minute,
    );
  }

  function isAppliedAt(dayOfWeek: (typeof DAY_OF_WEEK_OPTIONS)[number], minute: number): boolean {
    return appliedSlots.some(
      (slot) => slot.dayOfWeek === dayOfWeek && slot.startMinute <= minute && slot.endMinute > minute,
    );
  }

  // 확정된 시간이지만 정원이 남아 있는(joinable) 시간은 차단하지 않는다 — 정원이 꽉 찬 확정 시간만 막는다.
  const blockedSlots = useMemo(() => {
    const blocked: PreferredSlot[] = [];

    for (const day of DAY_OF_WEEK_OPTIONS) {
      let rangeStart: number | null = null;

      for (const minute of minuteOptions) {
        const isBlockedCell = isConfirmedAt(day, minute) && joinableGroupsAt(day, minute).length === 0;

        if (isBlockedCell) {
          if (rangeStart === null) rangeStart = minute;
        } else if (rangeStart !== null) {
          blocked.push({ dayOfWeek: day, startMinute: rangeStart, endMinute: minute });
          rangeStart = null;
        }
      }

      if (rangeStart !== null) {
        blocked.push({ dayOfWeek: day, startMinute: rangeStart, endMinute: OPERATING_END_MINUTE });
      }
    }

    return blocked;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [confirmedSlots, joinableGroups, childAge]);

  // 정원이 찬 확정 시간뿐 아니라 이미 신청한 시간도 드래그 선택의 경계(장애물)로 취급한다.
  const disabledSlots = useMemo(
    () => [...blockedSlots, ...appliedSlots],
    [blockedSlots, appliedSlots],
  );

  const {
    anchor,
    isDragging,
    dragModeRef,
    didDragRef,
    preview,
    cancelRange,
    previewLabel,
    slotAt,
    removeSlot,
    beginDrag,
    cancelSlotsInRange,
    updateFromPoint,
    handleCellPointerDown,
    commitSlot,
    clearSelectionDraft,
    setHovered,
    setIsDragging,
    buildSlotFromAnchor,
    isBlockedAt,
  } = usePreferredSlotsSelection(value, onChange, disabledSlots);

  function remainingSeatsFor(joinable: JoinableGroup[]) {
    if (joinable.length === 0) return undefined;
    return Math.max(...joinable.map((group) => group.capacity - group.filledCount));
  }

  function renderCell(day: (typeof DAY_OF_WEEK_OPTIONS)[number], minute: number) {
    const selectedSlot = slotAt(day, minute);
    const inPreview = Boolean(
      preview?.dayOfWeek === day && preview.startMinute <= minute && preview.endMinute > minute,
    );
    const inCancelPreview = Boolean(
      cancelRange?.dayOfWeek === day &&
      cancelRange.startMinute <= minute &&
      cancelRange.endMinute > minute &&
      selectedSlot,
    );
    const joinable = joinableGroupsAt(day, minute);
    const applied = isAppliedAt(day, minute);
    const blocked = isBlockedAt(day, minute) && !applied;

    return (
      <PreferredSlotCell
        key={`${day}-${minute}`}
        day={day}
        minute={minute}
        selectedSlot={selectedSlot}
        inPreview={inPreview}
        inCancelPreview={inCancelPreview}
        joinableGroups={joinable}
        blocked={blocked}
        alreadyApplied={applied}
        remainingSeats={remainingSeatsFor(joinable)}
        isDragging={isDragging}
        hasAnchor={Boolean(anchor)}
        onPointerDown={handleCellPointerDown}
        onPointerEnter={(nextAnchor) => setHovered(nextAnchor)}
        onEnter={(_anchor, _selectedSlot) => {
          if (_selectedSlot) {
            removeSlot(_selectedSlot);
          } else if (anchor) {
            commitSlot(buildSlotFromAnchor({ dayOfWeek: day, minute }));
          } else {
            beginDrag({ dayOfWeek: day, minute }, "select");
            setIsDragging(false);
          }
        }}
      />
    );
  }

  return (
    <div className="min-w-0 rounded-xl border border-slate-200 bg-brand-50/40 p-3">
      {joinableGroups.length > 0 && (
        <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
          <span aria-hidden className="size-1.5 rounded-full bg-emerald-500" />
          초록색 칸은 지금 모집 중인 반이 있는 시간입니다. 선택하면 바로 합류를 신청할 수 있어요.
        </p>
      )}
      {blockedSlots.length > 0 && (
        <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-slate-500">
          <span aria-hidden className="size-1.5 rounded-full bg-slate-300" />
          회색 칸은 이미 정원이 찬 확정 시간이라 신청할 수 없어요.
        </p>
      )}
      {appliedSlots.length > 0 && (
        <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-amber-600">
          <span aria-hidden className="size-1.5 rounded-full bg-amber-300" />
          주황색 칸은 이 아이가 이미 신청한 시간이라 다시 선택할 수 없어요.
        </p>
      )}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-semibold text-slate-600">{previewLabel}</span>
        <div className="flex items-center gap-2">
          {anchor && (
            <button
              type="button"
              onClick={clearSelectionDraft}
              className="rounded-full border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-500 hover:border-red-200 hover:text-red-600"
            >
              선택 취소
            </button>
          )}
        </div>
      </div>

      <div data-testid="preferred-slots-scroll" className="min-w-0 max-w-full overflow-x-auto">
        <div
          ref={gridRef}
          className="grid min-w-[720px] grid-cols-[64px_repeat(5,minmax(92px,1fr))] gap-1"
          onPointerMove={(event) => {
            if (isDragging) {
              updateFromPoint(event.clientX, event.clientY);
            }
          }}
          onPointerUp={() => {
            if (isDragging) {
              if (dragModeRef.current === "cancel") {
                cancelSlotsInRange();
              } else {
                if (didDragRef.current) {
                  commitSlot(preview);
                } else {
                  setIsDragging(false);
                }
              }
            }
          }}
          onPointerCancel={() => {
            setIsDragging(false);
            setHovered(null);
          }}
        >
          <div />
          {DAY_OF_WEEK_OPTIONS.map((day) => (
            <div key={day} className="px-2 py-1 text-center text-xs font-semibold text-slate-600">
              {DAY_OF_WEEK_LABELS[day]}
            </div>
          ))}
          {minuteOptions.map((minute) => (
            <Fragment key={minute}>
              <div key={`${minute}-label`} className="relative h-8 text-[11px] font-medium text-slate-500">
                {minute % 30 === 0 ? (
                  <span className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-50 px-1">
                    {timeLabel(minute)}
                  </span>
                ) : null}
              </div>
              {DAY_OF_WEEK_OPTIONS.map((day) => renderCell(day, minute))}
            </Fragment>
          ))}
        </div>
      </div>

      <SelectedSlotsList slots={value} onRemove={removeSlot} />
    </div>
  );
}
