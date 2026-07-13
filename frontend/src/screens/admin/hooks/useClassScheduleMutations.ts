import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClassSchedule, deleteClassSchedule, publishClassSchedule, updateClassSchedule } from '../../../api/classSchedules.api'
import type { ClassScheduleDay, ClassScheduleInput } from '../../../api/schemas/class-schedule.schema'
import { queryKeys } from '../../../queries/queryKeys'

export function useClassScheduleMutations() {
  const client = useQueryClient()
  const invalidate = () => Promise.all([
    client.invalidateQueries({ queryKey: queryKeys.classSchedules.all }),
    client.invalidateQueries({ queryKey: queryKeys.classSchedules.published }),
  ])
  const create = useMutation({ mutationFn: (input: ClassScheduleInput) => createClassSchedule(input), onSettled: invalidate })
  const update = useMutation({ mutationFn: ({ id, days }: { id: string; days: Omit<ClassScheduleDay, 'id'>[] }) => updateClassSchedule(id, days), onSettled: invalidate })
  const publish = useMutation({ mutationFn: publishClassSchedule, onSettled: invalidate })
  const remove = useMutation({ mutationFn: deleteClassSchedule, onSettled: invalidate })
  return {
    createSchedule: create.mutateAsync, updateSchedule: update.mutateAsync,
    publishSchedule: publish.mutateAsync, deleteSchedule: remove.mutateAsync,
    isCreating: create.isPending, isSaving: update.isPending, isPublishing: publish.isPending,
  }
}
