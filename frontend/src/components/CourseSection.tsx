'use client'

import { motion } from 'framer-motion'
import { BookMarked, Brain, MessageCircleHeart, Shapes } from 'lucide-react'
import SeoLandingLinks from './seo-landing/SeoLandingLinks'

const courses = [
  {
    title: '유치부 과정',
    description: '놀이와 이야기로 한글, 수, 표현력을 자연스럽게 익힙니다.',
    icon: Shapes,
    color: 'bg-[#fff3c8] text-[#f2a900]',
  },
  {
    title: '초등 저학년 과정',
    description: '학교 수업을 자신 있게 따라가는 기초 학습 루틴을 만듭니다.',
    icon: BookMarked,
    color: 'bg-[#e7f4ff] text-[#5dadec]',
  },
  {
    title: '창의 사고 과정',
    description: '관찰, 비교, 질문으로 스스로 생각하는 힘을 키웁니다.',
    icon: Brain,
    color: 'bg-[#e9f9ec] text-[#6bcb77]',
  },
  {
    title: '독서 표현 과정',
    description: '읽고 말하고 쓰는 경험으로 자기표현을 탄탄하게 합니다.',
    icon: MessageCircleHeart,
    color: 'bg-[#fff0e4] text-[#ff8a1f]',
  },
]

export default function CourseSection() {
  return (
    <>
    <section className="mx-auto max-w-[1120px] px-5 pb-8 pt-24 sm:px-8">
      <div className="grid gap-8 lg:grid-cols-[0.86fr_1.14fr] lg:items-end">
        <div>
          <p className="text-sm font-black text-[#ff8a1f]">교육 과정</p>
          <h2 className="mt-3 text-3xl font-black leading-tight tracking-[-0.02em] text-[#222222] sm:text-4xl">
            아이의 속도에 맞춘
            <br />
            따뜻한 배움 설계
          </h2>
        </div>
        <p className="max-w-2xl text-base font-semibold leading-8 text-[#666666]">
          놀이형 탐색에서 학교 준비 학습까지 이어지는 흐름으로, 아이가 부담 없이 몰입하고
          부모님은 성장 과정을 분명하게 확인할 수 있게 구성했습니다.
        </p>
      </div>

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {courses.map((course, index) => {
          const Icon = course.icon
          return (
            <motion.article
              key={course.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ delay: index * 0.06, duration: 0.45, ease: 'easeOut' }}
              className="rounded-[28px] bg-white p-6 shadow-[0_18px_46px_rgba(95,67,18,0.08)]"
            >
              <span className={`grid size-13 place-items-center rounded-[20px] ${course.color}`}>
                <Icon size={26} strokeWidth={2.4} />
              </span>
              <h3 className="mt-5 text-lg font-black text-[#222222]">{course.title}</h3>
              <p className="mt-3 text-sm font-medium leading-6 text-[#666666]">{course.description}</p>
            </motion.article>
          )
        })}
      </div>
    </section>
    <SeoLandingLinks compact />
    </>
  )
}
