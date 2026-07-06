import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  createInstructor,
  deleteInstructor,
  updateInstructor,
} from '../../../api/instructors.api'
import { queryKeys } from '../../../queries/queryKeys'
import type { CreateInstructorInput } from '../../../api/schemas/instructor-input.schema'

export function useInstructorMutations() {
  const queryClient = useQueryClient()

  function invalidateInstructors() {
    return queryClient.invalidateQueries({ queryKey: queryKeys.instructors.all })
  }

  const createMutation = useMutation({
    mutationKey: ['instructors', 'create'],
    mutationFn: (input: CreateInstructorInput) => createInstructor(input),
    onSuccess: invalidateInstructors,
  })

  const updateMutation = useMutation({
    mutationKey: ['instructors', 'update'],
    mutationFn: ({ id, input }: { id: string; input: Partial<CreateInstructorInput> }) =>
      updateInstructor(id, input),
    onSuccess: invalidateInstructors,
  })

  const deleteMutation = useMutation({
    mutationKey: ['instructors', 'delete'],
    mutationFn: (id: string) => deleteInstructor(id),
    onSuccess: invalidateInstructors,
  })

  return {
    createInstructor: (input: CreateInstructorInput) => createMutation.mutateAsync(input),
    updateInstructor: (id: string, input: Partial<CreateInstructorInput>) =>
      updateMutation.mutateAsync({ id, input }),
    deleteInstructor: (id: string) => deleteMutation.mutateAsync(id),
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    createError: createMutation.error,
    deleteError: deleteMutation.error,
  }
}
