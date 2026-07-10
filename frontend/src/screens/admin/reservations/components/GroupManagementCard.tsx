import { useState, type FormEvent } from "react";
import { ReservationGroup } from "../../../../api/schemas/reservation-group.schema";
import { fieldClass, labelClass, errorClass } from "../styles";

type Props = {
  groups: ReservationGroup[];
  fieldErrors: Record<string, string>;
  submitError: string | null;
  isCreating: boolean;
  onCreateBlankGroup: (input: {
    label: string;
    capacity: number;
    minAge?: number;
    maxAge?: number;
  }) => Promise<boolean>;
  onDeleteGroup: (id: string) => void;
};

function parseOptionalNumber(value: string): number | undefined {
  return value === "" ? undefined : Number(value);
}

export default function GroupManagementCard({
  groups,
  fieldErrors,
  submitError,
  isCreating,
  onCreateBlankGroup,
  onDeleteGroup,
}: Props) {
  const [label, setLabel] = useState("");
  const [capacity, setCapacity] = useState(4);
  const [minAge, setMinAge] = useState<number | undefined>(undefined);
  const [maxAge, setMaxAge] = useState<number | undefined>(undefined);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const success = await onCreateBlankGroup({ label, capacity, minAge, maxAge });
    if (success) {
      setLabel("");
      setCapacity(4);
      setMinAge(undefined);
      setMaxAge(undefined);
    }
  }

  return (
    <div
      data-testid="group-management-card"
      className="grid gap-6 rounded-[28px] border border-[#f2dfb9] bg-white p-6 shadow-[0_18px_46px_rgba(95,67,18,0.08)] sm:p-8"
    >
      <div>
        <p className="text-sm font-black text-[#e86f00]">시간표 선택 없이</p>
        <h2 className="mt-1 text-xl font-black text-[#222222]">그룹 직접 관리</h2>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-4">
        <label className={labelClass}>
          그룹 이름
          <input
            className={fieldClass}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="예: 새 그룹"
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
              value={capacity}
              onChange={(e) => setCapacity(Number(e.target.value))}
            />
            {fieldErrors.capacity && <span className={errorClass}>{fieldErrors.capacity}</span>}
          </label>

          <label className={labelClass}>
            최소 나이(만, 비우면 4)
            <input
              type="number"
              min={4}
              max={10}
              className={fieldClass}
              value={minAge ?? ""}
              onChange={(e) => setMinAge(parseOptionalNumber(e.target.value))}
            />
          </label>

          <label className={labelClass}>
            최대 나이(만, 비우면 10)
            <input
              type="number"
              min={4}
              max={10}
              className={fieldClass}
              value={maxAge ?? ""}
              onChange={(e) => setMaxAge(parseOptionalNumber(e.target.value))}
            />
          </label>
        </div>

        {submitError && <p className={errorClass}>{submitError}</p>}

        <div>
          <button
            type="submit"
            disabled={isCreating}
            className="inline-flex h-11 items-center justify-center rounded-full bg-[#ff8a1f] px-6 text-sm font-black text-white shadow-[0_14px_28px_rgba(255,138,31,0.24)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#e86f00] disabled:translate-y-0 disabled:opacity-50"
          >
            빈 그룹 만들기
          </button>
        </div>
      </form>

      <div className="flex flex-col gap-2">
        <p className="text-xs font-black text-[#6f6253]">전체 그룹 목록</p>

        {groups.length === 0 ? (
          <p className="rounded-[20px] bg-[#fff9ec] px-4 py-3 text-sm font-black text-[#6f6253]">
            아직 만들어진 그룹이 없습니다.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {groups.map((group) => (
              <li
                key={group.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[#f2dfb9] px-4 py-3"
              >
                <div>
                  <p className="text-sm font-black text-[#222222]">
                    {group.label}{" "}
                    <span className="font-semibold text-[#6f6253]">
                      ({group.status === "CONFIRMED" ? "확정" : "취소됨"})
                    </span>
                  </p>
                  <p className="mt-0.5 text-xs font-bold text-[#6f6253]">
                    인원 {group.reservations?.length ?? 0}/{group.capacity} · 만 {group.minAge}~{group.maxAge}세
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onDeleteGroup(group.id)}
                  className="rounded-full border border-[#ffd6cc] bg-[#fff5f1] px-3 py-1 text-xs font-black text-[#d6452f] transition hover:bg-[#ffe9e1]"
                >
                  삭제
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
