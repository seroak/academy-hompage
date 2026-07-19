import { ChevronRight } from 'lucide-react'
import { programs, toneClasses } from './data'

const rows = [
  { label: '핵심 철학', value: (index: number) => programs[index].philosophy },
  { label: '추천 대상', value: (index: number) => programs[index].audience },
  { label: '수업 방식', value: (index: number) => programs[index].method },
  { label: '주요 특징', value: (index: number) => programs[index].strength },
  { label: '추천 포인트', value: (index: number) => programs[index].benefits[0] },
  { label: '난이도', value: (index: number) => <Difficulty level={programs[index].difficulty} label={programs[index].difficultyLabel} tone={programs[index].tone} /> },
  { label: '교구 활용', value: (index: number) => <Difficulty level={programs[index].materialScore} label="활용도" tone={programs[index].tone} /> },
  { label: '교과 연계', value: (index: number) => <Difficulty level={programs[index].curriculumScore} label="연계도" tone={programs[index].tone} /> },
  { label: '사고력', value: (index: number) => <Difficulty level={programs[index].thinkingScore} label="강화" tone={programs[index].tone} /> },
]

function Difficulty({ level, label, tone }: { level: number; label: string; tone: keyof typeof toneClasses }) {
  const styles = toneClasses[tone]
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <span className="flex gap-1" aria-label={`난이도 5단계 중 ${level}단계`}>
        {Array.from({ length: 5 }, (_, index) => <span key={index} className={`size-2.5 rounded-full ${index < level ? styles.fill : 'bg-[#e6dfd3]'}`} />)}
      </span>
      <span className={`text-xs font-bold ${styles.text}`}>{label}</span>
    </div>
  )
}

export default function ComparisonTable() {
  return (
    <section className="py-12 sm:py-15">
      <div className="text-center">
        <p className="text-xs font-bold tracking-[0.06em] text-[#e86f00]">PROGRAM COMPARISON</p>
        <h2 className="mt-2 text-[clamp(1.625rem,2.8vw,2.25rem)] font-bold tracking-[-0.045em] text-[#222222]">3가지 프로그램, 한눈에 비교해 보세요</h2>
        <p className="mt-2 text-sm font-medium text-[#6a6256]">아이의 현재 흥미와 학습 목표에 맞는 시작점을 찾아보세요.</p>
      </div>
      <div className="mt-5 flex items-center justify-center gap-1 text-xs font-semibold text-[#a17832] lg:hidden">
        <ChevronRight className="rotate-180" size={16} /> 좌우로 밀어 비교하기 <ChevronRight size={16} />
      </div>
      <div className="relative mt-5 overflow-hidden rounded-[22px] border border-[#eadfc9] bg-white shadow-[0_12px_34px_rgba(95,67,18,0.06)]">
        <div className="pointer-events-none absolute inset-y-0 right-0 z-20 w-10 bg-gradient-to-l from-[#fff9ec] to-transparent lg:hidden" />
        <div className="overflow-x-auto overscroll-x-contain">
          <table className="min-w-[860px] w-full border-collapse text-center">
            <caption className="sr-only">플레이팩토, 요리수 연산, 씨투엠의 교육 과정 비교표</caption>
            <thead>
              <tr className="border-b border-[#eadfc9]">
                <th scope="col" className="sticky left-0 z-10 w-[150px] bg-[#fff9ec] px-5 py-5 text-left text-sm font-bold text-[#514839]">비교 항목</th>
                {programs.map((program) => {
                  const style = toneClasses[program.tone]
                  return (
                    <th key={program.name} scope="col" className={`min-w-[230px] border-l border-white/70 px-4 py-4 ${style.surface}`}>
                      <span className={`text-base font-bold ${style.text}`}>{program.name}</span>
                      <p className="mt-1.5 text-[11px] font-medium text-[#675f54]">{program.keyword}</p>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={row.label} className={rowIndex < rows.length - 1 ? 'border-b border-[#eee6d9]' : ''}>
                  <th scope="row" className="sticky left-0 z-10 bg-[#fffdf9] px-5 py-4 text-left text-sm font-bold text-[#4e473c]">
                    {row.label}
                  </th>
                  {programs.map((program, index) => <td key={program.name} className="border-l border-[#f1eadf] px-4 py-4 text-[13px] font-medium leading-5 text-[#4e473c]">{row.value(index)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
