import { useMemo, useState } from "react";
import { AlertTriangle, ChevronDown, ChevronRight } from "lucide-react";
import { Reservation } from "../../../../api/schemas/reservation.schema";
import { ReservationGroup } from "../../../../api/schemas/reservation-group.schema";
import { DayOfWeek, SelectedSlot } from "../types";
import { EmptyGroupsSection } from "./EmptyGroupsSection";
import { GroupedReservationsSection } from "./GroupedReservationsSection";
import { groupReservationsByGroup } from "./reservationCell.utils";
import { WaitingReservationsSection } from "./WaitingReservationsSection";

type Props = {
  day: DayOfWeek;
  rowStart: number;
  rowSpan: number;
  waitingInCell: Reservation[];
  groupedInCell: Reservation[];
  emptyGroupsInCell: ReservationGroup[];
  selectedSlots: Map<string, SelectedSlot>;
  groupByReservationId: Map<string, ReservationGroup>;
  joinableGroupsForReservation: (reservation: Reservation, day: DayOfWeek) => ReservationGroup[];
  onToggleSlot: (reservation: Reservation, day: DayOfWeek, rowStart: number) => void;
  onSelectCell: (day: DayOfWeek, rowStart: number) => void;
  onOpenDetail: (r: Reservation) => void;
  onCancelReservation: (id: string) => void;
  onAddToGroup: (reservation: Reservation, group: ReservationGroup, day: DayOfWeek) => void;
  onOpenGroupDetail: (groupId: string) => void;
  onMoveMember: (reservationId: string, fromGroupId: string, toGroupId: string) => void;
  onDeleteGroup: (groupId: string) => void;
};

export default function ReservationCell({
  day,
  rowStart,
  rowSpan,
  waitingInCell,
  groupedInCell,
  emptyGroupsInCell,
  selectedSlots,
  groupByReservationId,
  joinableGroupsForReservation,
  onToggleSlot,
  onSelectCell,
  onOpenDetail,
  onCancelReservation,
  onAddToGroup,
  onOpenGroupDetail,
  onMoveMember,
  onDeleteGroup,
}: Props) {
  const groupedByGroupId = useMemo(
    () => groupReservationsByGroup(groupedInCell, groupByReservationId),
    [groupedInCell, groupByReservationId],
  );

  const hasGroupedContent = groupedInCell.length > 0 || emptyGroupsInCell.length > 0;
  const isMixed = hasGroupedContent && waitingInCell.length > 0;
  const [waitingExpanded, setWaitingExpanded] = useState(false);

  const anyJoinable = useMemo(
    () =>
      isMixed &&
      waitingInCell.some((reservation) => joinableGroupsForReservation(reservation, day).length > 0),
    [isMixed, waitingInCell, joinableGroupsForReservation, day],
  );

  return (
    <td
      rowSpan={rowSpan}
      data-testid={`timetable-cell-${day}-${rowStart}`}
      className="h-[1px] border-b border-l border-[#f6ead0] bg-white p-0 align-top"
    >
      <div className="flex h-full min-h-[48px] flex-col">
        {groupedInCell.length > 0 && (
          <GroupedReservationsSection
            groupedByGroupId={groupedByGroupId}
            onOpenDetail={onOpenDetail}
            onOpenGroupDetail={onOpenGroupDetail}
            onMoveMember={onMoveMember}
          />
        )}

        {emptyGroupsInCell.length > 0 && (
          <EmptyGroupsSection
            groups={emptyGroupsInCell}
            onOpenGroupDetail={onOpenGroupDetail}
            onMoveMember={onMoveMember}
            onDeleteGroup={onDeleteGroup}
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
