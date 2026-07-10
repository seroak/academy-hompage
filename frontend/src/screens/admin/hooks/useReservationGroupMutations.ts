import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  deleteReservationGroup,
  createReservationGroup,
  addGroupMember,
  updateReservationGroup,
  removeGroupMember,
  replaceGroupMemberSlots,
  moveGroupMember,
} from '../../../api/reservationGroups.api'
import { queryKeys } from '../../../queries/queryKeys'
import type {
  AddGroupMemberInput,
  CreateReservationGroupInput,
  ReplaceMemberSlotsInput,
  UpdateReservationGroupInput,
} from '../../../api/schemas/reservation-group.schema'

export function useReservationGroupMutations() {
  const queryClient = useQueryClient()

  function invalidateAll() {
    return Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.reservationGroups.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.reservations.all }),
    ])
  }

  const createMutation = useMutation({
    mutationKey: ['reservationGroups', 'create'],
    mutationFn: (input: CreateReservationGroupInput) => createReservationGroup(input),
    onSuccess: invalidateAll,
  })

  const deleteMutation = useMutation({
    mutationKey: ['reservationGroups', 'delete'],
    mutationFn: (id: string) => deleteReservationGroup(id),
    onSuccess: invalidateAll,
  })

  const addMemberMutation = useMutation({
    mutationKey: ['reservationGroups', 'addMember'],
    mutationFn: ({ groupId, input }: { groupId: string; input: AddGroupMemberInput }) =>
      addGroupMember(groupId, input),
    onSuccess: invalidateAll,
  })

  const updateMutation = useMutation({
    mutationKey: ['reservationGroups', 'update'],
    mutationFn: ({ id, input }: { id: string; input: UpdateReservationGroupInput }) =>
      updateReservationGroup(id, input),
    onSuccess: invalidateAll,
  })

  const removeMemberMutation = useMutation({
    mutationKey: ['reservationGroups', 'removeMember'],
    mutationFn: ({ groupId, reservationId }: { groupId: string; reservationId: string }) =>
      removeGroupMember(groupId, reservationId),
    onSuccess: invalidateAll,
  })

  const replaceMemberSlotsMutation = useMutation({
    mutationKey: ['reservationGroups', 'replaceMemberSlots'],
    mutationFn: ({
      groupId,
      reservationId,
      input,
    }: {
      groupId: string
      reservationId: string
      input: ReplaceMemberSlotsInput
    }) => replaceGroupMemberSlots(groupId, reservationId, input),
    onSuccess: invalidateAll,
  })

  const moveMemberMutation = useMutation({
    mutationKey: ['reservationGroups', 'moveMember'],
    mutationFn: ({
      reservationId,
      fromGroupId,
      toGroupId,
      slots,
    }: {
      reservationId: string
      fromGroupId: string
      toGroupId: string
      slots: AddGroupMemberInput['slots']
    }) => moveGroupMember(fromGroupId, reservationId, { targetGroupId: toGroupId, slots }),
    onSuccess: invalidateAll,
  })

  return {
    createGroup: (input: CreateReservationGroupInput) => createMutation.mutateAsync(input),
    deleteGroup: (id: string) => deleteMutation.mutateAsync(id),
    addMember: (groupId: string, input: AddGroupMemberInput) =>
      addMemberMutation.mutateAsync({ groupId, input }),
    updateGroup: (id: string, input: UpdateReservationGroupInput) =>
      updateMutation.mutateAsync({ id, input }),
    removeMember: (groupId: string, reservationId: string) =>
      removeMemberMutation.mutateAsync({ groupId, reservationId }),
    replaceMemberSlots: (groupId: string, reservationId: string, input: ReplaceMemberSlotsInput) =>
      replaceMemberSlotsMutation.mutateAsync({ groupId, reservationId, input }),
    moveMember: (reservationId: string, fromGroupId: string, toGroupId: string, slots: AddGroupMemberInput['slots']) =>
      moveMemberMutation.mutateAsync({ reservationId, fromGroupId, toGroupId, slots }),
    isCreating: createMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isAddingMember: addMemberMutation.isPending,
    isUpdatingGroup: updateMutation.isPending,
    isRemovingMember: removeMemberMutation.isPending,
    isReplacingMemberSlots: replaceMemberSlotsMutation.isPending,
    isMovingMember: moveMemberMutation.isPending,
    createError: createMutation.error,
    addMemberError: addMemberMutation.error,
  }
}
