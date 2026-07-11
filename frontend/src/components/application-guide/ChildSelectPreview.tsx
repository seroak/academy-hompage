'use client'

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import PreviewFrame from './PreviewFrame'
import { useGuideScene } from './useGuideScene'

// 0: idle placeholder · 1: dropdown open, option highlighted · 2: selected + confirmation
const SCENE_COUNT = 3
const SCENE_DURATION_MS = 1700

export default function ChildSelectPreview() {
  const reduceMotion = useReducedMotion()
  const { scene, isStatic } = useGuideScene(SCENE_COUNT, SCENE_DURATION_MS, reduceMotion)
  const isOpen = scene === 1
  const isSelected = scene === 2

  return (
    <PreviewFrame testId="application-guide-animation-child-select">
      <p className="text-[11px] font-black text-slate-400">수업 신청</p>

      <div className="mt-3 flex flex-col gap-1.5 text-[11px] font-semibold text-slate-600">
        신청할 자녀
        <div
          className={`flex items-center justify-between rounded-lg border bg-white px-3 py-2 transition-colors duration-300 ${
            isOpen || isSelected ? 'border-brand-600' : 'border-slate-300'
          }`}
        >
          <span className={`text-[12px] ${isSelected ? 'font-semibold text-slate-800' : 'text-slate-400'}`}>
            {isSelected ? '민서 · 만 6세' : '자녀를 선택해 주세요'}
          </span>
          <ChevronDown
            size={14}
            className={`text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </div>

      <div className="relative mt-1.5 min-h-[30px]">
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={isStatic ? false : { opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.25 }}
              className="rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-[12px] font-semibold text-brand-800"
            >
              민서 · 만 6세
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-3 min-h-[46px]">
        <AnimatePresence>
          {isSelected && (
            <motion.div
              initial={isStatic ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.3 }}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
            >
              <p className="text-[10px] font-medium text-slate-500">아이 정보</p>
              <p className="text-[12px] font-semibold text-slate-700">민서 · 만 6세</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PreviewFrame>
  )
}
