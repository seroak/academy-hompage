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
      <div className="relative overflow-hidden rounded-panel bg-[#eef7ef] px-6 py-10 sm:px-10 lg:px-12">
        <div className="absolute -right-14 -top-12 h-44 w-44 rounded-full bg-[#6bcb77]/12" />

        <div className="relative z-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <p className="text-sm font-bold tracking-[0.08em] text-[#4a9f56]">학부모 신뢰 요소</p>
            <h2 className="mt-3 text-3xl font-extrabold leading-tight tracking-[-0.02em] text-ink-900 sm:text-4xl">
              안심하고 맡길 수 있는
              <br />
              꼼꼼한 학원 운영
            </h2>
          </div>
          <p className="max-w-xl text-base leading-8 text-ink-700">
            밝은 분위기만큼 중요한 것은 부모님이 매일 안심할 수 있는 운영입니다.
          </p>
        </div>

        <div className="relative z-10 mt-10 grid gap-x-6 gap-y-8 sm:grid-cols-3">
          {trustItems.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.title} className="flex items-start gap-4">
                <Icon className="mt-0.5 shrink-0 text-[#4a9f56]" size={26} strokeWidth={2} />
                <div>
                  <h3 className="text-base font-bold text-ink-900">{item.title}</h3>
                  <p className="mt-1.5 text-sm leading-6 text-ink-700">{item.description}</p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
