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
  LevelTestAgeConfig,
  LevelTestQuestion,
  UpsertLevelTestAgeConfigInput,
} from '../../../api/schemas/levelTest.schema'
import { nowIso, optimisticId, restoreQuerySnapshots, snapshotQueryLists, updateCachedLists } from '../../../queries/optimisticCache'

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
    onMutate: async (input) => {
      const snapshots = await snapshotQueryLists<LevelTestQuestion>(queryClient, queryKeys.levelTests.questions.all)
      const question: LevelTestQuestion = {
        id: optimisticId('level-test-question'),
        age: input.age,
        type: input.type,
        prompt: input.prompt,
        promptImageUrl: input.promptImageUrl ?? null,
        choices: input.choices ?? [],
        correctChoiceIndex: input.correctChoiceIndex ?? null,
        active: input.active ?? true,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      }
      updateCachedLists<LevelTestQuestion>(queryClient, queryKeys.levelTests.questions.all, (questions, key) => {
        const age = key[2]
        return age === null || age === question.age ? [question, ...questions] : questions
      })
      return { snapshots, optimisticId: question.id }
    },
    onError: (_error, _input, context) => {
      if (!context) return
      restoreQuerySnapshots(queryClient, context.snapshots)
    },
    onSuccess: (question, _input, context) => updateCachedLists<LevelTestQuestion>(queryClient, queryKeys.levelTests.questions.all, (questions) => questions.map((item) => item.id === context?.optimisticId ? question : item)),
    onSettled: invalidateQuestions,
  })

  const updateMutation = useMutation({
    mutationKey: ['levelTests', 'questions', 'update'],
    mutationFn: ({ id, input }: { id: string; input: Partial<CreateLevelTestQuestionInput> }) =>
      updateLevelTestQuestion(id, input),
    onMutate: async ({ id, input }) => {
      const snapshots = await snapshotQueryLists<LevelTestQuestion>(queryClient, queryKeys.levelTests.questions.all)
      updateCachedLists<LevelTestQuestion>(queryClient, queryKeys.levelTests.questions.all, (questions) => questions.map((question) => question.id === id ? { ...question, ...input, updatedAt: nowIso() } : question))
      return { snapshots }
    },
    onError: (_error, _variables, context) => {
      if (!context) return
      restoreQuerySnapshots(queryClient, context.snapshots)
    },
    onSuccess: (question) => updateCachedLists<LevelTestQuestion>(queryClient, queryKeys.levelTests.questions.all, (questions) => questions.map((item) => item.id === question.id ? question : item)),
    onSettled: invalidateQuestions,
  })

  const deleteMutation = useMutation({
    mutationKey: ['levelTests', 'questions', 'delete'],
    mutationFn: (id: string) => deleteLevelTestQuestion(id),
    onMutate: async (id) => {
      const snapshots = await snapshotQueryLists<LevelTestQuestion>(queryClient, queryKeys.levelTests.questions.all)
      updateCachedLists<LevelTestQuestion>(queryClient, queryKeys.levelTests.questions.all, (questions) => questions.filter((question) => question.id !== id))
      return { snapshots }
    },
    onError: (_error, _id, context) => {
      if (!context) return
      restoreQuerySnapshots(queryClient, context.snapshots)
    },
    onSettled: invalidateQuestions,
  })

  const upsertConfigMutation = useMutation({
    mutationKey: ['levelTests', 'config', 'upsert'],
    mutationFn: ({ age, input }: { age: number; input: UpsertLevelTestAgeConfigInput }) =>
      upsertLevelTestConfig(age, input),
    onMutate: async ({ age, input }) => {
      const snapshots = await snapshotQueryLists<LevelTestAgeConfig>(queryClient, queryKeys.levelTests.config.all)
      const config: LevelTestAgeConfig = { age, drawCount: input.drawCount, updatedAt: nowIso() }
      updateCachedLists<LevelTestAgeConfig>(queryClient, queryKeys.levelTests.config.all, (configs) => {
        const found = configs.some((item) => item.age === age)
        return found ? configs.map((item) => item.age === age ? config : item) : [...configs, config]
      })
      return { snapshots }
    },
    onError: (_error, _variables, context) => {
      if (!context) return
      restoreQuerySnapshots(queryClient, context.snapshots)
    },
    onSuccess: (config) => updateCachedLists<LevelTestAgeConfig>(queryClient, queryKeys.levelTests.config.all, (configs) => {
      const found = configs.some((item) => item.age === config.age)
      return found ? configs.map((item) => item.age === config.age ? config : item) : [...configs, config]
    }),
    onSettled: invalidateConfigs,
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
