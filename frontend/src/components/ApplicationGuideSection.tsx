"use client";

import Link from "next/link";
import { CalendarDays, ChevronRight, MailCheck, UserRoundPen } from "lucide-react";
import ChildSelectPreview from "./application-guide/ChildSelectPreview";
import TimeSelectPreview from "./application-guide/TimeSelectPreview";
import ResultPreview from "./application-guide/ResultPreview";

const steps = [
  {
    number: "01",
    title: "자녀 선택",
    description: "신청할 자녀를 선택해요.",
    icon: UserRoundPen,
    color: "text-[#e86f00]",
    Preview: ChildSelectPreview,
  },
  {
    number: "02",
    title: "희망 시간 선택(복수 신청 가능)",
    description: "가능한 요일과 시간을 골라요.",
    icon: CalendarDays,
    color: "text-[#438cc9]",
    Preview: TimeSelectPreview,
  },
  {
    number: "03",
    title: "편성 결과 안내",
    description: "편성 결과는 메시지로 안내해 드려요.",
    icon: MailCheck,
    color: "text-[#499e58]",
    Preview: ResultPreview,
  },
];

export default function ApplicationGuideSection() {
  return (
    <section className="mx-auto max-w-[1120px] px-5 py-16 sm:px-8 sm:py-24">
      <div className="relative overflow-hidden rounded-panel bg-[#fff5dc] px-6 py-10 sm:px-10 lg:px-12 lg:py-14">
        <div className="absolute -bottom-20 right-8 size-48 rounded-full bg-[#6bcb77]/15" />

        <div className="relative z-10 max-w-2xl">
          <p className="text-sm font-bold tracking-[0.08em] text-brand-700">처음이라도 간단하게</p>
          <h2 className="mt-3 text-3xl font-extrabold leading-tight tracking-[-0.02em] text-ink-900 sm:text-4xl">
            수업 신청, 이렇게 진행돼요
          </h2>
          <p className="mt-4 max-w-xl text-base leading-8 text-ink-700">
            아이 정보와 원하는 시간을 남겨주시면, 맞는 반 편성 결과를 이메일로 안내해 드려요.
          </p>
        </div>

        <ol className="relative z-10 mt-10 grid gap-4 lg:grid-cols-3 lg:gap-5">
          {steps.map((step) => {
            const Icon = step.icon;
            const Preview = step.Preview;

            return (
              <li key={step.number} className="relative rounded-card bg-[#fffdf7] p-6 shadow-card">
                <Preview />
                <div className="flex items-start justify-between gap-4">
                  <span className="mt-5 text-sm font-bold tracking-[0.12em] text-[#b99b64]">{step.number}</span>
                  <Icon className={`mt-4 ${step.color}`} size={24} strokeWidth={2} aria-hidden="true" />
                </div>
                <h3 className="mt-4 text-lg font-bold text-ink-900">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-ink-700">{step.description}</p>
              </li>
            );
          })}
        </ol>

        <div className="relative z-10 mt-10 flex flex-col gap-4 border-t border-[#ead8af] pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm leading-6 text-ink-700">
            지금 모집 중인 반이 있다면 바로 합류도 신청할 수 있어요.
          </p>
          <Link
            href="/apply"
            className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-brand-600 px-6 text-sm font-bold text-white shadow-[0_14px_28px_rgba(255,138,31,0.24)] transition duration-200 hover:-translate-y-0.5 hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
          >
            수업 신청하기
            <ChevronRight size={18} strokeWidth={2.8} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
