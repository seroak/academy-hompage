import { Info } from "lucide-react";
import { Reservation } from "../../../../api/schemas/reservation.schema";
import { ReservationGroup } from "../../../../api/schemas/reservation-group.schema";
import { cellBackground, childColor, reservationTitle, slotKey } from "../utils/reservationAdminUtils";
import { DayOfWeek, SelectedSlot } from "../types";

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

export function WaitingReservationsSection({
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
      <div className="relative">
        <button
          type="button"
          title={reservationTitle(reservation)}
          onClick={() => onToggleSlot(reservation, day, rowStart)}
          style={isSelected || isMuted ? undefined : { backgroundColor: color.background, borderColor: color.border }}
          className={`w-full rounded-lg border px-3 py-2 pr-14 text-left transition ${
            isSelected
              ? "border-transparent bg-[#ff8a1f] text-white shadow-[0_8px_18px_rgba(255,138,31,0.22)]"
              : isMuted
                ? "border-[#e5ddcf] bg-[#faf7f0] text-[#9a8f7d] hover:border-[#ddd0ba] hover:text-[#7d735f]"
                : "text-[#3f3a31] hover:opacity-80"
          }`}
        >
          <div className="truncate text-xs font-black">
            {reservation.childName}
            <span className="ml-1 opacity-70">({reservation.childAge})</span>
          </div>
          <div className="mt-0.5 truncate text-[10px] font-bold opacity-70">학부모 {reservation.parentName}</div>
        </button>

        <div className="absolute right-1 top-1 flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => onOpenDetail(reservation)}
            aria-label="예약 상세 보기"
            className={`grid size-7 shrink-0 place-items-center rounded-full transition ${
              isSelected
                ? "text-white/80 hover:bg-white/20 hover:text-white"
                : "text-[#8a7a61] hover:bg-[#fff0cf] hover:text-[#e86f00]"
            }`}
          >
            <Info size={15} strokeWidth={2.5} />
          </button>

          <button
            type="button"
            onClick={() => onCancelReservation(reservation.id)}
            aria-label="신청 취소"
            className={`grid size-7 shrink-0 place-items-center rounded-full transition ${
              isSelected
                ? "text-white/80 hover:bg-white/20 hover:text-white"
                : "text-[#d8bfa0] hover:bg-[#fff5f1] hover:text-[#d6452f]"
            }`}
          >
            ×
          </button>
        </div>
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
