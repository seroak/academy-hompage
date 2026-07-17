export type ProgramTone = "orange" | "mint" | "blue";
export type MathSeoPath =
  | "/courses/young-children-math"
  | "/courses/thinking-math"
  | "/courses/elementary-lower-grades";

export interface MathProgram {
  name: string;
  englishName: string;
  keyword: string;
  philosophy: string;
  audience: string;
  method: string;
  strength: string;
  difficulty: number;
  difficultyLabel: string;
  childFit: string;
  summary: string;
  lessons: string[];
  benefits: string[];
  age: string;
  imageSrc: string;
  seoPath: MathSeoPath;
  materialScore: number;
  curriculumScore: number;
  thinkingScore: number;
  tone: ProgramTone;
}

export const programs: MathProgram[] = [
  {
    name: "플레이팩토",
    englishName: "PLAYFACTO",
    keyword: "교구와 게임으로 만나는 수학",
    philosophy: "교구 + 게임",
    audience: "만 3세 ~ 초4",
    method: "교구 활동 중심",
    strength: "게임으로 개념 이해",
    difficulty: 2,
    difficultyLabel: "쉬움",
    childFit: "만들기·게임을 좋아하는 아이",
    summary: "게임으로 개념을 이해하는 수학",
    lessons: ["교구와 게임을 활용한 체험형 수업", "다양한 교구로 도형 원리를 발견", "게임으로 자연스럽게 사고력 수학"],
    benefits: ["개념 이해와 흥미 향상", "협력하며 배우는 즐거움", "교구 조작으로 손끝 감각 발달"],
    age: "만 3세 ~ 초등 4학년",
    imageSrc: "/images/math/playfacto-activity.png",
    seoPath: "/courses/thinking-math",
    materialScore: 4,
    curriculumScore: 3,
    thinkingScore: 5,
    tone: "orange",
  },
  {
    name: "요리수 수학",
    englishName: "YORISU MATH",
    keyword: "놀이와 스토리로 시작하는 수학",
    philosophy: "놀이 + 스토리",
    audience: "유아 ~ 초등 저학년",
    method: "놀이·오감 활동",
    strength: "재미와 흥미로 수학 입문",
    difficulty: 1,
    difficultyLabel: "쉬움",
    childFit: "수학을 즐겁게 처음 만나는 아이",
    summary: "놀이로 수학을 좋아하게 만드는 프로그램",
    lessons: [
      "블록 카드 매스 블록 수 카드 보드게임",
      "오감 활동으로 수학을 즐겁게 경험",
      "이야기 흐름으로 원리를 자연스럽게 이해",
    ],
    benefits: ["수학 입문과 흥미 유발", "스스로 생각하고 표현하는 시간", "수학에 대한 긍정적인 첫인상"],
    age: "유아 ~ 초등 저학년",
    imageSrc: "/images/math/yorisu-activity.png",
    seoPath: "/courses/young-children-math",
    materialScore: 4,
    curriculumScore: 3,
    thinkingScore: 3,
    tone: "mint",
  },
  {
    name: "씨투엠(C2M)",
    englishName: "C2M",
    keyword: "사고력과 교과를 함께 키우는 수학",
    philosophy: "사고력 + 교과 심화",
    audience: "5세 ~ 초등",
    method: "교재 + 교구 + 사고력 문제",
    strength: "사고력과 교과를 함께 강화",
    difficulty: 4,
    difficultyLabel: "도전",
    childFit: "학교 수학까지 탄탄히 잡고 싶은 아이",
    summary: "사고력과 교과를 함께 키우는 프로그램",
    lessons: [
      "교구 활동과 원리 이해를 함께 설계",
      "사고력 문제 풀이로 해결 전략 연습",
      "교과 연계로 학교 수학까지 연결",
    ],
    benefits: ["사고력 향상과 교과 실력 강화", "문제를 끝까지 해결하는 힘", "초등 이후 연산과 문장제 기반"],
    age: "5세 ~ 초등학생",
    imageSrc: "/images/math/c2m-activity.png",
    seoPath: "/courses/elementary-lower-grades",
    materialScore: 4,
    curriculumScore: 5,
    thinkingScore: 5,
    tone: "blue",
  },
];

export const growthSteps = [
  { title: "놀이", description: "교구와 게임으로 수학을 즐겁게 만나요" },
  { title: "개념 이해", description: "직접 만지고 관찰하며 원리를 발견해요" },
  { title: "사고력", description: "여러 방법으로 해결하며 생각의 폭을 넓혀요" },
  { title: "교과 연결", description: "배운 원리를 학교 수학에 자연스럽게 연결해요" },
  { title: "자신감", description: "스스로 풀어내는 기쁨으로 수학 자신감을 키워요" },
];

export const recommendations = [
  {
    title: "만들고 조작하는 활동을 좋아하는 아이",
    description: "게임과 교구로 개념을 즐겁게 이해해요.",
    program: "플레이팩토",
    tone: "orange" as const,
    imageSrc: "/images/math/playfacto-activity.png",
  },
  {
    title: "수학이 처음이거나 흥미가 필요한 아이",
    description: "놀이를 통해 수학을 즐겁게 시작해요.",
    program: "요리수 수학",
    tone: "mint" as const,
    imageSrc: "/images/math/yorisu-activity.png",
  },
  {
    title: "학교 수학도 함께 잘하고 싶은 아이",
    description: "사고력과 교과를 함께 강화해요.",
    program: "씨투엠(C2M)",
    tone: "blue" as const,
    imageSrc: "/images/math/c2m-activity.png",
  },
];

export interface ClassTime {
  age: string;
  duration: string;
  note?: string;
}

export const classTimes: ClassTime[] = [
  { age: "5~6세", duration: "50분" },
  { age: "7세 이상", duration: "70분" },
  { age: "9세 이상", duration: "90분", note: "사고력 수업 추가 시" },
];

export const toneClasses: Record<
  ProgramTone,
  { badge: string; text: string; surface: string; border: string; fill: string }
> = {
  orange: {
    badge: "bg-[#fff0df] text-[#e86f00]",
    text: "text-[#e86f00]",
    surface: "bg-[#fff8f1]",
    border: "border-[#ffc887]",
    fill: "bg-[#ff8a1f]",
  },
  mint: {
    badge: "bg-[#e8f8ed] text-[#27834a]",
    text: "text-[#27834a]",
    surface: "bg-[#f4fbf5]",
    border: "border-[#a9ddba]",
    fill: "bg-[#53b875]",
  },
  blue: {
    badge: "bg-[#eaf4ff] text-[#2875c8]",
    text: "text-[#2875c8]",
    surface: "bg-[#f4f9ff]",
    border: "border-[#afd2f6]",
    fill: "bg-[#4d98e8]",
  },
};
