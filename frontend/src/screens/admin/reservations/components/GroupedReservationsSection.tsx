import { useState } from "react";
import { Reservation } from "../../../../api/schemas/reservation.schema";
import { ReservationGroup } from "../../../../api/schemas/reservation-group.schema";
import { childColor, DRAG_PAYLOAD_TYPE, DragPayload } from "../utils/reservationAdminUtils";
import { parseDragPayload } from "./reservationCell.utils";

type GroupedReservationsSectionProps = {
  groupedByGroupId: Map<string, { group: ReservationGroup | null; reservations: Reservation[] }>;
  onOpenDetail: (reservation: Reservation) => void;
  onOpenGroupDetail: (groupId: string) => void;
  onMoveMember: (reservationId: string, fromGroupId: string, toGroupId: string) => void;
};

export function GroupedReservationsSection({
  groupedByGroupId,
  onOpenDetail,
  onOpenGroupDetail,
  onMoveMember,
}: GroupedReservationsSectionProps) {
  const [dragOverGroupId, setDragOverGroupId] = useState<string | null>(null);

  return (
    <div className="flex w-full flex-1 flex-col p-1">
      {Array.from(groupedByGroupId.entries()).map(([key, { group, reservations }], index) => (
        <div
          key={key}
          data-testid={group ? `grouped-reservations-${group.id}` : undefined}
          onDragOver={
            group
              ? (event) => {
                  event.preventDefault();
                  event.dataTransfer.dropEffect = "move";
                }
              : undefined
          }
          onDragEnter={group ? () => setDragOverGroupId(group.id) : undefined}
          onDragLeave={group ? () => setDragOverGroupId((prev) => (prev === group.id ? null : prev)) : undefined}
          onDrop={
            group
              ? (event) => {
                  event.preventDefault();
                  setDragOverGroupId(null);
                  const raw = event.dataTransfer.getData(DRAG_PAYLOAD_TYPE);
                  if (!raw) return;
                  const payload = parseDragPayload(raw);
                  if (!payload) return;
                  if (payload.fromGroupId === group.id) return;
                  onMoveMember(payload.reservationId, payload.fromGroupId, group.id);
                }
              : undefined
          }
          className={`flex w-full flex-1 flex-col gap-1 rounded-lg bg-[#e7f4ff] p-2 transition ${index > 0 ? "mt-1" : ""} ${
            group && dragOverGroupId === group.id ? "ring-2 ring-[#236c9c] ring-offset-1" : ""
          }`}
        >
          {group ? (
            <button
              type="button"
              onClick={() => onOpenGroupDetail(group.id)}
              className="w-fit text-left text-[10px] font-black text-[#236c9c] opacity-80 hover:underline"
            >
              {group.label}
            </button>
          ) : (
            <div className="text-[10px] font-black text-[#236c9c] opacity-80">알 수 없는 그룹</div>
          )}

          <div className="flex flex-col gap-1">
            {reservations.map((reservation) => (
              <button
                key={reservation.id}
                type="button"
                draggable={Boolean(group)}
                onDragStart={
                  group
                    ? (event) => {
                        const payload: DragPayload = { reservationId: reservation.id, fromGroupId: group.id };
                        event.dataTransfer.setData(DRAG_PAYLOAD_TYPE, JSON.stringify(payload));
                        event.dataTransfer.effectAllowed = "move";
                      }
                    : undefined
                }
                onClick={() => onOpenDetail(reservation)}
                style={{ backgroundColor: childColor(reservation).background, borderColor: childColor(reservation).border }}
                className={`w-full rounded-lg border px-3 py-2 text-left shadow-sm transition hover:opacity-80 ${
                  group ? "cursor-grab active:cursor-grabbing" : ""
                }`}
              >
                <div className="truncate text-[11px] font-bold text-[#236c9c]">{reservation.childName}</div>
                <div className="mt-0.5 truncate text-[10px] font-bold text-[#236c9c] opacity-70">
                  학부모 {reservation.parentName}
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
