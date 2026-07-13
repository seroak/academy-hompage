import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Check } from "lucide-react";
import { programs, toneClasses } from "./data";

export default function ProgramCards() {
  return (
    <section className="rounded-[24px] bg-[#fff5df] px-5 py-10 sm:px-8 sm:py-12">
      <div className="text-center">
        <p className="text-xs font-bold tracking-[0.06em] text-[#e86f00]">THREE STARTING POINTS</p>
        <h2 className="mt-2 text-[clamp(1.625rem,2.8vw,2.25rem)] font-bold tracking-[-0.045em] text-[#222222]">
          우리 아이의 시작점에 맞춘 3가지 과정
        </h2>
      </div>
      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        {programs.map((program) => {
          const style = toneClasses[program.tone];
          const highlights = [...program.lessons, ...program.benefits].slice(0, 4);
          return (
            <article
              key={program.name}
              className={`flex min-h-full flex-col overflow-hidden rounded-[22px] border ${style.border} bg-[#fffdf9] p-4 shadow-[0_8px_24px_rgba(95,67,18,0.04)]`}
            >
              <div className={`rounded-[17px] p-4 ${style.surface}`}>
                <p className={`text-[11px] font-bold tracking-[0.07em] ${style.text}`}>{program.englishName}</p>
                <h3 className={`mt-1.5 text-xl font-bold tracking-[-0.045em] ${style.text}`}>{program.name}</h3>
              </div>
              <p className="mt-4 min-h-10 text-[15px] font-bold leading-5 text-[#2b271f]">{program.summary}</p>
              <div className="relative mt-4 hidden aspect-[4/3] overflow-hidden rounded-[14px] bg-white sm:block">
                <Image
                  src={program.imageSrc}
                  alt={`${program.name} 수업 활동`}
                  fill
                  sizes="(min-width: 1024px) 31vw, 100vw"
                  className="object-cover"
                />
              </div>
              <div className="mt-4 border-y border-[#eee6d9] py-4">
                <ul className="space-y-1.5">
                  {highlights.map((highlight) => (
                    <li key={highlight} className="flex gap-1.5 text-[13px] font-medium leading-5 text-[#6b6257]">
                      <Check className={`mt-0.5 shrink-0 ${style.text}`} size={14} strokeWidth={3} />
                      {highlight}
                    </li>
                  ))}
                </ul>
              </div>
              <p className="mt-3 text-[13px] font-semibold text-[#716758]">대상 연령 · {program.age}</p>
              <Link
                href={program.seoPath}
                className={`mt-4 inline-flex items-center justify-center gap-2 text-sm font-bold ${style.text} underline decoration-2 underline-offset-4 transition hover:opacity-75 focus-visible:outline-2 focus-visible:outline-offset-4`}
              >
                {program.name} 과정 자세히 보기 <ArrowRight size={17} strokeWidth={2.7} />
              </Link>
            </article>
          );
        })}
      </div>
    </section>
  );
}
