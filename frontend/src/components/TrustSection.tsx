import { ClipboardCheck, FileHeart, UsersRound } from "lucide-react";

const trustItems = [
  {
    title: "소수정예 수업",
    description: "아이마다 말하고 시도할 시간이 충분한 밀도 있는 수업",
    icon: UsersRound,
  },
  {
    title: "개별 성장 기록",
    description: "수업 태도, 이해도, 표현 변화를 꾸준히 관찰",
    icon: ClipboardCheck,
  },
  {
    title: "상담 리포트 제공",
    description: "부모님이 이해하기 쉬운 주기별 성장 리포트",
    icon: FileHeart,
  },
];

export default function TrustSection() {
  return (
    <section className="mx-auto max-w-[1120px] px-5 py-20 sm:px-8">
      <div className="relative overflow-hidden rounded-[36px] bg-[#ffffff] px-6 py-10 shadow-[0_24px_60px_rgba(95,67,18,0.08)] sm:px-10 lg:px-12">
        <div className="absolute -right-14 -top-12 h-44 w-44 rounded-full bg-[#ffd66b]/45" />
        <div className="absolute -bottom-16 left-12 h-36 w-36 rounded-full bg-[#6bcb77]/18" />

        <div className="relative z-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <p className="text-sm font-black text-[#6bcb77]">학부모 신뢰 요소</p>
            <h2 className="mt-3 text-3xl font-black leading-tight tracking-[-0.02em] text-[#222222] sm:text-4xl">
              안심하고 맡길 수 있는
              <br />
              꼼꼼한 학원 운영
            </h2>
          </div>
          <p className="max-w-xl text-base font-semibold leading-8 text-[#666666]">
            밝은 분위기만큼 중요한 것은 부모님이 매일 안심할 수 있는 운영입니다.
          </p>
        </div>

        <div className="relative z-10 mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {trustItems.map((item) => {
            const Icon = item.icon;
            return (
              <article
                key={item.title}
                className="rounded-[24px] border border-[#f2e4c9] bg-[#fff9ec] p-5"
              >
                <span className="grid size-12 place-items-center rounded-full bg-white text-[#ff8a1f] shadow-[0_10px_24px_rgba(255,138,31,0.12)]">
                  <Icon size={24} strokeWidth={2.4} />
                </span>
                <h3 className="mt-4 text-base font-black text-[#222222]">{item.title}</h3>
                <p className="mt-2 text-sm font-medium leading-6 text-[#666666]">{item.description}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
