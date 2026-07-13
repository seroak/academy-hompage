import { ArrowRight, BookMarked, Brain, Shapes } from "lucide-react";
import Link from "next/link";

const courses = [
  {
    title: "유치부 과정",
    description: "놀이와 이야기로 수감각을 키우고, 수학을 즐겁고 재미있게 경험할 수 있습니다.",
    icon: Shapes,
    color: "bg-[#fff3c8] text-[#f2a900]",
    href: "/courses/young-children-math",
  },
  {
    title: "초등 저학년 과정",
    description: "스스로 학습하고 학교 수업을 자신 있게 따라갈 수 있도록 기초 학습 능력을 키워드립니다.",
    icon: BookMarked,
    color: "bg-[#e7f4ff] text-[#5dadec]",
    href: "/courses/elementary-lower-grades",
  },
  {
    title: "창의 사고 과정",
    description: "관찰, 비교, 질문으로 스스로 생각하는 힘을 키웁니다.",
    icon: Brain,
    color: "bg-[#e9f9ec] text-[#6bcb77]",
    href: "/courses/thinking-math",
  },
];

export default function CourseSection() {
  return (
    <section className="mx-auto max-w-[1120px] px-5 pb-8 pt-24 sm:px-8">
      <div className="grid gap-8 lg:grid-cols-[0.86fr_1.14fr] lg:items-end">
        <div>
          <p className="text-sm font-black text-[#ff8a1f]">교육 과정</p>
          <h2 className="mt-3 text-3xl font-black leading-tight tracking-[-0.02em] text-[#222222] sm:text-4xl">
            아이의 속도에 맞춘
            <br />
            따뜻한 배움 설계
          </h2>
        </div>
        <p className="max-w-2xl text-base font-semibold leading-8 text-[#666666]">
          다양한 교구를 탐색하고 활용하며 아이의 사고력을 키우고, 학습에 부담 없이 몰입할 수 있도록 돕습니다. 또한
          부모님께서는 아이의 성장 과정을 한눈에 확인하실 수 있도록 구성했습니다
        </p>
      </div>

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {courses.map((course) => {
          const Icon = course.icon;
          return (
            <article
              key={course.title}
              className="rounded-[28px] bg-white p-6 shadow-[0_18px_46px_rgba(95,67,18,0.08)]"
            >
              <span className={`grid size-13 place-items-center rounded-[20px] ${course.color}`}>
                <Icon size={26} strokeWidth={2.4} />
              </span>
              <h3 className="mt-5 text-lg font-black text-[#222222]">{course.title}</h3>
              <p className="mt-3 text-sm font-medium leading-6 text-[#666666]">{course.description}</p>
              <Link
                href={course.href}
                className="mt-5 inline-flex items-center gap-1.5 text-sm font-black text-[#b85b00] transition hover:text-[#e86f00] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#e86f00]"
              >
                {course.title} 자세히 보기 <ArrowRight size={16} strokeWidth={2.7} />
              </Link>
            </article>
          );
        })}
      </div>
    </section>
  );
}
