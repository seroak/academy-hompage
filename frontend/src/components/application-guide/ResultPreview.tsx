"use client";

import { Check } from "lucide-react";
import PreviewFrame from "./PreviewFrame";
import { useGuideScene } from "./useGuideScene";

// 0: 대기 · 1: 체크가 팝인되며 완료 상태로 전환
const SCENE_COUNT = 2;
const SCENE_DURATION_MS = 2400;

export default function ResultPreview() {
  const { scene } = useGuideScene(SCENE_COUNT, SCENE_DURATION_MS);
  const isComplete = scene === 1;

  return (
    <PreviewFrame testId="application-guide-animation-application-complete">
      <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
        <span
          className={`grid size-9 place-items-center rounded-full transition duration-300 ${
            isComplete ? "scale-100 bg-[#6bcb77]" : "scale-[0.85] bg-slate-200"
          }`}
        >
          <Check size={18} strokeWidth={3} className="text-white" />
        </span>

        <p className={`text-sm font-black text-slate-900 transition-opacity duration-300 ${isComplete ? "opacity-100" : "opacity-40"}`}>
          {isComplete ? "접수 완료" : "접수 처리 중"}
        </p>

        <p className={`text-[11px] font-medium leading-5 text-slate-500 transition-opacity duration-300 ${isComplete ? "opacity-100" : "opacity-0"}`}>
          편성 결과를 이메일로 안내해 드려요
        </p>

        <span className={`mt-1 rounded-full bg-brand-600 px-4 py-1.5 text-[11px] font-black text-white transition-opacity duration-300 ${isComplete ? "opacity-100" : "opacity-0"}`}>
          확인
        </span>
      </div>
    </PreviewFrame>
  );
}
