import { apiFetch } from '../lib/apiClient'
import {
  ReservationGroupListSchema,
  ReservationGroupSchema,
  type CreateReservationGroupInput,
  type ReservationGroup,
} from './schemas/reservation-group.schema'

export async function fetchReservationGroups(): Promise<ReservationGroup[]> {
  const raw = await apiFetch('/reservation-groups')
  return ReservationGroupListSchema.parse(raw)
}

export async function fetchReservationGroup(id: string): Promise<ReservationGroup> {
  const raw = await apiFetch(`/reservation-groups/${id}`)
  return ReservationGroupSchema.parse(raw)
}

export async function createReservationGroup(
  input: CreateReservationGroupInput,
): Promise<ReservationGroup> {
  const raw = await apiFetch('/reservation-groups', {
    method: 'POST',
    body: JSON.stringify(input),
  })
  return ReservationGroupSchema.parse(raw)
}

export async function updateReservationGroup(
  id: string,
  input: Partial<Pick<CreateReservationGroupInput, 'label' | 'dayOfWeek' | 'startMinute' | 'endMinute'>>,
): Promise<ReservationGroup> {
  const raw = await apiFetch(`/reservation-groups/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
  return ReservationGroupSchema.parse(raw)
}

export async function deleteReservationGroup(id: string): Promise<void> {
  await apiFetch(`/reservation-groups/${id}`, { method: 'DELETE' })
}
