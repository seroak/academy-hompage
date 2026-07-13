import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function MathHero() {
  return (
    <section className="relative overflow-hidden rounded-[28px] bg-[radial-gradient(circle_at_86%_10%,#fff8d6_0,transparent_25%),linear-gradient(125deg,#fffaf1_0%,#fff3cd_58%,#ffe8a1_100%)] px-5 py-10 shadow-[0_16px_42px_rgba(106,72,15,0.08)] sm:px-8 lg:min-h-[478px] lg:px-12 lg:py-12">
      <div className="absolute -bottom-16 -left-10 h-36 w-60 rounded-[50%] bg-[#ffe08a]/60" />
      <div className="absolute -bottom-14 right-[8%] h-32 w-64 rounded-t-[70%] bg-[#fff7d9]" />

      <div className="relative z-10 grid items-center gap-5 lg:grid-cols-[1fr_1fr]">
        <div className="max-w-[540px]">
          <h1 className="mt-5 text-[clamp(2rem,3.2vw,2.625rem)] font-bold leading-[1.2] tracking-[-0.045em] text-[#222222]">
            놀이에서 시작해
            <br />
            사고력과 교과로 연결되는
            <br />
            <span className="text-[#f47a16]">생각을 여는 수학만의 교육</span>
          </h1>
          <p className="mt-5 max-w-[32rem] text-sm font-medium leading-7 text-[#5f584c] sm:text-base">
            아이의 흥미를 발견하고, 스스로 생각하는 힘과 수학 자신감으로 이어갑니다.
          </p>
          <Link
            href="/apply"
            className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-[#ff8a1f] px-5 text-sm font-bold text-white shadow-[0_10px_20px_rgba(232,111,0,0.2)] transition hover:-translate-y-0.5 hover:bg-[#e86f00]"
          >
            교육과정 상담하기 <ArrowRight size={18} strokeWidth={2.7} />
          </Link>
        </div>

        <div className="relative hidden min-h-[245px] self-end sm:block lg:min-h-[370px]">
          <Image
            src="/images/math/hero-math-activity.png"
            alt="교구로 수학 활동을 하는 어린이들"
            width={1672}
            height={941}
            sizes="(min-width: 1024px) 560px, (min-width: 640px) 420px, 220px"
            priority
            decoding="sync"
            className="relative z-10 mx-auto h-auto w-full max-w-[220px] rounded-[28px] object-cover shadow-[0_20px_24px_rgba(82,56,13,0.12)] sm:max-w-[420px] lg:max-w-[560px]"
          />
        </div>
      </div>
    </section>
  );
}
