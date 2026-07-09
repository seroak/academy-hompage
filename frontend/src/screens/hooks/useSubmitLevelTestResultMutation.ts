import { useMutation } from '@tanstack/react-query'
import { submitLevelTestResult } from '../../api/levelTests.api'
import type { SubmitLevelTestResultInput } from '../../api/schemas/levelTest.schema'

export function useSubmitLevelTestResultMutation() {
  const mutation = useMutation({
    mutationKey: ['levelTests', 'submit'],
    mutationFn: (input: SubmitLevelTestResultInput) => submitLevelTestResult(input),
  })

  return {
    submit: (input: SubmitLevelTestResultInput) => mutation.mutateAsync(input),
    isSubmitting: mutation.isPending,
    isSuccess: mutation.isSuccess,
    reset: mutation.reset,
  }
}
