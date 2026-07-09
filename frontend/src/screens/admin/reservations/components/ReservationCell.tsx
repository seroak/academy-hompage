import { useMemo, useState } from "react";
import { AlertTriangle, ChevronDown, ChevronRight, Info } from "lucide-react";
import { Reservation } from "../../../../api/schemas/reservation.schema";
import { ReservationGroup } from "../../../../api/schemas/reservation-group.schema";
import { cellBackground, childColor, reservationTitle, slotKey } from "../utils/reservationAdminUtils";
import { DayOfWeek, SelectedSlot } from "../types";

type Props = {
  day: DayOfWeek;
  rowStart: number;
  rowSpan: number;
  waitingInCell: Reservation[];
  groupedInCell: Reservation[];
  selectedSlots: Map<string, SelectedSlot>;
  groupByReservationId: Map<string, ReservationGroup>;
  joinableGroupsForReservation: (reservation: Reservation, day: DayOfWeek) => ReservationGroup[];
  onToggleSlot: (reservation: Reservation, day: DayOfWeek, rowStart: number) => void;
  onSelectCell: (day: DayOfWeek, rowStart: number) => void;
  onOpenDetail: (r: Reservation) => void;
  onCancelReservation: (id: string) => void;
  onAddToGroup: (reservation: Reservation, group: ReservationGroup, day: DayOfWeek) => void;
  onOpenGroupDetail: (groupId: string) => void;
};

type WaitingReservationsSectionProps = {
  day: DayOfWeek;
  rowStart: number;
  reservations: Reservation[];
  selectedSlots: Map<string, SelectedSlot>;
  joinableGroupsForReservation: (reservation: Reservation, day: DayOfWeek) => ReservationGroup[];
  onToggleSlot: (reservation: Reservation, day: DayOfWeek, rowStart: number) => void;
  onSelectCell: (day: DayOfWeek, rowStart: number) => void;
  onOpenDetail: (reservation: Reservation) => void;
  onCancelReservation: (id: string) => void;
  onAddToGroup: (reservation: Reservation, group: ReservationGroup, day: DayOfWeek) => void;
  /** 같은 칸에 확정 그룹이 함께 있는 혼합 칸인지 — 여석 없는 신청을 흐리게 표시하는 데 쓰인다. */
  isMixed?: boolean;
};

type WaitingReservationItemProps = {
  day: DayOfWeek;
  rowStart: number;
  reservation: Reservation;
  selectedSlots: Map<string, SelectedSlot>;
  joinableGroups: ReservationGroup[];
  onToggleSlot: (reservation: Reservation, day: DayOfWeek, rowStart: number) => void;
  onOpenDetail: (reservation: Reservation) => void;
  onCancelReservation: (id: string) => void;
  onAddToGroup: (reservation: Reservation, group: ReservationGroup, day: DayOfWeek) => void;
  /** 혼합 칸에서 합류 가능한 확정 그룹이 없는 신청 — 우선순위가 낮음을 흐린 색으로 표시한다. */
  isMuted?: boolean;
};

type GroupedReservationsSectionProps = {
  groupedByGroupId: Map<string, { group: ReservationGroup | null; reservations: Reservation[] }>;
  onOpenDetail: (reservation: Reservation) => void;
  onOpenGroupDetail: (groupId: string) => void;
};

function groupReservationsByGroup(
  reservations: Reservation[],
  groupByReservationId: Map<string, ReservationGroup>,
): Map<string, { group: ReservationGroup | null; reservations: Reservation[] }> {
  const map = new Map<string, { group: ReservationGroup | null; reservations: Reservation[] }>();

  for (const reservation of reservations) {
    const group = groupByReservationId.get(reservation.id) ?? null;
    const key = group?.id ?? "unknown";

    if (!map.has(key)) {
      map.set(key, { group, reservations: [] });
    }
    map.get(key)!.reservations.push(reservation);
  }

  return map;
}

