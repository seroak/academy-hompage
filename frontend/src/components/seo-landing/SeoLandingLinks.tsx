import Link from 'next/link'
import { seoLandingPages } from './data'

const linkLabels: Record<(typeof seoLandingPages)[number]['slug'], string> = {
  'young-children-math': '흥덕 유아 수학 안내',
  'thinking-math': '흥덕 사고력 수학 안내',
  'elementary-lower-grades': '초등 저학년 수학 안내',
}

export default function SeoLandingLinks({ compact = false }: { compact?: boolean }) {
  return (
    <section
      aria-labelledby={compact ? 'local-course-links-home' : 'local-course-links-courses'}
      className={compact ? 'mx-auto max-w-[1120px] px-5 pb-20 sm:px-8' : 'px-5 py-16 sm:px-8'}
    >
      <div className="mx-auto max-w-[1120px] border-y border-[#eadfc9] py-8">
        <div className="grid gap-6 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
          <div>
            <p className="text-sm font-black text-[#e86f00]">연령과 배움에 맞춘 안내</p>
            <h2
              id={compact ? 'local-course-links-home' : 'local-course-links-courses'}
              className="mt-2 text-[clamp(1.5rem,3vw,2.1rem)] font-black tracking-[-0.04em] text-[#29251e]"
            >
              우리 아이에게 맞는 수학 수업 찾기
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {seoLandingPages.map((page, index) => (
              <Link
                key={page.slug}
                href={`/courses/${page.slug}`}
                className="group flex min-h-28 flex-col justify-between rounded-[20px] border border-[#eadfc9] bg-[#fffdf8] p-5 transition hover:-translate-y-0.5 hover:border-[#f2bd61] hover:bg-[#fff8e9] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#e86f00]"
              >
                <span className="text-xs font-black text-[#b56a15]">0{index + 1}</span>
                <span className="mt-5 text-[15px] font-black leading-6 text-[#393329] group-hover:text-[#c45c00]">
                  {linkLabels[page.slug]}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
