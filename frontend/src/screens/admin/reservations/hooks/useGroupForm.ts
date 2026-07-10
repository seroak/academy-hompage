import { useState, type FormEvent } from 'react'
import { CreateReservationGroupInputSchema, CreateReservationGroupInput } from '../../../../api/schemas/reservation-group.schema'
import { DayOfWeek, ReservationGroupFormState, SelectedSlot } from '../types'
import { findSlotGap, mergeContiguousSlots } from '../utils/reservationAdminUtils'

const emptyGroupForm: ReservationGroupFormState = {
  label: '',
}

export function useGroupForm(
  selectedSlots: Map<string, SelectedSlot>,
  selectedAges: number[],
  selectedReservationCount: number,
  createGroup: (input: CreateReservationGroupInput) => Promise<any>,
  onSuccess: () => void
) {
  const [groupForm, setGroupForm] = useState<ReservationGroupFormState>(emptyGroupForm)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [blankGroupFieldErrors, setBlankGroupFieldErrors] = useState<Record<string, string>>({})
  const [blankGroupSubmitError, setBlankGroupSubmitError] = useState<string | null>(null)

  const groupCapacity = groupForm.capacityOverride ?? Math.max(selectedReservationCount, 1)
  const groupMinAge = groupForm.minAgeOverride ?? (selectedAges.length > 0 ? Math.min(...selectedAges) : undefined)
  const groupMaxAge = groupForm.maxAgeOverride ?? (selectedAges.length > 0 ? Math.max(...selectedAges) : undefined)

  async function handleConfirmGroup(event: FormEvent) {
    event.preventDefault()

    const gapSlot = findSlotGap(Array.from(selectedSlots.values()))
    if (gapSlot) {
      window.alert(
        `${gapSlot.childName}의 선택한 시간 사이에 빈 시간이 있습니다. 이어지는 시간만 그룹으로 묶을 수 있습니다.`,
      )
      return
    }

    const input = {
      label: groupForm.label,
      capacity: groupCapacity,
      minAge: groupMinAge,
      maxAge: groupMaxAge,
      slots: mergeContiguousSlots(
        Array.from(selectedSlots.values()).map(({ reservationId, dayOfWeek, startMinute, endMinute }) => ({
          reservationId,
          dayOfWeek,
          startMinute,
          endMinute,
        })),
      ),
    }
    const result = CreateReservationGroupInputSchema.safeParse(input)
    if (!result.success) {
      const errors: Record<string, string> = {}
      for (const issue of result.error.issues) {
        errors[String(issue.path[0])] = issue.message
      }
      setFieldErrors(errors)
      return
    }
    setFieldErrors({})
    setSubmitError(null)

    try {
      await createGroup(result.data)
      setGroupForm(emptyGroupForm)
      onSuccess()
    } catch {
      setSubmitError('그룹 확정에 실패했습니다.')
    }
  }

  async function handleCreateBlankGroup(input: {
    label: string
    capacity: number
    minAge?: number
    maxAge?: number
    scheduleDayOfWeek: DayOfWeek
    scheduleStartMinute: number
    scheduleEndMinute: number
  }): Promise<boolean> {
    const result = CreateReservationGroupInputSchema.safeParse({ ...input, slots: [] })
    if (!result.success) {
      const errors: Record<string, string> = {}
      for (const issue of result.error.issues) {
        errors[String(issue.path[0])] = issue.message
      }
      setBlankGroupFieldErrors(errors)
      return false
    }
    setBlankGroupFieldErrors({})
    setBlankGroupSubmitError(null)

    try {
      await createGroup(result.data)
      return true
    } catch {
      setBlankGroupSubmitError('그룹 생성에 실패했습니다.')
      return false
    }
  }

  return {
    groupForm,
    setGroupForm,
    fieldErrors,
    submitError,
    blankGroupFieldErrors,
    blankGroupSubmitError,
    groupCapacity,
    groupMinAge,
    groupMaxAge,
    handleConfirmGroup,
    handleCreateBlankGroup,
  }
}