export default function ReservationCell({
  day,
  rowStart,
  rowSpan,
  waitingInCell,
  groupedInCell,
  selectedSlots,
  groupByReservationId,
  joinableGroupsForReservation,
  onToggleSlot,
  onSelectCell,
  onOpenDetail,
  onCancelReservation,
  onAddToGroup,
  onOpenGroupDetail,
}: Props) {
  const groupedByGroupId = useMemo(
    () => groupReservationsByGroup(groupedInCell, groupByReservationId),
    [groupedInCell, groupByReservationId],
  );

  const isMixed = groupedInCell.length > 0 && waitingInCell.length > 0;
  const [waitingExpanded, setWaitingExpanded] = useState(false);

  const anyJoinable = useMemo(
    () =>
      isMixed &&
      waitingInCell.some((reservation) => joinableGroupsForReservation(reservation, day).length > 0),
    [isMixed, waitingInCell, joinableGroupsForReservation, day],
  );

  return (
    <td rowSpan={rowSpan} className="h-[1px] border-b border-l border-[#f6ead0] bg-white p-0 align-top">
      <div className="flex h-full min-h-[48px] flex-col">
        {groupedInCell.length > 0 && (
          <GroupedReservationsSection
            groupedByGroupId={groupedByGroupId}
            onOpenDetail={onOpenDetail}
            onOpenGroupDetail={onOpenGroupDetail}
          />
        )}

        {waitingInCell.length > 0 && !isMixed && (
          <WaitingReservationsSection
            day={day}
            rowStart={rowStart}
            reservations={waitingInCell}
            selectedSlots={selectedSlots}
            joinableGroupsForReservation={joinableGroupsForReservation}
            onToggleSlot={onToggleSlot}
            onSelectCell={onSelectCell}
            onOpenDetail={onOpenDetail}
            onCancelReservation={onCancelReservation}
            onAddToGroup={onAddToGroup}
          />
        )}

        {isMixed && (
          <div className="flex flex-col gap-1 px-1 pb-1">
            <button
              type="button"
              onClick={() => setWaitingExpanded((prev) => !prev)}
              aria-expanded={waitingExpanded}
              className={`flex w-fit items-center gap-1 rounded-full px-3 py-1 text-left text-[10px] font-black transition ${
                anyJoinable
                  ? "bg-[#fff3c8] text-[#9f4d00] hover:bg-[#ffe9a6]"
                  : "bg-[#f4f0e8] text-[#9a8f7d] hover:bg-[#ece6d8]"
              }`}
            >
              {waitingExpanded ? <ChevronDown size={12} strokeWidth={3} /> : <ChevronRight size={12} strokeWidth={3} />}
              {anyJoinable ? (
                <span>대기 {waitingInCell.length}명 · 추가 가능</span>
              ) : (
                <span className="flex items-center gap-1">
                  <AlertTriangle size={11} strokeWidth={2.5} />
                  대기 {waitingInCell.length}명 · 정원 초과
                </span>
              )}
            </button>

            {waitingExpanded && (
              <WaitingReservationsSection
                day={day}
                rowStart={rowStart}
                reservations={waitingInCell}
                selectedSlots={selectedSlots}
                joinableGroupsForReservation={joinableGroupsForReservation}
                onToggleSlot={onToggleSlot}
                onSelectCell={onSelectCell}
                onOpenDetail={onOpenDetail}
                onCancelReservation={onCancelReservation}
                onAddToGroup={onAddToGroup}
                isMixed
              />
            )}
          </div>
        )}
      </div>
    </td>
  );
}

