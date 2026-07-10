import { useState } from "react";
import { ReservationGroup } from "../../../../api/schemas/reservation-group.schema";
import { DRAG_PAYLOAD_TYPE, DragPayload } from "../utils/reservationAdminUtils";

type Props = {
  groups: ReservationGroup[];
  onMoveMember: (reservationId: string, fromGroupId: string, toGroupId: string) => void;
  onDeleteGroup: (id: string) => void;
};

/**
 * 시간(slots)이 아직 없는 확정 그룹("빈 그룹 만들기"로 생성됨)을 위한 드롭 영역.
 * 상단 그리드 시간표는 group.slots 기준으로만 렌더되므로, 슬롯이 없는 그룹은 그리드에
 * 나타나지 않고 드롭 타겟도 없다 — 이 패널이 그 대신 카드 형태의 드롭 타겟을 제공한다.
 * 학생 블록을 드롭하면 그 학생의 희망 시간이 그룹의 첫 확정 시간으로 채택되어(useReservationAdminState의
 * handleMoveMember), 이후에는 이 그룹이 그리드에 정상 표시되고 이 패널에서는 사라진다.
 */
export default function UnscheduledGroupsPanel({ groups, onMoveMember, onDeleteGroup }: Props) {
  const [dragOverGroupId, setDragOverGroupId] = useState<string | null>(null);

  return (
    <div
      data-testid="unscheduled-groups-panel"
      className="grid gap-4 rounded-[28px] border border-[#f2dfb9] bg-white p-6 shadow-[0_18px_46px_rgba(95,67,18,0.08)] sm:p-8"
    >
      <div>
        <p className="text-sm font-black text-[#e86f00]">아직 요일·시간이 없는 그룹</p>
        <h2 className="mt-1 text-xl font-black text-[#222222]">시간 미정 그룹</h2>
        <p className="mt-2 text-xs font-bold text-[#6f6253]">
          아래 그리드에서 학생 블록을 이 영역의 그룹으로 드래그하면, 그 학생의 희망 시간이 그룹의 확정
          시간으로 채택됩니다.
        </p>
      </div>

      {groups.length === 0 ? (
        <p className="rounded-[20px] bg-[#fff9ec] px-4 py-3 text-sm font-black text-[#6f6253]">
          시간 미정 그룹이 없습니다. 아래 &quot;그룹 직접 관리&quot;에서 만들 수 있어요.
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <li
              key={group.id}
              onDragOver={(event) => {
                event.preventDefault();
                event.dataTransfer.dropEffect = "move";
              }}
              onDragEnter={() => setDragOverGroupId(group.id)}
              onDragLeave={() => setDragOverGroupId((prev) => (prev === group.id ? null : prev))}
              onDrop={(event) => {
                event.preventDefault();
                setDragOverGroupId(null);
                const raw = event.dataTransfer.getData(DRAG_PAYLOAD_TYPE);
                if (!raw) return;
                const payload = JSON.parse(raw) as DragPayload;
                if (payload.fromGroupId === group.id) return;
                onMoveMember(payload.reservationId, payload.fromGroupId, group.id);
              }}
              className={`flex flex-col gap-2 rounded-2xl border border-dashed border-[#f2dfb9] bg-[#fffcf5] px-4 py-3 transition ${
                dragOverGroupId === group.id ? "ring-2 ring-[#e86f00] ring-offset-1" : ""
              }`}
            >
              <div>
                <p className="text-sm font-black text-[#222222]">{group.label}</p>
                <p className="mt-0.5 text-xs font-bold text-[#6f6253]">
                  인원 {group.reservations?.length ?? 0}/{group.capacity} · 만 {group.minAge}~{group.maxAge}세
                </p>
              </div>
              <button
                type="button"
                onClick={() => onDeleteGroup(group.id)}
                className="w-fit rounded-full border border-[#ffd6cc] bg-[#fff5f1] px-3 py-1 text-xs font-black text-[#d6452f] transition hover:bg-[#ffe9e1]"
              >
                삭제
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
