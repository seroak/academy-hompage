"use client";

import { Fragment, useRef } from "react";
import {
  DAY_OF_WEEK_LABELS,
  DAY_OF_WEEK_OPTIONS,
  OPERATING_END_MINUTE,
  OPERATING_START_MINUTE,
  SLOT_STEP_MINUTES,
  timeLabel,
  type PreferredSlot,
} from "../api/schemas/reservation.schema";
import type { JoinableGroup } from "../api/schemas/reservation-group.schema";
import { usePreferredSlotsSelection, buildSlot } from "./preferred-slots/usePreferredSlotsSelection";
import { PreferredSlotCell } from "./preferred-slots/PreferredSlotCell";
import { SelectedSlotsList } from "./preferred-slots/SelectedSlotsList";

interface PreferredSlotsPickerProps {
  value: PreferredSlot[];
  onChange: (slots: PreferredSlot[]) => void;
  joinableGroups?: JoinableGroup[];
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
  childAge,
}: PreferredSlotsPickerProps) {
  const gridRef = useRef<HTMLDivElement>(null);

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
  } = usePreferredSlotsSelection(value, onChange);

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

    return (
      <PreferredSlotCell
        key={`${day}-${minute}`}
        day={day}
        minute={minute}
        selectedSlot={selectedSlot}
        inPreview={inPreview}
        inCancelPreview={inCancelPreview}
        joinableGroups={joinable}
        isDragging={isDragging}
        hasAnchor={Boolean(anchor)}
        onPointerDown={handleCellPointerDown}
        onPointerEnter={(nextAnchor) => setHovered(nextAnchor)}
        onEnter={(_anchor, _selectedSlot) => {
          if (_selectedSlot) {
            removeSlot(_selectedSlot);
          } else if (anchor) {
            commitSlot(buildSlot(anchor, { dayOfWeek: day, minute }, value));
          } else {
            beginDrag({ dayOfWeek: day, minute }, "select");
            setIsDragging(false);
          }
        }}
      />
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-brand-50/40 p-3">
      {joinableGroups.length > 0 && (
        <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
          <span aria-hidden className="size-1.5 rounded-full bg-emerald-500" />
          초록색 칸은 지금 모집 중인 반이 있는 시간입니다. 선택하면 바로 합류를 신청할 수 있어요.
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

      <div className="overflow-x-auto">
        <div
          ref={gridRef}
          className="grid min-w-[720px] grid-cols-[64px_repeat(6,minmax(92px,1fr))] gap-1"
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
