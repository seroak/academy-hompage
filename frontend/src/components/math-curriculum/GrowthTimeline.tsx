import { growthSteps } from './data'

function StageIllustration({ step }: { step: number }) {
  const color = ['#ef8b2c', '#f2aa1f', '#55a979', '#5a9cda', '#dc9f27'][step]
  const shapes = [
    <><rect x="14" y="32" width="22" height="22" rx="3" fill={color} opacity=".9" /><rect x="37" y="18" width="18" height="36" rx="3" fill="#70b984" /><path d="M19 29 28 14l9 15Z" fill="#f4bd42" /></>,
    <><circle cx="34" cy="34" r="15" fill="none" stroke={color} strokeWidth="4" /><path d="M34 7v7M34 54v7M7 34h7M54 34h7M15 15l5 5M48 48l5 5M53 15l-5 5M20 48l-5 5" stroke={color} strokeWidth="3" strokeLinecap="round" /></>,
    <><path d="M19 42c-7-18 3-30 15-30s22 12 15 30" fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" /><path d="M29 24c-6 4-5 13 1 15m5-17c6 4 5 13-1 15m-8 4c4 5 10 5 15 0" fill="none" stroke="#efb339" strokeWidth="3" strokeLinecap="round" /></>,
    <><path d="M15 18c10-5 20-4 19 4v31c-5-7-13-8-19-4V18Zm38 0c-10-5-20-4-19 4v31c5-7 13-8 19-4V18Z" fill="none" stroke={color} strokeWidth="4" strokeLinejoin="round" /><path d="M21 28h8m-8 8h8m14-8h-8m8 8h-8" stroke="#efb339" strokeWidth="3" strokeLinecap="round" /></>,
    <><path d="m18 18 16-8 16 8v19c0 11-7 18-16 21-9-3-16-10-16-21V18Z" fill="none" stroke={color} strokeWidth="4" strokeLinejoin="round" /><path d="m27 34 5 5 10-12" fill="none" stroke="#efb339" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" /></>,
  ]
  return <svg viewBox="0 0 68 68" aria-hidden="true" className="size-12">{shapes[step]}</svg>
}

export default function GrowthTimeline() {
  return (
    <section className="rounded-[24px] bg-[#fff5df] px-5 py-10 sm:px-8 lg:px-10 lg:py-12">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-bold tracking-[0.06em] text-[#e86f00]">GROWTH JOURNEY</p>
        <h2 className="mt-2 text-[clamp(1.625rem,2.8vw,2.25rem)] font-bold tracking-[-0.045em] text-[#222222]">생각을 여는 수학은 이렇게 성장합니다</h2>
        <p className="mt-2 text-sm font-medium leading-6 text-[#6a6256]">재미있게 시작한 수학 경험이 스스로 생각하고 해결하는 힘으로 자라납니다.</p>
      </div>
      <ol className="mx-auto mt-8 grid max-w-[1020px] gap-6 sm:grid-cols-2 lg:grid-cols-5 lg:gap-0">
        {growthSteps.map((step, index) => {
          return (
            <li key={step.title} className="relative flex gap-3 lg:block lg:px-3 lg:text-center">
              {index < growthSteps.length - 1 && <span aria-hidden="true" className="absolute left-6 top-6 h-px w-7 bg-[#f2d486] sm:left-6 sm:w-12 lg:left-[calc(50%+2.2rem)] lg:top-6 lg:w-[calc(100%-4.4rem)]" />}
              <span className="relative z-10 grid size-12 shrink-0 place-items-center rounded-full bg-[#fffaf0] shadow-[0_6px_14px_rgba(128,91,21,0.07)] lg:mx-auto"><StageIllustration step={index} /></span>
              <div className="pt-0.5 lg:pt-3">
                <p className="text-[11px] font-bold text-[#e86f00]">0{index + 1}</p>
                <h3 className="mt-0.5 text-base font-bold text-[#2b271f]">{step.title}</h3>
                <p className="mt-1 text-[13px] font-medium leading-5 text-[#72695b]">{step.description}</p>
              </div>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
