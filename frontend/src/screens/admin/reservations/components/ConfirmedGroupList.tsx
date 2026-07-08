import { DAY_OF_WEEK_LABELS, Reservation, timeRangeLabel } from '../../../../api/schemas/reservation.schema'
import { ReservationGroup } from '../../../../api/schemas/reservation-group.schema'

type Props = {
  groups: ReservationGroup[]
  requestedReservationsForGroup: (groupId: string) => Reservation[]
  onCancelGroup: (id: string) => void
  onApproveRequest: (reservation: Reservation, group: ReservationGroup) => void
  onOpenGroupDetail: (groupId: string) => void
}

export default function ConfirmedGroupList({
  groups,
  requestedReservationsForGroup,
  onCancelGroup,
  onApproveRequest,
  onOpenGroupDetail,
}: Props) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-black text-[#222222]">확정된 그룹</h2>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#e86f00]">
          총 {groups.length}개
        </span>
      </div>
      <ul className="grid gap-4">
        {groups.length === 0 && (
          <li className="rounded-[28px] border border-[#f2dfb9] bg-white px-6 py-10 text-center shadow-[0_18px_46px_rgba(95,67,18,0.08)]">
            <p className="text-base font-black text-[#222222]">확정된 그룹이 없습니다.</p>
            <p className="mt-2 text-sm font-semibold text-[#6f6253]">
              시간표에서 신청을 선택한 뒤 그룹을 확정해 주세요.
            </p>
          </li>
        )}
        {groups.map((group) => {
          const childNameById = new Map((group.reservations ?? []).map((r) => [r.id, r.childName]))
          const requestedReservations = requestedReservationsForGroup(group.id)

          return (
            <li
              key={group.id}
              className="rounded-[28px] border border-[#f2dfb9] bg-white p-5 shadow-[0_14px_36px_rgba(95,67,18,0.07)]"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-lg font-black text-[#222222]">{group.label}</p>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-black ${
                        group.status === 'CONFIRMED'
                          ? 'bg-[#e9f9ec] text-[#2f7a3d]'
                          : 'bg-[#fff5f1] text-[#d6452f]'
                      }`}
                    >
                      {group.status === 'CONFIRMED' ? '확정' : '취소됨'}
                    </span>
                    <span className="rounded-full bg-[#fff9ec] px-3 py-1 text-xs font-bold text-[#6f6253]">
                      인원 {group.reservations?.length ?? 0}/{group.capacity}명
                    </span>
                    <span className="rounded-full bg-[#fff9ec] px-3 py-1 text-xs font-bold text-[#6f6253]">
                      만 {group.minAge}~{group.maxAge}세
                    </span>
                  </div>
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {group.slots.map((slot) => (
                      <li
                        key={slot.id}
                        className="rounded-full bg-[#fff3c8] px-3 py-1 text-xs font-black text-[#9f4d00]"
                      >
                        {childNameById.get(slot.reservationId) ?? '알 수 없음'} ·{' '}
                        {DAY_OF_WEEK_LABELS[slot.dayOfWeek as keyof typeof DAY_OF_WEEK_LABELS] ??
                          slot.dayOfWeek}{' '}
                        {timeRangeLabel(slot.startMinute, slot.endMinute)}
                      </li>
                    ))}
                  </ul>
                  {requestedReservations.length > 0 && (
                    <ul className="mt-3 flex flex-wrap gap-2">
                      {requestedReservations.map((reservation) => (
                        <li key={reservation.id}>
                          <button
                            type="button"
                            onClick={() => onApproveRequest(reservation, group)}
                            className="rounded-full border border-[#9fd6a6] bg-[#eaf7ea] px-3 py-1 text-xs font-black text-[#2f7a3d] transition hover:bg-[#d9f0da]"
                          >
                            {reservation.childName} 합류 희망 · 승인
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                {group.status === 'CONFIRMED' && (
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => onOpenGroupDetail(group.id)}
                      className="inline-flex h-10 w-fit items-center justify-center rounded-full border border-[#f2dfb9] bg-white px-4 text-sm font-black text-[#9f4d00] transition duration-200 hover:-translate-y-0.5 hover:bg-[#fff3c8]"
                    >
                      상세·수정
                    </button>
                    <button
                      type="button"
                      onClick={() => onCancelGroup(group.id)}
                      className="inline-flex h-10 w-fit items-center justify-center rounded-full border border-[#ffd6cc] bg-[#fff5f1] px-4 text-sm font-black text-[#d6452f] transition duration-200 hover:-translate-y-0.5 hover:bg-[#ffe9e1]"
                    >
                      그룹 취소
                    </button>
                  </div>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
