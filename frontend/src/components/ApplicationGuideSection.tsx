'use client'

import Link from 'next/link'
import { CalendarDays, ChevronRight, MailCheck, UserRoundPen } from 'lucide-react'
import { motion } from 'framer-motion'
import ChildSelectPreview from './application-guide/ChildSelectPreview'
import TimeSelectPreview from './application-guide/TimeSelectPreview'
import ResultPreview from './application-guide/ResultPreview'

const steps = [
  {
    number: '01',
    title: '자녀 선택',
    description: '신청할 자녀를 선택해요.',
    icon: UserRoundPen,
    color: 'bg-[#fff0e4] text-[#e86f00]',
    Preview: ChildSelectPreview,
  },
  {
    number: '02',
    title: '희망 시간 선택',
    description: '가능한 요일과 시간을 골라요.',
    icon: CalendarDays,
    color: 'bg-[#eaf5ff] text-[#438cc9]',
    Preview: TimeSelectPreview,
  },
  {
    number: '03',
    title: '편성 결과 안내',
    description: '편성 결과는 이메일로 안내해 드려요.',
    icon: MailCheck,
    color: 'bg-[#eaf8eb] text-[#499e58]',
    Preview: ResultPreview,
  },
]

export default function ApplicationGuideSection() {
  return (
    <section className="mx-auto max-w-[1120px] px-5 py-16 sm:px-8 sm:py-24">
      <div className="relative overflow-hidden rounded-[36px] bg-[#fff5dc] px-6 py-10 sm:px-10 lg:px-12 lg:py-14">
        <div className="absolute -left-12 top-12 size-32 rounded-full bg-[#ffd66b]/35" />
        <div className="absolute -bottom-20 right-8 size-48 rounded-full bg-[#6bcb77]/20" />

        <div className="relative z-10 max-w-2xl">
          <p className="text-sm font-black text-[#e86f00]">처음이라도 간단하게</p>
          <h2 className="mt-3 text-3xl font-black leading-tight tracking-[-0.02em] text-[#222222] sm:text-4xl">
            수업 신청, 이렇게 진행돼요
          </h2>
          <p className="mt-4 max-w-xl text-base font-semibold leading-8 text-[#625845]">
            아이 정보와 원하는 시간을 남겨주시면, 맞는 반 편성 결과를 이메일로 안내해 드려요.
          </p>
        </div>

        <ol className="relative z-10 mt-10 grid gap-4 lg:grid-cols-3 lg:gap-5">
          {steps.map((step, index) => {
            const Icon = step.icon
            const Preview = step.Preview

            return (
              <motion.li
                key={step.number}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ delay: index * 0.08, duration: 0.4, ease: 'easeOut' }}
                className="relative rounded-[26px] border border-[#f2dfb9] bg-[#fffdf7] p-6"
              >
                <Preview />
                <div className="flex items-start justify-between gap-4">
                  <span className="mt-5 text-sm font-black tracking-[0.12em] text-[#b99b64]">{step.number}</span>
                  <span className={`mt-4 grid size-11 place-items-center rounded-full ${step.color}`}>
                    <Icon size={22} strokeWidth={2.4} aria-hidden="true" />
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-black text-[#222222]">{step.title}</h3>
                <p className="mt-2 text-sm font-medium leading-6 text-[#625845]">{step.description}</p>
              </motion.li>
            )
          })}
        </ol>

        <div className="relative z-10 mt-10 flex flex-col gap-4 border-t border-[#ead8af] pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold leading-6 text-[#625845]">지금 모집 중인 반이 있다면 바로 합류도 신청할 수 있어요.</p>
          <Link
            href="/apply"
            className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-[#ff8a1f] px-6 text-sm font-black text-white shadow-[0_14px_28px_rgba(255,138,31,0.24)] transition duration-250 hover:-translate-y-0.5 hover:bg-[#f07800] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e86f00]"
          >
            수업 신청하기
            <ChevronRight size={18} strokeWidth={2.8} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  )
}
