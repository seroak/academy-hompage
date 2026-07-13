import { ArrowRight, BookMarked, Brain, Shapes } from "lucide-react";
import Link from "next/link";

const courses = [
  {
    number: "01",
    title: "유치부 과정",
    description: "놀이와 이야기로 수감각을 키우고, 수학을 즐겁고 재미있게 경험할 수 있습니다.",
    icon: Shapes,
    href: "/courses/young-children-math",
  },
  {
    number: "02",
    title: "초등 저학년 과정",
    description: "스스로 학습하고 학교 수업을 자신 있게 따라갈 수 있도록 기초 학습 능력을 키워드립니다.",
    icon: BookMarked,
    href: "/courses/elementary-lower-grades",
  },
  {
    number: "03",
    title: "창의 사고 과정",
    description: "관찰, 비교, 질문으로 스스로 생각하는 힘을 키웁니다.",
    icon: Brain,
    href: "/courses/thinking-math",
  },
];

export default function CourseSection() {
  return (
    <section className="mx-auto max-w-[1120px] px-5 pb-8 pt-28 sm:px-8">
      <div className="grid gap-8 lg:grid-cols-[0.86fr_1.14fr] lg:items-end">
        <div>
          <p className="text-sm font-bold tracking-[0.08em] text-brand-600">교육 과정</p>
          <h2 className="mt-3 text-3xl font-extrabold leading-tight tracking-[-0.02em] text-ink-900 sm:text-4xl">
            아이의 속도에 맞춘
            <br />
            따뜻한 배움 설계
          </h2>
        </div>
        <p className="max-w-2xl text-base leading-8 text-ink-700">
          다양한 교구를 탐색하고 활용하며 아이의 사고력을 키우고, 학습에 부담 없이 몰입할 수 있도록 돕습니다. 또한
          부모님께서는 아이의 성장 과정을 한눈에 확인하실 수 있도록 구성했습니다
        </p>
      </div>

      <div className="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-3">
        {courses.map((course) => {
          const Icon = course.icon;
          return (
            <article key={course.title} className="border-t-2 border-ink-900 pt-5">
              <div className="flex items-start justify-between">
                <span className="text-sm font-bold tabular-nums text-ink-500">{course.number}</span>
                <Icon className="text-brand-500" size={22} strokeWidth={2} />
              </div>
              <h3 className="mt-4 text-lg font-bold text-ink-900">{course.title}</h3>
              <p className="mt-3 text-sm leading-6 text-ink-700">{course.description}</p>
              <Link
                href={course.href}
                className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-brand-700 transition hover:text-brand-800 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-700"
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
