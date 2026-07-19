import { useState } from "react";
import { Trash2 } from "lucide-react";
import { ReservationGroup } from "../../../../api/schemas/reservation-group.schema";
import { DRAG_PAYLOAD_TYPE } from "../utils/reservationAdminUtils";
import { parseDragPayload } from "./reservationCell.utils";

type EmptyGroupsSectionProps = {
  groups: ReservationGroup[];
  onOpenGroupDetail: (groupId: string) => void;
  onMoveMember: (reservationId: string, fromGroupId: string, toGroupId: string) => void;
  onDeleteGroup: (groupId: string) => void;
};

export function EmptyGroupsSection({ groups, onOpenGroupDetail, onMoveMember, onDeleteGroup }: EmptyGroupsSectionProps) {
  const [dragOverGroupId, setDragOverGroupId] = useState<string | null>(null);

  return (
    <div className="flex w-full flex-1 flex-col gap-1 p-1">
      {groups.map((group) => (
        <div
          key={group.id}
          data-testid={`empty-group-${group.id}`}
          onDragOver={(event) => {
            event.preventDefault();
            event.dataTransfer.dropEffect = "move";
          }}
          onDragEnter={() => setDragOverGroupId(group.id)}
          onDragLeave={() => setDragOverGroupId((previous) => (previous === group.id ? null : previous))}
          onDrop={(event) => {
            event.preventDefault();
            setDragOverGroupId(null);
            const raw = event.dataTransfer.getData(DRAG_PAYLOAD_TYPE);
            if (!raw) return;
            const payload = parseDragPayload(raw);
            if (!payload) return;
            if (payload.fromGroupId === group.id) return;
            onMoveMember(payload.reservationId, payload.fromGroupId, group.id);
          }}
          className={`flex min-h-[48px] flex-1 items-start justify-between gap-2 rounded-lg border border-dashed border-[#9ac5df] bg-[#f0f8fc] px-3 py-2 transition ${
            dragOverGroupId === group.id ? "ring-2 ring-[#236c9c] ring-offset-1" : ""
          }`}
        >
          <div className="flex flex-col justify-center">
            <button
              type="button"
              onClick={() => onOpenGroupDetail(group.id)}
              className="w-fit text-left text-xs font-black text-[#236c9c] hover:underline"
            >
              {group.label}
            </button>
            <p className="mt-0.5 text-[10px] font-bold text-[#4f7890]">
              빈 수업 · {group.reservations?.length ?? 0}/{group.capacity}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onDeleteGroup(group.id)}
            aria-label={`${group.label} 빈 수업 삭제`}
            data-testid={`delete-empty-group-${group.id}`}
            className="grid size-6 shrink-0 place-items-center rounded-full text-[#7fa9c0] transition hover:bg-[#dcedf6] hover:text-[#236c9c]"
          >
            <Trash2 size={13} strokeWidth={2.5} />
          </button>
        </div>
      ))}
    </div>
  );
}
