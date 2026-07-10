'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { Check } from 'lucide-react'
import PreviewFrame from './PreviewFrame'
import { useGuideScene } from './useGuideScene'

// 0: 대기 · 1: 체크가 팝인되며 완료 상태로 전환
const SCENE_COUNT = 2
const SCENE_DURATION_MS = 2400

export default function ResultPreview() {
  const reduceMotion = useReducedMotion()
  const { scene, isStatic } = useGuideScene(SCENE_COUNT, SCENE_DURATION_MS, reduceMotion)
  const isComplete = scene === 1

  return (
    <PreviewFrame testId="application-guide-animation-application-complete">
      <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
        <motion.span
          animate={{
            scale: isComplete ? 1 : 0.85,
            backgroundColor: isComplete ? '#6bcb77' : '#e2e8f0',
          }}
          initial={isStatic ? false : { scale: 0.85 }}
          transition={{ type: 'spring', stiffness: 260, damping: 16 }}
          className="grid size-9 place-items-center rounded-full"
        >
          <Check size={18} strokeWidth={3} className="text-white" />
        </motion.span>

        <motion.p
          animate={{ opacity: isComplete ? 1 : 0.4 }}
          transition={{ duration: 0.3 }}
          className="text-sm font-black text-slate-900"
        >
          {isComplete ? '접수 완료' : '접수 처리 중'}
        </motion.p>

        <motion.p
          animate={{ opacity: isComplete ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          className="text-[11px] font-medium leading-5 text-slate-500"
        >
          편성 결과를 이메일로 안내해 드려요
        </motion.p>

        <motion.span
          animate={{ opacity: isComplete ? 1 : 0 }}
          transition={{ duration: 0.3, delay: isComplete ? 0.1 : 0 }}
          className="mt-1 rounded-full bg-brand-600 px-4 py-1.5 text-[11px] font-black text-white"
        >
          다시 신청하기
        </motion.span>
      </div>
    </PreviewFrame>
  )
}
