import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createWalkInReservation, deleteReservation, updateReservation } from '../../../api/reservations.api'
import { queryKeys } from '../../../queries/queryKeys'
import type {
  CreateWalkInReservationInput,
  Reservation,
  UpdateReservationInput,
} from '../../../api/schemas/reservation.schema'
import { nowIso, optimisticId, restoreQuerySnapshots, snapshotQueryLists } from '../../../queries/optimisticCache'

function matchesFilters(reservation: Reservation, filters: unknown) {
  if (!filters || typeof filters !== 'object' || Array.isArray(filters)) return true
  const status = 'status' in filters ? filters.status : undefined
  const age = 'age' in filters ? filters.age : undefined
  const dayOfWeek = 'dayOfWeek' in filters ? filters.dayOfWeek : undefined
  if (typeof status === 'string' && reservation.status !== status) return false
  if (typeof age === 'number' && reservation.childAge !== age) return false
  if (typeof dayOfWeek === 'string' && !reservation.preferredSlots.some((slot) => slot.dayOfWeek === dayOfWeek)) return false
  return true
}

function replaceCachedReservation(
  queryClient: ReturnType<typeof useQueryClient>,
  reservation: Reservation,
) {
  for (const [key, current] of queryClient.getQueriesData<Reservation[]>({ queryKey: queryKeys.reservations.all })) {
    if (!current) continue
    const index = current.findIndex((item) => item.id === reservation.id)
    const next = current.filter((item) => item.id !== reservation.id)
    if (matchesFilters(reservation, key[1])) next.splice(index < 0 ? next.length : index, 0, reservation)
    queryClient.setQueryData(key, next)
  }
}

export function useReservationMutations() {
  const queryClient = useQueryClient()

  function invalidateReservations() {
    return queryClient.invalidateQueries({ queryKey: queryKeys.reservations.all })
  }

  const updateMutation = useMutation({
    mutationKey: ['reservations', 'update'],
    mutationFn: ({ id, input }: { id: string; input: UpdateReservationInput }) => updateReservation(id, input),
    onMutate: async ({ id, input }) => {
      const snapshots = await snapshotQueryLists<Reservation>(queryClient, queryKeys.reservations.all)
      for (const [, reservations] of snapshots) {
        const reservation = reservations?.find((item) => item.id === id)
        if (reservation) replaceCachedReservation(queryClient, { ...reservation, ...input, updatedAt: nowIso() })
      }
      return { snapshots }
    },
    onError: (_error, _variables, context) => {
      if (!context) return
      restoreQuerySnapshots(queryClient, context.snapshots)
    },
    onSuccess: (reservation) => replaceCachedReservation(queryClient, reservation),
    onSettled: invalidateReservations,
  })

  const deleteMutation = useMutation({
    mutationKey: ['reservations', 'delete'],
    mutationFn: (id: string) => deleteReservation(id),
    onMutate: async (id) => {
      const snapshots = await snapshotQueryLists<Reservation>(queryClient, queryKeys.reservations.all)
      for (const [key, reservations] of snapshots) queryClient.setQueryData(key, reservations?.filter((reservation) => reservation.id !== id))
      return { snapshots }
    },
    onError: (_error, _id, context) => {
      if (!context) return
      restoreQuerySnapshots(queryClient, context.snapshots)
    },
    onSettled: invalidateReservations,
  })

  const createWalkInMutation = useMutation({
    mutationKey: ['reservations', 'createWalkIn'],
    mutationFn: (input: CreateWalkInReservationInput) => createWalkInReservation(input),
    onMutate: async (input) => {
      const snapshots = await snapshotQueryLists<Reservation>(queryClient, queryKeys.reservations.all)
      const reservation: Reservation = {
        id: optimisticId('walk-in-reservation'),
        childName: input.childName,
        childAge: input.childAge,
        parentName: input.parentName,
        parentEmail: input.parentEmail ?? '',
        parentPhone: input.parentPhone || null,
        preferredSlots: input.preferredSlots,
        note: null,
        status: 'WAITING',
        groupId: null,
        requestedGroupId: null,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      }
      replaceCachedReservation(queryClient, reservation)
      return { snapshots, optimisticId: reservation.id }
    },
    onError: (_error, _input, context) => {
      if (!context) return
      restoreQuerySnapshots(queryClient, context.snapshots)
    },
    onSuccess: (reservation, _input, context) => {
      if (!context) return
      for (const [key, reservations] of queryClient.getQueriesData<Reservation[]>({ queryKey: queryKeys.reservations.all })) {
        if (reservations?.some((item) => item.id === context.optimisticId)) {
          queryClient.setQueryData(key, reservations.map((item) => item.id === context.optimisticId ? reservation : item))
        }
      }
    },
    onSettled: invalidateReservations,
  })

  return {
    updateReservation: (id: string, input: UpdateReservationInput) => updateMutation.mutateAsync({ id, input }),
    deleteReservation: (id: string) => deleteMutation.mutateAsync(id),
    createWalkInReservation: (input: CreateWalkInReservationInput) => createWalkInMutation.mutateAsync(input),
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isCreatingWalkIn: createWalkInMutation.isPending,
  }
}
