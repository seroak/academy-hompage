import { useState } from 'react'
import { Reservation } from '../../../../api/schemas/reservation.schema'
import { DayOfWeek, SelectedSlot } from '../types'
import { ADMIN_ROW_MINUTES, slotKey } from '../utils/reservationAdminUtils'
import { CellData } from './useReservationTimetable'

export function useGridSelection(
  reservations: Reservation[],
  getCellReservations: (day: string, rowStart: number) => CellData
) {
  const [selectedSlots, setSelectedSlots] = useState<Map<string, SelectedSlot>>(new Map())

  const selectedReservationIds = [...new Set(Array.from(selectedSlots.values()).map((slot) => slot.reservationId))]
  const selectedAges = selectedReservationIds
      .map((id) => reservations.find((r) => r.id === id)?.childAge)
      .filter((age): age is number => age !== undefined)
  const selectedReservationCount = selectedReservationIds.length

  function toggleSlot(reservation: Reservation, day: DayOfWeek, rowStart: number) {
    const key = slotKey(reservation.id, day, rowStart)
    setSelectedSlots((prev) => {
      const next = new Map(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.set(key, {
          reservationId: reservation.id,
          childName: reservation.childName,
          dayOfWeek: day,
          startMinute: rowStart,
          endMinute: rowStart + ADMIN_ROW_MINUTES,
        })
      }
      return next
    })
  }

  function removeSlot(key: string) {
    setSelectedSlots((prev) => {
      const next = new Map(prev)
      next.delete(key)
      return next
    })
  }

  function selectCell(day: DayOfWeek, rowStart: number) {
    const { waitingInCell } = getCellReservations(day, rowStart)
    setSelectedSlots((prev) => {
      const next = new Map(prev)
      for (const reservation of waitingInCell) {
        const key = slotKey(reservation.id, day, rowStart)
        next.set(key, {
          reservationId: reservation.id,
          childName: reservation.childName,
          dayOfWeek: day,
          startMinute: rowStart,
          endMinute: rowStart + ADMIN_ROW_MINUTES,
        })
      }
      return next
    })
  }

  function clearSelection() {
    setSelectedSlots(new Map())
  }

  function removeReservationSelection(id: string) {
    setSelectedSlots((prev) => {
      const next = new Map(prev)
      for (const key of next.keys()) {
        if (key.startsWith(`${id}-`)) next.delete(key)
      }
      return next
    })
  }

  return {
    selectedSlots,
    selectedReservationIds,
    selectedAges,
    selectedReservationCount,
    toggleSlot,
    removeSlot,
    selectCell,
    clearSelection,
    removeReservationSelection,
  }
}
