import { useState } from 'react'
import { Reservation } from '../../../../api/schemas/reservation.schema'
import { ReservationGroup } from '../../../../api/schemas/reservation-group.schema'

export function useReservationModals(reservations: Reservation[], groups: ReservationGroup[]) {
  const [detailReservationId, setDetailReservationId] = useState<string | null>(null)
  const [detailGroupId, setDetailGroupId] = useState<string | null>(null)

  const detailGroup = groups.find((group) => group.id === detailGroupId) ?? null
  const detailReservation = reservations.find((r) => r.id === detailReservationId) ?? null

  function setDetailReservation(reservation: Reservation | null) {
    setDetailReservationId(reservation?.id ?? null)
  }

  function openGroupDetail(groupId: string) {
    setDetailGroupId(groupId)
  }

  function closeGroupDetail() {
    setDetailGroupId(null)
  }

  return {
    detailReservation,
    setDetailReservation,
    detailGroup,
    openGroupDetail,
    closeGroupDetail,
  }
}
