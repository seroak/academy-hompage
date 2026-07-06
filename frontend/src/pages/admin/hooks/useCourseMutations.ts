import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createCourse, deleteCourse, updateCourse } from '../../../api/courses.api'
import { queryKeys } from '../../../queries/queryKeys'
import type { CreateCourseInput } from '../../../api/schemas/course.schema'

export function useCourseMutations() {
  const queryClient = useQueryClient()

  function invalidateCourses() {
    return queryClient.invalidateQueries({ queryKey: queryKeys.courses.all })
  }

  const createMutation = useMutation({
    mutationKey: ['courses', 'create'],
    mutationFn: (input: CreateCourseInput) => createCourse(input),
    onSuccess: invalidateCourses,
  })

  const updateMutation = useMutation({
    mutationKey: ['courses', 'update'],
    mutationFn: ({ id, input }: { id: string; input: Partial<CreateCourseInput> }) =>
      updateCourse(id, input),
    onSuccess: invalidateCourses,
  })

  const deleteMutation = useMutation({
    mutationKey: ['courses', 'delete'],
    mutationFn: (id: string) => deleteCourse(id),
    onSuccess: invalidateCourses,
  })

  return {
    createCourse: (input: CreateCourseInput) => createMutation.mutateAsync(input),
    updateCourse: (id: string, input: Partial<CreateCourseInput>) =>
      updateMutation.mutateAsync({ id, input }),
    deleteCourse: (id: string) => deleteMutation.mutateAsync(id),
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    createError: createMutation.error,
    updateError: updateMutation.error,
  }
}
