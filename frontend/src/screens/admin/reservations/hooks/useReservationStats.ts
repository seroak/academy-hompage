import { useMemo } from 'react'
import { Reservation } from '../../../../api/schemas/reservation.schema'
import { ReservationGroup } from '../../../../api/schemas/reservation-group.schema'

export function useReservationStats(reservations: Reservation[], groups: ReservationGroup[]) {
  const waiting = useMemo(() => reservations.filter((r) => r.status === 'WAITING'), [reservations])
  const grouped = useMemo(() => reservations.filter((r) => r.status === 'GROUPED'), [reservations])
  const cancelledCount = useMemo(() => reservations.filter((r) => r.status === 'CANCELLED').length, [reservations])
  const confirmedGroupsCount = useMemo(() => groups.filter((g) => g.status === 'CONFIRMED').length, [groups])

  const statCards = useMemo(
    () => [
      { label: '대기중', count: waiting.length, className: 'bg-[#fff3c8] text-[#9f4d00]' },
      { label: '그룹편성', count: grouped.length, className: 'bg-[#e9f9ec] text-[#2f7a3d]' },
      { label: '확정된 그룹', count: confirmedGroupsCount, className: 'bg-[#e7f4ff] text-[#236c9c]' },
      { label: '취소됨', count: cancelledCount, className: 'bg-[#fff5f1] text-[#d6452f]' },
    ],
    [waiting.length, grouped.length, confirmedGroupsCount, cancelledCount],
  )

  return { waiting, grouped, cancelledCount, confirmedGroupsCount, statCards }
}
