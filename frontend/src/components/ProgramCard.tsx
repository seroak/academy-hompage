"use client";

import { useEffect, useRef } from "react";
import { BookOpenText, HeartHandshake, Lightbulb, ToyBrick } from "lucide-react";

const programs = [
  {
    title: "창의융합 교육",
    description: "생각하는 힘을 키워요",
    icon: Lightbulb,
  },
  {
    title: "기초학습 강화",
    description: "수학 기초 튼튼",
    icon: BookOpenText,
  },
  {
    title: "바른 인성 교육",
    description: "배려와 존중을 배워요",
    icon: HeartHandshake,
  },
  {
    title: "다양한 교구 체험",
    description: "다양한 체험으로 쑥쑥",
    icon: ToyBrick,
  },
];

export default function ProgramCard() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (window.location.hash === "#programs") {
      sectionRef.current?.focus({ preventScroll: true });
    }
  }, []);

  return (
    <section
      ref={sectionRef}
      id="programs"
      tabIndex={-1}
      className="relative mx-auto max-w-[1120px] scroll-mt-28 px-6 pt-14 pb-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 sm:px-10"
    >
      <div className="grid gap-x-6 gap-y-6 border-t border-ink-900/10 pt-8 sm:grid-cols-2 lg:grid-cols-4">
        {programs.map((program) => {
          const Icon = program.icon;
          return (
            <div key={program.title} className="flex items-center gap-4">
              <Icon className="shrink-0 text-brand-600" size={24} strokeWidth={2} />
              <div>
                <h2 className="text-sm font-bold text-ink-900">{program.title}</h2>
                <p className="mt-0.5 text-[13px] font-medium text-ink-500">{program.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
