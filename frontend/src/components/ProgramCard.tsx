'use client'

import { motion } from 'framer-motion'
import { BookOpenText, HeartHandshake, Lightbulb, Stars } from 'lucide-react'

const programs = [
  {
    title: '창의융합 교육',
    description: '생각하는 힘을 키워요',
    icon: Lightbulb,
    color: 'bg-[#fff3c8] text-[#f2a900]',
  },
  {
    title: '기초학습 강화',
    description: '국어·수학 기초 튼튼',
    icon: BookOpenText,
    color: 'bg-[#e7f4ff] text-[#5dadec]',
  },
  {
    title: '바른 인성 교육',
    description: '배려와 존중을 배워요',
    icon: HeartHandshake,
    color: 'bg-[#e9f9ec] text-[#6bcb77]',
  },
  {
    title: '즐거운 특별활동',
    description: '다양한 체험으로 쑥쑥',
    icon: Stars,
    color: 'bg-[#fff0e4] text-[#ff8a1f]',
  },
]

export default function ProgramCard() {
  return (
    <motion.section
      id="programs"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.55, ease: 'easeOut' }}
      className="relative z-20 mx-auto -mt-36 w-[calc(100%-32px)] max-w-[1120px] rounded-[28px] bg-white px-6 py-8 shadow-[0_24px_60px_rgba(0,0,0,0.08)] sm:w-[calc(100%-80px)] sm:px-10"
    >
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.35 }}
        variants={{
          hidden: {},
          show: { transition: { staggerChildren: 0.08 } },
        }}
        className="grid gap-y-8 sm:grid-cols-2 lg:grid-cols-4"
      >
        {programs.map((program, index) => {
          const Icon = program.icon
          return (
            <motion.div
              key={program.title}
              variants={{
                hidden: { opacity: 0, y: 20 },
                show: { opacity: 1, y: 0 },
              }}
              className={`flex flex-col items-center px-5 text-center ${
                index > 0 ? 'lg:border-l lg:border-[#ece2d0]' : ''
              }`}
            >
              <span className={`grid size-14 place-items-center rounded-full ${program.color}`}>
                <Icon size={28} strokeWidth={2.4} />
              </span>
              <h2 className="mt-4 text-base font-black text-[#222222]">{program.title}</h2>
              <p className="mt-2 text-[13px] font-semibold text-[#777777]">{program.description}</p>
            </motion.div>
          )
        })}
      </motion.div>
    </motion.section>
  )
}
