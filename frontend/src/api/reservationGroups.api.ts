import { apiFetch } from '../lib/apiClient'
import {
  ReservationGroupListSchema,
  ReservationGroupSchema,
  type AddGroupMemberInput,
  type CreateReservationGroupInput,
  type ReplaceMemberSlotsInput,
  type ReservationGroup,
  type UpdateReservationGroupInput,
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
  input: UpdateReservationGroupInput,
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

export async function addGroupMember(
  groupId: string,
  input: AddGroupMemberInput,
): Promise<ReservationGroup> {
  const raw = await apiFetch(`/reservation-groups/${groupId}/members`, {
    method: 'POST',
    body: JSON.stringify(input),
  })
  return ReservationGroupSchema.parse(raw)
}

export async function removeGroupMember(groupId: string, reservationId: string): Promise<void> {
  await apiFetch(`/reservation-groups/${groupId}/members/${reservationId}`, { method: 'DELETE' })
}

export async function replaceGroupMemberSlots(
  groupId: string,
  reservationId: string,
  input: ReplaceMemberSlotsInput,
): Promise<ReservationGroup> {
  const raw = await apiFetch(`/reservation-groups/${groupId}/members/${reservationId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
  return ReservationGroupSchema.parse(raw)
}

export async function moveGroupMember(
  sourceGroupId: string,
  reservationId: string,
  input: { targetGroupId: string; slots: AddGroupMemberInput['slots'] },
): Promise<ReservationGroup> {
  const raw = await apiFetch(`/reservation-groups/${sourceGroupId}/members/${reservationId}/move`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
  return ReservationGroupSchema.parse(raw)
}
