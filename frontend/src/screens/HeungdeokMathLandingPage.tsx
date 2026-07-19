"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import LeadConsultationForm from "../components/lead/LeadConsultationForm";
import { sendTrackingEvent } from "../lib/marketing/events";

const learningSteps = [
  ["놀이", "손으로 만지고 움직이며 수학을 편안하게 만납니다."],
  ["개념 이해", "답을 외우기보다 왜 그런지 자기 말로 설명합니다."],
  ["사고력", "한 문제를 여러 방향으로 바라보는 힘을 기릅니다."],
  ["교과 연결", "학교 수학으로 자연스럽게 이어 자신감을 만듭니다."],
];

const programs = [
  {
    name: "플레이팩토",
    stage: "수학과 친해지는 첫 단계",
    description: "게임과 교구를 직접 조작하며 수와 연산, 도형, 측정의 기초 개념을 자연스럽게 발견합니다.",
    image: "/images/math/playfacto-activity.png",
    alt: "교구 블록으로 도형 활동을 하는 아이들",
    tone: "bg-[#fff0ca]",
  },
  {
    name: "요리수 연산",
    stage: "이야기와 활동으로 이해하는 단계",
    description: "생활 속 상황과 이야기에서 문제를 찾고, 교구와 그림으로 해결 과정을 표현하며 개념을 단단히 다집니다.",
    image: "/images/math/yorisu-activity.png",
    alt: "수학 교구와 활동지를 살펴보는 아이들",
    tone: "bg-[#e8f1df]",
  },
  {
    name: "씨투엠(C2M)",
    stage: "사고력과 교과를 연결하는 단계",
    description: "조건을 관찰하고 여러 풀이를 비교하며, 발견한 원리를 문장제와 교과 문제까지 확장합니다.",
    image: "/images/math/c2m-activity.png",
    alt: "사고력 수학 문제를 함께 해결하는 아이들",
    tone: "bg-[#e8f0f5]",
  },
];

const concerns = [
  "수학을 재미있는 경험으로 시작하게 해주고 싶어요.",
  "답은 맞히지만 왜 그렇게 풀었는지 설명하기 어려워해요.",
  "연산은 괜찮은데 문장제나 새로운 문제 앞에서 멈춰요.",
  "사고력 수학과 학교 수학을 어떻게 함께 준비할지 고민돼요.",
];

