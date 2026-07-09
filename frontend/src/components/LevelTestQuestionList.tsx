import type { QuizQuestion } from '../api/schemas/levelTest.schema'
import { API_BASE_URL } from '../lib/apiClient'

export type AnswerDraft = { selectedChoiceIndex?: number; textAnswer?: string }

interface Props {
  questions: QuizQuestion[]
  answers: Record<string, AnswerDraft>
  onChoiceChange: (questionId: string, selectedChoiceIndex: number) => void
  onTextChange: (questionId: string, textAnswer: string) => void
}

export default function LevelTestQuestionList({ questions, answers, onChoiceChange, onTextChange }: Props) {
  return (
    <div className="flex flex-col gap-4">
      {questions.map((question, index) => (
        <div key={question.id}>
          <p className="text-sm font-medium text-slate-800">
            {index + 1}. {question.prompt}
          </p>
          {question.promptImageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`${API_BASE_URL}${question.promptImageUrl}`}
              alt="문제 이미지"
              className="mt-2 max-h-64 rounded-lg border border-slate-200 object-contain"
            />
          )}
          {question.type === 'MULTIPLE_CHOICE' ? (
            <div className="mt-2 flex flex-col gap-1.5">
              {question.choices.map((choice, choiceIndex) => (
                <label key={choiceIndex} className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="radio"
                    name={question.id}
                    checked={answers[question.id]?.selectedChoiceIndex === choiceIndex}
                    onChange={() => onChoiceChange(question.id, choiceIndex)}
                  />
                  {choice}
                </label>
              ))}
            </div>
          ) : (
            <textarea
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              rows={2}
              value={answers[question.id]?.textAnswer ?? ''}
              onChange={(e) => onTextChange(question.id, e.target.value)}
            />
          )}
        </div>
      ))}
    </div>
  )
}
