import Image from "next/image";
import Link from "next/link";

const childrenImagePath = "/images/children_cutout.png";

export default function Hero() {
  return (
    <section className="relative min-h-[600px] overflow-hidden rounded-panel bg-[#fff5dc] px-6 pt-16 shadow-hero sm:min-h-[780px] sm:px-10 lg:min-h-[600px] lg:px-16">
      <div className="absolute -bottom-16 -left-10 h-64 w-64 rounded-full bg-[#ffe8a1]" />
      <div className="absolute bottom-0 right-0 h-40 w-[42%] rounded-tl-[64%] bg-[#6bcb77]/90" />

      <div className="relative z-10 grid min-h-[520px] items-center gap-10 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="max-w-[560px] pb-28 pt-2 lg:pb-20">
          <p className="mb-5 inline-flex items-center gap-2 text-sm font-bold tracking-[0.08em] text-brand-700">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-600" aria-hidden="true" />
            용인 흥덕 유치부·초등 저학년 수학학원
          </p>
          <h1 className="text-[clamp(2.5rem,5.5vw,4.25rem)] font-extrabold leading-[1.14] tracking-[-0.03em] text-ink-900">
            아이의 오늘이
            <br />
            <span className="text-brand-600">미래의 꿈</span>이 됩니다
          </h1>
          <p className="mt-6 max-w-md text-lg leading-8 text-ink-700">
            유치부부터 초등 저학년까지, 재미있는 배움으로
            <br />
            바른 성장을 돕습니다.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link
              href="/apply"
              className="inline-flex h-13 items-center justify-center rounded-full bg-brand-600 px-7 text-base font-bold text-white shadow-[0_16px_30px_rgba(255,138,31,0.28)] transition duration-200 hover:-translate-y-0.5 hover:bg-brand-700"
            >
              상담 신청하기
            </Link>
          </div>
        </div>

        <div className="relative hidden self-end pb-20 sm:block lg:pb-26">
          <Image
            src={childrenImagePath}
            alt="용인 흥덕 유치부·초등 저학년 수학학원에서 책상 앞에 웃고 있는 어린이들"
            width={1536}
            height={1024}
            sizes="(min-width: 1024px) 520px, (min-width: 640px) 420px, 180px"
            priority
            decoding="sync"
            className="relative z-10 mx-auto h-auto w-full max-w-[180px] object-contain drop-shadow-[0_28px_36px_rgba(77,52,17,0.16)] sm:max-w-[420px] lg:max-w-[520px]"
          />
        </div>
      </div>
    </section>
  );
}
