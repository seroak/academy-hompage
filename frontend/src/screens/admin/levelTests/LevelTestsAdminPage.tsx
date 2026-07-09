'use client'

import { useState } from 'react'
import { useLevelTestQuestionsQuery } from '../hooks/useLevelTestQuestionsQuery'
import { useLevelTestConfigsQuery } from '../hooks/useLevelTestConfigsQuery'
import { useLevelTestResultsQuery } from '../hooks/useLevelTestResultsQuery'
import { useLevelTestMutations } from '../hooks/useLevelTestMutations'
import { CreateLevelTestQuestionInputSchema, type LevelTestQuestion, type LevelTestResult } from '../../../api/schemas/levelTest.schema'
import { emptyQuestionForm, type QuestionFormState } from './types'
import QuestionForm from './components/QuestionForm'
import QuestionList from './components/QuestionList'
import AgeConfigPanel from './components/AgeConfigPanel'
import ResultsList from './components/ResultsList'
import ResultDetailModal from './components/ResultDetailModal'

const TABS = [
  { id: 'questions', label: '문제 관리' },
  { id: 'results', label: '결과 조회' },
] as const

type Tab = (typeof TABS)[number]['id']

function tabButtonClass(isActive: boolean) {
  return `rounded-full px-4 py-2 text-sm font-black transition ${
    isActive ? 'bg-[#e86f00] text-white' : 'border border-[#f2dfb9] bg-white text-[#6f6253] hover:bg-[#fff9ec]'
  }`
}

export default function LevelTestsAdminPage() {
  const [tab, setTab] = useState<Tab>('questions')
  const [ageFilter, setAgeFilter] = useState<number | undefined>(undefined)
  const [form, setForm] = useState<QuestionFormState>(emptyQuestionForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [selectedResult, setSelectedResult] = useState<LevelTestResult | null>(null)

  const { questions, isLoading: isLoadingQuestions } = useLevelTestQuestionsQuery(ageFilter)
  const { configs } = useLevelTestConfigsQuery()
  const { results, isLoading: isLoadingResults } = useLevelTestResultsQuery()
  const {
    createQuestion,
    updateQuestion,
    deleteQuestion,
    upsertConfig,
    isCreating,
    isUpdating,
    isUpsertingConfig,
  } = useLevelTestMutations()

  function startEdit(question: LevelTestQuestion) {
    setEditingId(question.id)
    setForm({
      age: question.age,
      type: question.type,
      prompt: question.prompt,
      choices: question.choices.length > 0 ? question.choices : ['', ''],
      correctChoiceIndex: question.correctChoiceIndex ?? 0,
      active: question.active,
    })
    setFieldErrors({})
  }

  function cancelEdit() {
    setEditingId(null)
    setForm(emptyQuestionForm)
    setFieldErrors({})
  }

  async function handleSubmit() {
    const result = CreateLevelTestQuestionInputSchema.safeParse(form)
    if (!result.success) {
      const errors: Record<string, string> = {}
      for (const issue of result.error.issues) {
        errors[String(issue.path[0])] = issue.message
      }
      setFieldErrors(errors)
      return
    }
    setFieldErrors({})

    try {
      if (editingId) {
        await updateQuestion(editingId, result.data)
      } else {
        await createQuestion(result.data)
      }
      cancelEdit()
    } catch {
      window.alert('문항 저장에 실패했습니다.')
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('이 문항을 삭제하시겠습니까?')) return
    try {
      await deleteQuestion(id)
    } catch {
      window.alert('문항을 삭제하지 못했습니다.')
    }
  }

  async function handleSaveConfig(age: number, drawCount: number) {
    try {
      await upsertConfig(age, { drawCount })
    } catch {
      window.alert('출제 수 설정을 저장하지 못했습니다.')
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-black text-[#222222]">레벨테스트 관리</h1>
      <p className="mt-2 text-sm font-semibold text-[#6f6253]">
        나이별 문제를 등록해 두면, 학부모가 예약 전 응시할 때 설정한 수만큼 무작위로 출제됩니다.
      </p>

      <div className="mt-6 flex gap-2">
        {TABS.map((item) => (
          <button key={item.id} type="button" onClick={() => setTab(item.id)} className={tabButtonClass(tab === item.id)}>
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'questions' && (
        <>
          <QuestionForm
            form={form}
            onChange={setForm}
            fieldErrors={fieldErrors}
            editingId={editingId}
            onSubmit={handleSubmit}
            onCancel={cancelEdit}
            isSubmitting={isCreating || isUpdating}
          />
          <AgeConfigPanel configs={configs} onSave={handleSaveConfig} isSaving={isUpsertingConfig} />
          {isLoadingQuestions ? (
            <p className="mt-6 text-sm font-semibold text-[#6f6253]">불러오는 중...</p>
          ) : (
            <QuestionList
              questions={questions}
              ageFilter={ageFilter}
              onAgeFilterChange={setAgeFilter}
              onEdit={startEdit}
              onDelete={handleDelete}
            />
          )}
        </>
      )}

      {tab === 'results' && (
        <>
          {isLoadingResults ? (
            <p className="mt-6 text-sm font-semibold text-[#6f6253]">불러오는 중...</p>
          ) : (
            <ResultsList results={results} onSelect={setSelectedResult} />
          )}
          <ResultDetailModal result={selectedResult} onClose={() => setSelectedResult(null)} />
        </>
      )}
    </div>
  )
}