export default function HeungdeokMathLandingPage() {
  useEffect(() => sendTrackingEvent("view_ad_landing"), []);

  const scrollToForm = () => {
    sendTrackingEvent("consultation_cta_click");
    document.getElementById("consultation-form")?.scrollIntoView({ block: "start" });
  };

  return (
    <div className="pb-24 sm:pb-12">
      <section className="relative overflow-hidden rounded-[36px] bg-[#25231e] text-[#fffaf0]">
        <div className="grid lg:min-h-[610px] lg:grid-cols-[0.9fr_1.1fr]">
          <div className="relative z-10 flex flex-col justify-center px-6 py-12 sm:px-10 sm:py-16 lg:px-14">
            <p className="text-xs font-black tracking-[0.18em] text-[#ffc84a]">생각을 여는 수학 · 용인 흥덕</p>
            <h1 className="mt-5 max-w-[12ch] break-keep text-[clamp(2.7rem,6.8vw,5.35rem)] font-black leading-[0.98] tracking-[-0.06em]">
              흥덕 유치부·초등 저학년 수학
            </h1>
            <div className="mt-5 flex flex-wrap items-center gap-2 text-xs font-black tracking-[0.08em] text-[#ffc84a]">
              <span className="rounded-full border border-[#5a5445] bg-[#302e28] px-3 py-1.5">플레이팩토</span>
              <span className="rounded-full border border-[#5a5445] bg-[#302e28] px-3 py-1.5">요리수 연산</span>
              <span className="rounded-full border border-[#5a5445] bg-[#302e28] px-3 py-1.5">씨투엠</span>
            </div>
            <p className="mt-7 max-w-[32rem] break-keep text-base font-semibold leading-7 text-[#e7dfd0] sm:text-lg">
              빨리 푸는 연습보다 스스로 발견하고 설명하는 경험을 먼저 만듭니다. 놀이에서 시작해 개념, 사고력, 교과로 이어지는 수학 수업입니다.
            </p>
            <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-sm font-bold text-[#cfc5b3]">
              <span>만 5~9세 이상</span>
              <span aria-hidden="true">·</span>
              <span>흥덕 도보 통학권</span>
              <span aria-hidden="true">·</span>
              <span>무료 상담</span>
            </div>
            <div className="mt-6 max-w-[32rem] rounded-2xl border border-[#4d493f] bg-[#302e28] px-5 py-4">
              <p className="break-keep text-sm font-bold leading-6 text-[#f4ecdd]">
                등록 확정 없이 아이에게 맞는 과정과 가능한 수업 시간을 안내합니다.
              </p>
              <p className="mt-2 text-xs font-black tracking-[0.08em] text-[#ffc84a]">매일 9~21시 순차 연락</p>
            </div>
            <div className="mt-9 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={scrollToForm}
                className="rounded-full bg-[#ffc84a] px-7 py-4 text-sm font-black text-[#29251e] transition duration-200 hover:-translate-y-0.5 hover:bg-[#ffd36c] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#ffc84a]"
              >
                우리 아이 무료 상담 신청
              </button>
              <a
                href="tel:01029760166"
                onClick={() => sendTrackingEvent("phone_click")}
                className="rounded-full border border-[#615c50] px-7 py-4 text-sm font-black text-[#fffaf0] transition hover:bg-[#38352e] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#ffc84a]"
              >
                전화로 상담하기
              </a>
            </div>
          </div>

          <figure className="relative min-h-[360px] overflow-hidden lg:min-h-full">
            <Image
              src="/images/math/c2m-activity.png"
              alt="도형 교구로 수학 활동을 하는 아이"
              fill
              loading="eager"
              fetchPriority="high"
              sizes="(min-width: 1024px) 610px, 100vw"
              className="object-cover object-[68%_center]"
            />
            <div className="absolute inset-x-5 bottom-5 rounded-[22px] bg-[#fff9ed]/95 p-5 text-[#29251e] shadow-[0_18px_45px_rgba(20,16,10,0.18)] sm:inset-x-auto sm:bottom-7 sm:left-7 sm:max-w-[310px]">
              <p className="text-xs font-black tracking-[0.12em] text-[#b85500]">수업에서 가장 자주 묻는 말</p>
              <p className="mt-2 break-keep text-xl font-black leading-snug tracking-[-0.025em]">“어떻게 풀었는지 선생님에게 이야기해 줄래?”</p>
            </div>
          </figure>
        </div>
      </section>

      <section className="py-20 sm:py-28" aria-labelledby="academy-difference">
        <div className="grid gap-12 lg:grid-cols-[0.82fr_1.18fr] lg:gap-20">
          <div>
            <p className="text-sm font-black text-[#b85500]">학원 소개</p>
            <h2 id="academy-difference" className="mt-3 max-w-[15ch] break-keep text-[clamp(2.1rem,5vw,3.7rem)] font-black leading-[1.06] tracking-[-0.05em] text-[#242019]">
              생각을 여는 수학은 무엇이 다른가요?
            </h2>
            <p className="mt-6 max-w-[34rem] break-keep text-base font-medium leading-8 text-[#665d50]">
              생각을 여는 수학은 용인 흥덕의 유치부·초등 저학년 수학학원입니다. 아이가 교구를 만지고, 관계를 발견하고, 자신의 말로 설명하는 과정을 통해 수학을 이해하도록 돕습니다.
            </p>
          </div>

          <div className="border-y border-[#ded3c0]">
            {[
              ["01", "정답보다 과정을 봅니다", "맞고 틀림에서 멈추지 않고 아이가 어떤 생각으로 답에 도달했는지 살펴봅니다."],
              ["02", "아이의 현재에서 시작합니다", "연령과 진도만으로 반을 정하지 않고 흥미, 개념 이해, 설명하는 힘을 함께 확인합니다."],
              ["03", "놀이와 교과를 끊지 않습니다", "교구 활동에서 발견한 원리가 사고력 문제와 학교 수학으로 자연스럽게 이어지도록 수업합니다."],
            ].map(([number, title, description]) => (
              <article key={number} className="grid gap-3 border-b border-[#ded3c0] py-7 last:border-b-0 sm:grid-cols-[3.5rem_0.8fr_1.2fr] sm:gap-6">
                <span className="text-sm font-black text-[#b85500]">{number}</span>
                <h3 className="break-keep text-lg font-black tracking-[-0.025em] text-[#2b2721]">{title}</h3>
                <p className="break-keep text-sm font-medium leading-7 text-[#6a6256]">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-[36px] bg-[#f5ead5] px-6 py-16 sm:px-10 sm:py-20 lg:px-14" aria-labelledby="programs-heading">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-black text-[#b85500]">연령과 이해 수준에 맞춘 교육과정</p>
            <h2 id="programs-heading" className="mt-3 max-w-[18ch] break-keep text-[clamp(2rem,5vw,3.5rem)] font-black leading-[1.07] tracking-[-0.05em] text-[#242019]">
              아이의 성장에 맞춰 이어지는 세 가지 수업
            </h2>
          </div>
          <p className="max-w-[35rem] break-keep text-sm font-semibold leading-7 text-[#685e4e]">
            한 교재에 아이를 맞추지 않습니다. 상담에서 현재 모습을 살펴본 뒤 알맞은 과정과 수업 흐름을 안내합니다.
          </p>
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {programs.map((program, index) => (
            <article key={program.name} className={`overflow-hidden rounded-[28px] ${program.tone}`}>
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image src={program.image} alt={program.alt} fill sizes="(min-width: 1024px) 330px, 100vw" className="object-cover transition duration-500 hover:scale-[1.025]" />
              </div>
              <div className="p-6 sm:p-7">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-black tracking-[0.14em] text-[#a34b00]">0{index + 1}</span>
                  <span className="text-xs font-bold text-[#746854]">{program.stage}</span>
                </div>
                <h3 className="mt-5 text-2xl font-black tracking-[-0.035em] text-[#29251e]">{program.name}</h3>
                <p className="mt-3 break-keep text-sm font-medium leading-7 text-[#62594c]">{program.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="py-20 sm:py-28" aria-labelledby="learning-flow">
        <div className="grid gap-12 lg:grid-cols-[0.68fr_1.32fr] lg:gap-20">
          <div>
            <p className="text-sm font-black text-[#b85500]">수학을 배우는 순서</p>
            <h2 id="learning-flow" className="mt-3 max-w-[14ch] break-keep text-[clamp(2rem,5vw,3.5rem)] font-black leading-[1.07] tracking-[-0.05em] text-[#242019]">
              즐거움이 개념이 되고, 개념이 자신감이 됩니다
            </h2>
            <p className="mt-6 break-keep text-base font-black text-[#4d4437]">놀이 → 개념 이해 → 사고력 → 교과 연결</p>
          </div>

          <ol className="border-y border-[#ded3c0]">
            {learningSteps.map(([title, description], index) => (
              <li key={title} className="grid gap-3 border-b border-[#ded3c0] py-6 last:border-b-0 sm:grid-cols-[3rem_0.7fr_1.3fr] sm:items-start sm:gap-5">
                <span className="text-sm font-black text-[#b85500]">0{index + 1}</span>
                <h3 className="text-lg font-black text-[#2d2922]">{title}</h3>
                <p className="break-keep text-sm font-medium leading-7 text-[#6a6256]">{description}</p>
              </li>
            ))}
          </ol>
        </div>
        <div className="mt-10 flex flex-wrap items-center gap-4">
          <button type="button" onClick={scrollToForm} className="rounded-full bg-[#29251e] px-7 py-3.5 text-sm font-black text-[#fffaf0] transition hover:-translate-y-0.5 hover:bg-[#c45c00]">
            우리 아이 과정 상담
          </button>
          <Link href="/courses" onClick={() => sendTrackingEvent("course_view")} className="text-sm font-black text-[#b85500] underline decoration-[#d1a26d] underline-offset-4">
            전체 교육과정 자세히 보기
          </Link>
        </div>
      </section>

      <section className="overflow-hidden rounded-[36px] bg-[#264f3f] text-[#f8f2e6]" aria-labelledby="concerns-heading">
        <div className="grid lg:grid-cols-[1.02fr_0.98fr]">
          <div className="relative min-h-[330px] lg:min-h-full">
            <Image src="/images/math/playfacto-activity.png" alt="블록 교구로 함께 사고력 활동을 하는 아이들" fill sizes="(min-width: 1024px) 560px, 100vw" className="object-cover" />
          </div>
          <div className="px-6 py-12 sm:px-10 sm:py-16 lg:px-12">
            <p className="text-sm font-black text-[#f8c96d]">학부모님이 자주 들려주시는 고민</p>
            <h2 id="concerns-heading" className="mt-3 max-w-[14ch] break-keep text-[clamp(2rem,4.5vw,3.2rem)] font-black leading-[1.08] tracking-[-0.045em]">
              이런 고민이 있다면 상담해 보세요
            </h2>
            <ul className="mt-8 divide-y divide-[#4b6c5f] border-y border-[#4b6c5f]">
              {concerns.map((concern) => (
                <li key={concern} className="flex gap-4 py-4 text-sm font-semibold leading-6 text-[#e7eee9]">
                  <span className="text-[#f8c96d]" aria-hidden="true">✓</span>
                  <span className="break-keep">{concern}</span>
                </li>
              ))}
            </ul>
            <button type="button" onClick={scrollToForm} className="mt-8 rounded-full bg-[#f8c96d] px-7 py-3.5 text-sm font-black text-[#264f3f] transition hover:-translate-y-0.5 hover:bg-[#ffda8c]">
              상담으로 시작점 찾기
            </button>
          </div>
        </div>
      </section>

      <section className="mt-20 grid gap-8 rounded-[32px] bg-[#fff1c7] p-6 sm:mt-28 sm:p-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start" aria-labelledby="consultation-heading">
        <div className="lg:sticky lg:top-8">
          <p className="text-sm font-black text-[#b85b00]">부담 없이 남기는 1분 상담</p>
          <h2 id="consultation-heading" className="mt-3 text-3xl font-black leading-tight tracking-[-0.04em] text-[#2d2922]">
            진도보다 먼저
            <br />
            아이의 현재를 봅니다
          </h2>
          <p className="mt-5 max-w-[29rem] break-keep text-sm font-medium leading-7 text-[#655b4c]">
            상담 신청은 등록 확정이 아닙니다. 연령과 수학 경험을 듣고 아이에게 맞는 과정과 가능한 수업 시간을 차분히 안내해 드립니다.
          </p>
          <ul className="mt-6 space-y-3 text-sm font-bold leading-6 text-[#4b443a]">
            <li>만 5~9세 이상 연령과 수학 경험</li>
            <li>흥미·개념·사고력의 현재 균형</li>
            <li>흥덕 통학과 가능한 상담 시간</li>
          </ul>
          <div className="mt-10 space-y-5">
            <details className="border-t border-[#d9ceb9] pt-5">
              <summary className="cursor-pointer font-black">첫 상담에 자녀 실명이 필요한가요?</summary>
              <p className="mt-2 text-sm leading-6">아니요. 상담 의사가 확인된 뒤 필요한 정보만 받습니다.</p>
            </details>
            <details className="border-t border-[#d9ceb9] pt-5">
              <summary className="cursor-pointer font-black">바로 등록해야 하나요?</summary>
              <p className="mt-2 text-sm leading-6">아니요. 과정과 시간을 안내받고 충분히 결정하시면 됩니다.</p>
            </details>
          </div>
        </div>
        <LeadConsultationForm />
      </section>

      <div className="fixed inset-x-4 bottom-4 z-40 flex gap-2 rounded-full border border-[#f2dfb9] bg-[#fffaf0]/95 p-2 shadow-[0_16px_40px_rgba(65,43,10,0.18)] backdrop-blur sm:hidden">
        <a href="tel:01029760166" onClick={() => sendTrackingEvent("phone_click")} className="flex h-12 flex-1 items-center justify-center rounded-full text-sm font-black text-[#4d4437]">
          전화 상담
        </a>
        <button type="button" onClick={scrollToForm} className="h-12 flex-[1.4] rounded-full bg-[#c45c00] text-sm font-black text-white">
          상담 신청
        </button>
      </div>
    </div>
  );
}
