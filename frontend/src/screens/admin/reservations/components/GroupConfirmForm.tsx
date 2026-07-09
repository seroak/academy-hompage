import type { SubmitEvent } from "react";
import { DAY_OF_WEEK_LABELS, timeLabel } from "../../../../api/schemas/reservation.schema";
import { ReservationGroupFormState, SelectedSlot } from "../types";
import { fieldClass, labelClass, errorClass } from "../styles";

type Props = {
  selectedSlots: Map<string, SelectedSlot>;
  groupForm: ReservationGroupFormState;
  groupCapacity: number;
  groupMinAge: number | undefined;
  groupMaxAge: number | undefined;
  fieldErrors: Record<string, string>;
  submitError: string | null;
  createError: unknown;
  isCreating: boolean;
  onChangeGroupForm: (form: ReservationGroupFormState) => void;
  onRemoveSlot: (key: string) => void;
  onSubmit: (event: SubmitEvent<HTMLFormElement>) => void;
};

function parseOptionalNumber(value: string): number | undefined {
  return value === "" ? undefined : Number(value);
}

export default function GroupConfirmForm({
  selectedSlots,
  groupForm,
  groupCapacity,
  groupMinAge,
  groupMaxAge,
  fieldErrors,
  submitError,
  createError,
  isCreating,
  onChangeGroupForm,
  onRemoveSlot,
  onSubmit,
}: Props) {
  const slotEntries = Array.from(selectedSlots.entries());
  const totalMemberCount = slotEntries.length;

  const updateGroupForm = (patch: Partial<ReservationGroupFormState>) => {
    onChangeGroupForm({ ...groupForm, ...patch });
  };

  return (
    <form
      onSubmit={onSubmit}
      className="grid gap-5 rounded-[28px] border border-[#f2dfb9] bg-white p-6 shadow-[0_18px_46px_rgba(95,67,18,0.08)] sm:p-8"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-black text-[#e86f00]">선택 슬롯 묶기</p>
          <h2 className="mt-1 text-xl font-black text-[#222222]">그룹 확정</h2>
        </div>

        <span className="w-fit rounded-full bg-[#fff3c8] px-3 py-1 text-xs font-black text-[#9f4d00]">
          선택 {totalMemberCount}개
        </span>
      </div>

      <label className={labelClass}>
        그룹 이름
        <input
          className={fieldClass}
          value={groupForm.label}
          onChange={(e) => updateGroupForm({ label: e.target.value })}
          placeholder="예: 월요일 12시반"
        />
        {fieldErrors.label && <span className={errorClass}>{fieldErrors.label}</span>}
      </label>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className={labelClass}>
          정원
          <input
            type="number"
            min={1}
            className={fieldClass}
            value={groupCapacity}
            onChange={(e) =>
              updateGroupForm({
                capacityOverride: parseOptionalNumber(e.target.value),
              })
            }
          />
          {fieldErrors.capacity && <span className={errorClass}>{fieldErrors.capacity}</span>}
        </label>

        <label className={labelClass}>
          최소 나이(만)
          <input
            type="number"
            min={4}
            max={10}
            className={fieldClass}
            value={groupMinAge ?? ""}
            onChange={(e) =>
              updateGroupForm({
                minAgeOverride: parseOptionalNumber(e.target.value),
              })
            }
          />
        </label>

        <label className={labelClass}>
          최대 나이(만)
          <input
            type="number"
            min={4}
            max={10}
            className={fieldClass}
            value={groupMaxAge ?? ""}
            onChange={(e) =>
              updateGroupForm({
                maxAgeOverride: parseOptionalNumber(e.target.value),
              })
            }
          />
        </label>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-xs font-black text-[#6f6253]">선택된 슬롯</p>

        {slotEntries.length === 0 ? (
          <p className="rounded-[20px] bg-[#fff9ec] px-4 py-3 text-sm font-black text-[#6f6253]">
            시간표에서 학생의 시간 칸을 클릭해 슬롯을 선택하세요.
          </p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {slotEntries.map(([key, slot]) => (
              <li
                key={key}
                className="flex items-center gap-2 rounded-full border border-[#ff8a1f] bg-[#fff5ea] px-3 py-1.5 text-xs font-black text-[#e86f00]"
              >
                {slot.childName} · {DAY_OF_WEEK_LABELS[slot.dayOfWeek]} {timeLabel(slot.startMinute)}~
                {timeLabel(slot.endMinute)}
                <button
                  type="button"
                  onClick={() => onRemoveSlot(key)}
                  aria-label={`${slot.childName} 슬롯 선택 해제`}
                  className="text-[#e86f00] hover:text-[#d6452f]"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>



      {fieldErrors.slots && <p className={errorClass}>{fieldErrors.slots}</p>}

      {(!!submitError || !!createError) && <p className={errorClass}>{submitError ?? "그룹 확정에 실패했습니다."}</p>}

      <div>
        <button
          type="submit"
          disabled={isCreating || totalMemberCount === 0}
          className="inline-flex h-11 items-center justify-center rounded-full bg-[#ff8a1f] px-6 text-sm font-black text-white shadow-[0_14px_28px_rgba(255,138,31,0.24)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#e86f00] disabled:translate-y-0 disabled:opacity-50"
        >
          그룹 확정하기
        </button>
      </div>
    </form>
  );
}
