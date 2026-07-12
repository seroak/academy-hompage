import Link from 'next/link'
import Layout from '../Layout'
import type { SeoLandingContent } from './data'

const toneClasses = {
  sun: { surface: 'bg-[#fff1c7]', label: 'text-[#b85b00]', marker: 'bg-[#ffc84a]' },
  leaf: { surface: 'bg-[#e8f5df]', label: 'text-[#407034]', marker: 'bg-[#91c76e]' },
  sky: { surface: 'bg-[#e7f2fb]', label: 'text-[#356c99]', marker: 'bg-[#79b6e4]' },
}

export default function SeoLandingPage({ content }: { content: SeoLandingContent }) {
  const tone = toneClasses[content.tone]

  return (
    <Layout variant="landing">
      <main className="overflow-hidden bg-[#fffaf0] text-[#29251e]">
        <section className="relative px-5 pb-16 pt-20 sm:px-8 sm:pb-24 sm:pt-28">
          <div className={`absolute inset-x-0 top-0 h-72 ${tone.surface}`} aria-hidden="true" />
          <div className="relative mx-auto grid max-w-[1120px] gap-12 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div>
              <p className={`text-sm font-black ${tone.label}`}>{content.eyebrow}</p>
              <h1 className="mt-4 max-w-[16ch] text-[clamp(2.5rem,6vw,5.1rem)] font-black leading-[1.04] tracking-[-0.06em] text-[#242019]">
                {content.title}
              </h1>
            </div>
            <div className="max-w-[38rem] lg:pb-2">
              <span className={`block h-2 w-20 rounded-full ${tone.marker}`} aria-hidden="true" />
              <p className="mt-6 text-[17px] font-semibold leading-8 text-[#655d51]">{content.intro}</p>
              <p className="mt-5 text-sm font-black text-[#8a5d22]">용인시 기흥구 흥덕 · 유아 및 초등 저학년</p>
            </div>
          </div>
        </section>

        <section aria-labelledby="lesson-flow" className="mx-auto max-w-[1120px] px-5 py-16 sm:px-8 sm:py-24">
          <div className="grid gap-12 lg:grid-cols-[0.68fr_1.32fr]">
            <div>
              <p className={`text-sm font-black ${tone.label}`}>수업에서 만나는 세 가지 경험</p>
              <h2 id="lesson-flow" className="mt-3 text-[clamp(1.9rem,4vw,3rem)] font-black leading-tight tracking-[-0.05em]">
                이해하는 순간을
                <br />차곡차곡 쌓습니다
              </h2>
            </div>
            <ol className="divide-y divide-[#e7dece] border-y border-[#e7dece]">
              {content.features.map((feature, index) => (
                <li key={feature.title} className="grid gap-3 py-7 sm:grid-cols-[3rem_0.8fr_1.2fr] sm:items-start sm:gap-6">
                  <span className={`text-sm font-black ${tone.label}`}>0{index + 1}</span>
                  <h3 className="text-lg font-black tracking-[-0.025em]">{feature.title}</h3>
                  <p className="max-w-[48ch] text-[15px] font-medium leading-7 text-[#6a6256]">{feature.description}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className={`${tone.surface} px-5 py-16 sm:px-8 sm:py-24`} aria-labelledby="recommended-for">
          <div className="mx-auto grid max-w-[1120px] gap-12 lg:grid-cols-2">
            <div>
              <p className={`text-sm font-black ${tone.label}`}>이런 아이에게 권합니다</p>
              <h2 id="recommended-for" className="mt-3 text-[clamp(1.9rem,4vw,3rem)] font-black tracking-[-0.05em]">
                아이의 현재 모습에서
                <br />수업을 시작합니다
              </h2>
            </div>
            <ul className="space-y-3">
              {content.recommendedFor.map((item, index) => (
                <li key={item} className="flex gap-4 border-b border-[#d9ceb9] py-4 text-[16px] font-bold leading-7 text-[#4b443a]">
                  <span className={`shrink-0 ${tone.label}`}>{index + 1}</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mx-auto max-w-[1120px] px-5 py-20 sm:px-8 sm:py-28" aria-labelledby="connected-programs">
          <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className={`text-sm font-black ${tone.label}`}>연계 프로그램</p>
              <h2 id="connected-programs" className="mt-3 text-[clamp(1.9rem,4vw,3rem)] font-black tracking-[-0.05em]">
                {content.programs.join(' · ')}
              </h2>
              <p className="mt-5 max-w-[58ch] text-[16px] font-medium leading-8 text-[#6a6256]">
                아이의 연령과 현재 이해 수준을 살펴본 뒤 알맞은 프로그램과 수업 흐름을 상담합니다.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/courses" className="inline-flex h-12 items-center justify-center rounded-full border border-[#d7c8ad] px-6 text-sm font-black text-[#4d4437] transition hover:bg-[#f7eddb]">
                전체 교육과정 보기
              </Link>
              <Link href="/apply" className="inline-flex h-12 items-center justify-center rounded-full bg-[#29251e] px-6 text-sm font-black text-[#fffaf0] transition hover:-translate-y-0.5 hover:bg-[#c45c00]">
                수업 상담 신청하기
              </Link>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  )
}
