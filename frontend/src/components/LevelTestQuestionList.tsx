import type { QuizQuestion } from '../api/schemas/levelTest.schema'
import { API_BASE_URL } from '../lib/apiClient'

export type AnswerDraft = { selectedChoiceIndex?: number; textAnswer?: string }

interface Props {
  questions: QuizQuestion[]
  answers: Record<string, AnswerDraft>
  onChoiceChange: (questionId: string, selectedChoiceIndex: number) => void
  onTextChange: (questionId: string, textAnswer: string) => void
  /** 관리자 미리보기 전용: 넘기면 해당 문항의 정답 보기를 하이라이트한다. 응시 화면에서는 사용하지 않는다. */
  correctChoiceIndexByQuestionId?: Record<string, number | null | undefined>
}

export default function LevelTestQuestionList({
  questions,
  answers,
  onChoiceChange,
  onTextChange,
  correctChoiceIndexByQuestionId,
}: Props) {
  return (
    <div className="flex flex-col gap-4">
      {questions.map((question, index) => (
        <div key={question.id}>
          <p className="text-sm font-black text-[#3f3a31]">
            {index + 1}. {question.prompt}
          </p>
          {question.promptImageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`${API_BASE_URL}${question.promptImageUrl}`}
              alt="문제 이미지"
              className="mt-2 max-h-64 rounded-2xl border border-[#f2dfb9] object-contain"
            />
          )}
          {question.type === 'MULTIPLE_CHOICE' ? (
            <div className="mt-2 flex flex-col gap-1.5">
              {question.choices.map((choice, choiceIndex) => {
                const isCorrect = correctChoiceIndexByQuestionId?.[question.id] === choiceIndex
                return (
                  <label
                    key={choiceIndex}
                    className={`flex items-center gap-2 text-sm ${isCorrect ? 'font-black text-[#2f7a3d]' : 'font-semibold text-[#3f3a31]'}`}
                  >
                    <input
                      type="radio"
                      name={question.id}
                      checked={answers[question.id]?.selectedChoiceIndex === choiceIndex}
                      onChange={() => onChoiceChange(question.id, choiceIndex)}
                    />
                    {choice}
                    {isCorrect && (
                      <span className="rounded-full bg-[#eaf7ea] px-2 py-0.5 text-xs font-black text-[#2f7a3d]">
                        정답
                      </span>
                    )}
                  </label>
                )
              })}
            </div>
          ) : (
            <textarea
              className="mt-2 w-full rounded-2xl border border-[#f2dfb9] bg-[#fffdf8] px-4 py-2.5 text-sm font-semibold text-[#3f3a31] outline-none transition focus:border-[#ff8a1f]"
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
