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
  ReservationGroup,
} from '../../../api/schemas/reservation-group.schema'
import type { Reservation } from '../../../api/schemas/reservation.schema'
import { nowIso, optimisticId, restoreQuerySnapshots, snapshotQueryLists, updateCachedLists } from '../../../queries/optimisticCache'

export function useReservationGroupMutations() {
  const queryClient = useQueryClient()

  function invalidateAll() {
    return Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.reservationGroups.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.reservations.all }),
    ])
  }

  async function snapshotAll() {
    const [groupSnapshots, reservationSnapshots] = await Promise.all([
      snapshotQueryLists<ReservationGroup>(queryClient, queryKeys.reservationGroups.all),
      snapshotQueryLists<Reservation>(queryClient, queryKeys.reservations.all),
    ])
    return { groupSnapshots, reservationSnapshots }
  }

  function restoreAll(context: Awaited<ReturnType<typeof snapshotAll>>) {
    restoreQuerySnapshots(queryClient, context.groupSnapshots)
    restoreQuerySnapshots(queryClient, context.reservationSnapshots)
  }

  function updateReservations(updater: (reservation: Reservation) => Reservation) {
    updateCachedLists<Reservation>(queryClient, queryKeys.reservations.all, (reservations) => reservations.map(updater))
  }

  function cachedReservation(id: string) {
    for (const [, reservations] of queryClient.getQueriesData<Reservation[]>({ queryKey: queryKeys.reservations.all })) {
      const reservation = reservations?.find((item) => item.id === id)
      if (reservation) return reservation
    }
  }

  const createMutation = useMutation({
    mutationKey: ['reservationGroups', 'create'],
    mutationFn: (input: CreateReservationGroupInput) => createReservationGroup(input),
    onMutate: async (input) => {
      const context = await snapshotAll()
      const id = optimisticId('reservation-group')
      const group: ReservationGroup = {
        id,
        label: input.label,
        status: 'CONFIRMED',
        capacity: input.capacity,
        minAge: input.minAge ?? 4,
        maxAge: input.maxAge ?? 10,
        scheduleDayOfWeek: input.scheduleDayOfWeek ?? null,
        scheduleStartMinute: input.scheduleStartMinute ?? null,
        scheduleEndMinute: input.scheduleEndMinute ?? null,
        slots: input.slots.map((slot) => ({ id: optimisticId('group-slot'), ...slot })),
        reservations: input.slots.flatMap((slot) => {
          const reservation = cachedReservation(slot.reservationId)
          return reservation ? [reservation] : []
        }),
        createdAt: nowIso(),
        updatedAt: nowIso(),
      }
      updateCachedLists<ReservationGroup>(queryClient, queryKeys.reservationGroups.all, (groups) => [...groups, group])
      const memberIds = new Set(input.slots.map((slot) => slot.reservationId))
      updateReservations((reservation) => memberIds.has(reservation.id) ? { ...reservation, status: 'GROUPED', groupId: id, updatedAt: nowIso() } : reservation)
      return { ...context, optimisticId: id }
    },
    onError: (_error, _input, context) => {
      if (!context) return
      restoreAll(context)
    },
    onSuccess: (group, _input, context) => updateCachedLists<ReservationGroup>(queryClient, queryKeys.reservationGroups.all, (groups) => groups.map((item) => item.id === context?.optimisticId ? group : item)),
    onSettled: invalidateAll,
  })

  const deleteMutation = useMutation({
    mutationKey: ['reservationGroups', 'delete'],
    mutationFn: (id: string) => deleteReservationGroup(id),
    onMutate: async (id) => {
      const context = await snapshotAll()
      updateCachedLists<ReservationGroup>(queryClient, queryKeys.reservationGroups.all, (groups) => groups.filter((group) => group.id !== id))
      updateReservations((reservation) => reservation.groupId === id ? { ...reservation, status: 'WAITING', groupId: null, updatedAt: nowIso() } : reservation)
      return context
    },
    onError: (_error, _id, context) => {
      if (!context) return
      restoreAll(context)
    },
    onSettled: invalidateAll,
  })

  const addMemberMutation = useMutation({
    mutationKey: ['reservationGroups', 'addMember'],
    mutationFn: ({ groupId, input }: { groupId: string; input: AddGroupMemberInput }) =>
      addGroupMember(groupId, input),
    onMutate: async ({ groupId, input }) => {
      const context = await snapshotAll()
      const reservation = cachedReservation(input.reservationId)
      updateCachedLists<ReservationGroup>(queryClient, queryKeys.reservationGroups.all, (groups) => groups.map((group) => group.id !== groupId ? group : {
        ...group,
        slots: [...group.slots, ...input.slots.map((slot) => ({ id: optimisticId('group-slot'), reservationId: input.reservationId, ...slot }))],
        reservations: reservation && !group.reservations?.some((item) => item.id === reservation.id) ? [...(group.reservations ?? []), reservation] : group.reservations,
        updatedAt: nowIso(),
      }))
      updateReservations((item) => item.id === input.reservationId ? { ...item, status: 'GROUPED', groupId, updatedAt: nowIso() } : item)
      return context
    },
    onError: (_error, _variables, context) => {
      if (!context) return
      restoreAll(context)
    },
    onSuccess: (group) => updateCachedLists<ReservationGroup>(queryClient, queryKeys.reservationGroups.all, (groups) => groups.map((item) => item.id === group.id ? group : item)),
    onSettled: invalidateAll,
  })

  const updateMutation = useMutation({
    mutationKey: ['reservationGroups', 'update'],
    mutationFn: ({ id, input }: { id: string; input: UpdateReservationGroupInput }) =>
      updateReservationGroup(id, input),
    onMutate: async ({ id, input }) => {
      const context = await snapshotAll()
      updateCachedLists<ReservationGroup>(queryClient, queryKeys.reservationGroups.all, (groups) => groups.map((group) => group.id === id ? { ...group, ...input, updatedAt: nowIso() } : group))
      return context
    },
    onError: (_error, _variables, context) => {
      if (!context) return
      restoreAll(context)
    },
    onSuccess: (group) => updateCachedLists<ReservationGroup>(queryClient, queryKeys.reservationGroups.all, (groups) => groups.map((item) => item.id === group.id ? group : item)),
    onSettled: invalidateAll,
  })

  const removeMemberMutation = useMutation({
    mutationKey: ['reservationGroups', 'removeMember'],
    mutationFn: ({ groupId, reservationId }: { groupId: string; reservationId: string }) =>
      removeGroupMember(groupId, reservationId),
    onMutate: async ({ groupId, reservationId }) => {
      const context = await snapshotAll()
      updateCachedLists<ReservationGroup>(queryClient, queryKeys.reservationGroups.all, (groups) => groups.map((group) => group.id !== groupId ? group : {
        ...group,
        slots: group.slots.filter((slot) => slot.reservationId !== reservationId),
        reservations: group.reservations?.filter((reservation) => reservation.id !== reservationId),
        updatedAt: nowIso(),
      }))
      updateReservations((reservation) => reservation.id === reservationId ? { ...reservation, status: 'WAITING', groupId: null, updatedAt: nowIso() } : reservation)
      return context
    },
    onError: (_error, _variables, context) => {
      if (!context) return
      restoreAll(context)
    },
    onSettled: invalidateAll,
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
    onMutate: async ({ groupId, reservationId, input }) => {
      const context = await snapshotAll()
      updateCachedLists<ReservationGroup>(queryClient, queryKeys.reservationGroups.all, (groups) => groups.map((group) => group.id !== groupId ? group : {
        ...group,
        slots: [...group.slots.filter((slot) => slot.reservationId !== reservationId), ...input.slots.map((slot) => ({ id: optimisticId('group-slot'), reservationId, ...slot }))],
        updatedAt: nowIso(),
      }))
      return context
    },
    onError: (_error, _variables, context) => {
      if (!context) return
      restoreAll(context)
    },
    onSuccess: (group) => updateCachedLists<ReservationGroup>(queryClient, queryKeys.reservationGroups.all, (groups) => groups.map((item) => item.id === group.id ? group : item)),
    onSettled: invalidateAll,
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
    onMutate: async ({ reservationId, fromGroupId, toGroupId, slots }) => {
      const context = await snapshotAll()
      const reservation = cachedReservation(reservationId)
      updateCachedLists<ReservationGroup>(queryClient, queryKeys.reservationGroups.all, (groups) => groups.map((group) => {
        if (group.id === fromGroupId) return { ...group, slots: group.slots.filter((slot) => slot.reservationId !== reservationId), reservations: group.reservations?.filter((item) => item.id !== reservationId), updatedAt: nowIso() }
        if (group.id === toGroupId) return {
          ...group,
          slots: [...group.slots, ...slots.map((slot) => ({ id: optimisticId('group-slot'), reservationId, ...slot }))],
          reservations: reservation && !group.reservations?.some((item) => item.id === reservationId) ? [...(group.reservations ?? []), reservation] : group.reservations,
          updatedAt: nowIso(),
        }
        return group
      }))
      updateReservations((item) => item.id === reservationId ? { ...item, status: 'GROUPED', groupId: toGroupId, updatedAt: nowIso() } : item)
      return context
    },
    onError: (_error, _variables, context) => {
      if (!context) return
      restoreAll(context)
    },
    onSuccess: (group) => updateCachedLists<ReservationGroup>(queryClient, queryKeys.reservationGroups.all, (groups) => groups.map((item) => item.id === group.id ? group : item)),
    onSettled: invalidateAll,
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
