import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  createLevelTestQuestion,
  updateLevelTestQuestion,
  deleteLevelTestQuestion,
  upsertLevelTestConfig,
  uploadLevelTestQuestionImage,
} from '../../../api/levelTests.api'
import { queryKeys } from '../../../queries/queryKeys'
import type {
  CreateLevelTestQuestionInput,
  UpsertLevelTestAgeConfigInput,
} from '../../../api/schemas/levelTest.schema'

export function useLevelTestMutations() {
  const queryClient = useQueryClient()

  function invalidateQuestions() {
    return queryClient.invalidateQueries({ queryKey: queryKeys.levelTests.questions.all })
  }

  function invalidateConfigs() {
    return queryClient.invalidateQueries({ queryKey: queryKeys.levelTests.config.all })
  }

  const createMutation = useMutation({
    mutationKey: ['levelTests', 'questions', 'create'],
    mutationFn: (input: CreateLevelTestQuestionInput) => createLevelTestQuestion(input),
    onSuccess: invalidateQuestions,
  })

  const updateMutation = useMutation({
    mutationKey: ['levelTests', 'questions', 'update'],
    mutationFn: ({ id, input }: { id: string; input: Partial<CreateLevelTestQuestionInput> }) =>
      updateLevelTestQuestion(id, input),
    onSuccess: invalidateQuestions,
  })

  const deleteMutation = useMutation({
    mutationKey: ['levelTests', 'questions', 'delete'],
    mutationFn: (id: string) => deleteLevelTestQuestion(id),
    onSuccess: invalidateQuestions,
  })

  const upsertConfigMutation = useMutation({
    mutationKey: ['levelTests', 'config', 'upsert'],
    mutationFn: ({ age, input }: { age: number; input: UpsertLevelTestAgeConfigInput }) =>
      upsertLevelTestConfig(age, input),
    onSuccess: invalidateConfigs,
  })

  const uploadImageMutation = useMutation({
    mutationKey: ['levelTests', 'questions', 'upload-image'],
    mutationFn: (file: File) => uploadLevelTestQuestionImage(file),
  })

  return {
    createQuestion: (input: CreateLevelTestQuestionInput) => createMutation.mutateAsync(input),
    updateQuestion: (id: string, input: Partial<CreateLevelTestQuestionInput>) =>
      updateMutation.mutateAsync({ id, input }),
    deleteQuestion: (id: string) => deleteMutation.mutateAsync(id),
    upsertConfig: (age: number, input: UpsertLevelTestAgeConfigInput) =>
      upsertConfigMutation.mutateAsync({ age, input }),
    uploadQuestionImage: (file: File) => uploadImageMutation.mutateAsync(file),
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isUpsertingConfig: upsertConfigMutation.isPending,
    isUploadingImage: uploadImageMutation.isPending,
    createError: createMutation.error,
    updateError: updateMutation.error,
    uploadImageError: uploadImageMutation.error,
  }
}
