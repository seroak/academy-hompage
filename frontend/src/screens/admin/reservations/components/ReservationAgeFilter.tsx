import { CHILD_AGE_OPTIONS } from '../utils/reservationAdminUtils'
import { fieldClass, labelClass } from '../styles'

type Props = {
  ageFilter: number | undefined
  onChangeAgeFilter: (age: number | undefined) => void
}

export default function ReservationAgeFilter({ ageFilter, onChangeAgeFilter }: Props) {
  return (
    <section className="flex flex-col gap-3 rounded-[24px] border border-[#f2dfb9] bg-white p-5 shadow-[0_14px_36px_rgba(95,67,18,0.07)] sm:flex-row sm:items-end sm:justify-between">
      <label className={labelClass}>
        나이 필터
        <select
          className={fieldClass}
          value={ageFilter ?? ''}
          onChange={(e) => onChangeAgeFilter(e.target.value ? Number(e.target.value) : undefined)}
        >
          <option value="">전체</option>
          {CHILD_AGE_OPTIONS.map((age) => (
            <option key={age} value={age}>
              만 {age}세
            </option>
          ))}
        </select>
      </label>
      <p className="max-w-xl text-sm font-semibold leading-6 text-[#6f6253]">
        선택한 나이에 맞는 신청만 시간표에 표시됩니다.
      </p>
    </section>
  )
}