function WaitingReservationsSection({
  day,
  rowStart,
  reservations,
  selectedSlots,
  joinableGroupsForReservation,
  onToggleSlot,
  onSelectCell,
  onOpenDetail,
  onCancelReservation,
  onAddToGroup,
  isMixed,
}: WaitingReservationsSectionProps) {
  return (
    <div className={`m-1 flex flex-col gap-1.5 rounded-lg p-2 pb-1 ${cellBackground(reservations.length)}`}>
      {reservations.map((reservation) => {
        const joinableGroups = joinableGroupsForReservation(reservation, day);
        const isMuted = Boolean(isMixed) && joinableGroups.length === 0;

        return (
          <WaitingReservationItem
            key={reservation.id}
            day={day}
            rowStart={rowStart}
            reservation={reservation}
            selectedSlots={selectedSlots}
            joinableGroups={joinableGroups}
            onToggleSlot={onToggleSlot}
            onOpenDetail={onOpenDetail}
            onCancelReservation={onCancelReservation}
            onAddToGroup={onAddToGroup}
            isMuted={isMuted}
          />
        );
      })}

      <button
        type="button"
        onClick={() => onSelectCell(day, rowStart)}
        className="w-fit text-left text-[10px] font-black text-[#e86f00] hover:underline"
      >
        이 칸 전체 선택
      </button>
    </div>
  );
}

function WaitingReservationItem({
  day,
  rowStart,
  reservation,
  selectedSlots,
  joinableGroups,
  onToggleSlot,
  onOpenDetail,
  onCancelReservation,
  onAddToGroup,
  isMuted,
}: WaitingReservationItemProps) {
  const isSelected = selectedSlots.has(slotKey(reservation.id, day, rowStart));
  const color = childColor(reservation);

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1">
        <button
          type="button"
          title={reservationTitle(reservation)}
          onClick={() => onToggleSlot(reservation, day, rowStart)}
          style={isSelected || isMuted ? undefined : { backgroundColor: color.background, borderColor: color.border }}
          className={`flex-1 truncate rounded-full border px-3 py-1.5 text-left text-xs font-black transition ${
            isSelected
              ? "border-transparent bg-[#ff8a1f] text-white shadow-[0_8px_18px_rgba(255,138,31,0.22)]"
              : isMuted
                ? "border-[#e5ddcf] bg-[#faf7f0] text-[#9a8f7d] hover:border-[#ddd0ba] hover:text-[#7d735f]"
                : "text-[#3f3a31] hover:opacity-80"
          }`}
        >
          {reservation.childName}
          <span className="ml-1 opacity-70">({reservation.childAge})</span>
        </button>

        <button
          type="button"
          onClick={() => onOpenDetail(reservation)}
          aria-label="예약 상세 보기"
          className="grid size-7 shrink-0 place-items-center rounded-full text-[#8a7a61] transition hover:bg-[#fff0cf] hover:text-[#e86f00]"
        >
          <Info size={15} strokeWidth={2.5} />
        </button>

        <button
          type="button"
          onClick={() => onCancelReservation(reservation.id)}
          aria-label="신청 취소"
          className="grid size-7 shrink-0 place-items-center rounded-full text-[#d8bfa0] transition hover:bg-[#fff5f1] hover:text-[#d6452f]"
        >
          ×
        </button>
      </div>

      {joinableGroups.map((group) => (
        <button
          key={group.id}
          type="button"
          onClick={() => onAddToGroup(reservation, group, day)}
          className="w-fit rounded-full bg-[#eaf7ea] px-3 py-1 text-left text-[10px] font-black text-[#2f7a3d] transition hover:bg-[#d9f0da]"
        >
          {group.label}에 추가 ({group.reservations?.length ?? 0}/{group.capacity})
        </button>
      ))}
    </div>
  );
}

function GroupedReservationsSection({
  groupedByGroupId,
  onOpenDetail,
  onOpenGroupDetail,
}: GroupedReservationsSectionProps) {
  return (
    <div className="flex w-full flex-1 flex-col p-1">
      {Array.from(groupedByGroupId.entries()).map(([key, { group, reservations }], index) => (
        <div
          key={key}
          className={`flex w-full flex-1 flex-col gap-1 rounded-lg bg-[#e7f4ff] p-2 ${index > 0 ? "mt-1" : ""}`}
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
                onClick={() => onOpenDetail(reservation)}
                style={{ backgroundColor: childColor(reservation).background }}
                className="w-fit rounded px-2 py-0.5 text-left text-[11px] font-bold text-[#236c9c] shadow-sm transition hover:opacity-80"
              >
                {reservation.childName}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
