import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, CalendarCheck, ClipboardCheck } from 'lucide-react'
import { recommendations, toneClasses } from './data'

export default function RecommendationCta() {
  return (
    <section className="py-12 sm:py-15">
      <div className="text-center">
        <p className="text-xs font-bold tracking-[0.06em] text-[#e86f00]">WHO IS IT FOR?</p>
        <h2 className="mt-2 text-[clamp(1.625rem,2.8vw,2.25rem)] font-bold tracking-[-0.045em] text-[#222222]">이런 아이에게 추천합니다</h2>
      </div>
      <div className="mt-7 grid gap-3 lg:grid-cols-3">
        {recommendations.map((recommendation) => {
          const style = toneClasses[recommendation.tone]
          return (
            <article key={recommendation.program} className={`flex min-h-[168px] flex-col rounded-[22px] border ${style.border} ${style.surface} p-5`}>
              <div className="grid grid-cols-[104px_1fr] gap-4">
                <div className="relative h-28 overflow-hidden rounded-[16px] bg-white">
                  <Image src={recommendation.imageSrc} alt={`${recommendation.program} 추천 활동`} fill sizes="104px" className="object-cover" />
                </div>
                <div>
                  <p className={`text-[11px] font-bold tracking-[0.06em] ${style.text}`}>{recommendation.program}</p>
                  <h3 className="mt-2 text-base font-bold leading-5 tracking-[-0.035em] text-[#2b271f]">{recommendation.title}</h3>
                  <p className="mt-1.5 text-[13px] font-medium text-[#6a6256]">{recommendation.description}</p>
                  <Link href="/apply" className={`inline-flex items-center gap-1 pt-3 text-sm font-bold ${style.text}`}>{recommendation.program} 상담 <ArrowRight size={15} strokeWidth={2.6} /></Link>
                </div>
              </div>
            </article>
          )
        })}
      </div>
      <div className="relative mt-8 overflow-hidden rounded-[24px] bg-[linear-gradient(110deg,#fff6da_0%,#ffe7a5_100%)] px-6 py-7 sm:px-8 lg:grid lg:grid-cols-[180px_1fr_auto] lg:items-center lg:gap-8 lg:px-10">
        <div className="relative hidden h-32 overflow-hidden rounded-[18px] bg-white/35 lg:block">
          <Image src="/images/math/consultation-still-life.png" alt="연필과 책이 놓인 학습 도구" fill sizes="180px" className="object-cover" />
        </div>
        <div className="relative">
          <p className="text-xs font-bold tracking-[0.06em] text-[#dc7200]">1:1 MATH CONSULTING</p>
          <h2 className="mt-2 text-xl font-bold tracking-[-0.045em] text-[#292317] sm:text-2xl">우리 아이는 어떤 과정이 맞을까요?</h2>
          <p className="mt-2 max-w-xl text-sm font-medium leading-6 text-[#625845]">전문 선생님의 1:1 상담과 레벨 테스트로 아이에게 꼭 맞는 수학 교육을 제안해드립니다.</p>
        </div>
        <div className="relative mt-5 grid gap-2.5 sm:grid-cols-2 lg:mt-0 lg:grid-cols-1">
          <Link href="/apply" className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#ff9f00] px-6 text-sm font-bold text-[#2c2518] shadow-[0_8px_16px_rgba(202,130,0,0.16)] transition hover:-translate-y-0.5 hover:bg-[#f08e00]"><CalendarCheck size={17} strokeWidth={2.6} />상담 예약하기<ArrowRight size={16} strokeWidth={2.8} /></Link>
          <Link href="/level-test" className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-[#e8a319] bg-[#fffaf0] px-6 text-sm font-bold text-[#70500b] transition hover:-translate-y-0.5 hover:bg-white"><ClipboardCheck size={17} strokeWidth={2.5} />무료 레벨 테스트 신청</Link>
        </div>
      </div>
    </section>
  )
}
