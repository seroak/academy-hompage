export interface SeoLandingContent {
  slug: 'young-children-math' | 'thinking-math' | 'elementary-lower-grades' | 'heungdeok-math'
  title: string
  metaTitle: string
  description: string
  ogImage: string
  keywords: string[]
  eyebrow: string
  intro: string
  heroImage: { src: string; alt: string }
  features: Array<{ title: string; description: string }>
  recommendedFor: string[]
  programs: string[]
  tone: 'sun' | 'leaf' | 'sky'
}

export const programMedia: Record<string, { src: string; alt: string }> = {
  플레이팩토: { src: '/images/math/playfacto-activity.png', alt: '교구와 게임으로 수학 활동을 하는 아이들' },
  '요리수 연산': { src: '/images/math/yorisu-activity.png', alt: '놀이와 이야기로 수학을 배우는 아이들' },
  '씨투엠(C2M)': { src: '/images/math/c2m-activity.png', alt: '사고력 문제를 함께 해결하는 아이들' },
}

export const seoLandingPages: SeoLandingContent[] = [
  {
    slug: 'young-children-math',
    title: '흥덕 유아 수학, 놀이에서 시작하는 첫 수학',
    metaTitle: '흥덕 유아 수학 | 놀이·교구로 시작하는 첫 수학',
    description:
      '용인 흥덕 유아 수학 수업. 플레이팩토와 요리수 연산의 놀이·교구 활동으로 수와 도형을 즐겁게 만나고 생각을 말하는 힘을 키웁니다.',
    ogImage: '/images/og/young-children-math.webp',
    keywords: ['흥덕 유아 수학', '용인 유아 수학', '유치부 수학학원', '플레이팩토', '요리수 연산'],
    eyebrow: '유아의 첫 수학 경험',
    intro:
      '처음 만나는 수학은 정답을 빨리 찾는 시간보다 직접 만지고, 비교하고, 자기 말로 설명하는 경험이어야 합니다. 아이가 부담 없이 몰입하도록 놀이에서 개념으로 이어지는 흐름을 설계합니다.',
    heroImage: { src: '/images/math/yorisu-activity.png', alt: '놀이와 교구로 수학을 처음 만나는 유아' },
    features: [
      { title: '만지고 발견하기', description: '교구를 움직이며 수와 도형의 관계를 눈과 손으로 확인합니다.' },
      { title: '놀이에서 개념으로', description: '게임과 이야기로 시작한 활동을 수학 언어와 개념으로 연결합니다.' },
      { title: '자기 말로 설명하기', description: '무엇을 발견했는지 말하며 관찰력과 표현력을 함께 기릅니다.' },
    ],
    recommendedFor: [
      '수학을 즐거운 경험으로 시작하고 싶은 유아',
      '교구를 만지고 조작하는 활동을 좋아하는 아이',
      '문제를 풀기 전에 관찰하고 설명하는 힘을 기르고 싶은 아이',
    ],
    programs: ['플레이팩토', '요리수 연산'],
    tone: 'sun',
  },
  {
    slug: 'thinking-math',
    title: '흥덕 사고력 수학, 생각하는 힘을 기르는 수업',
    metaTitle: '흥덕 사고력 수학 | 관찰·비교·설명 중심 수업',
    description:
      '용인 흥덕 사고력 수학 수업. 플레이팩토, 요리수 연산, 씨투엠으로 관찰하고 비교하며 여러 해결 방법을 설명하는 힘을 기릅니다.',
    ogImage: '/images/og/thinking-math.webp',
    keywords: ['흥덕 사고력 수학', '용인 사고력 수학', '기흥 사고력 수학', '플레이팩토', '씨투엠'],
    eyebrow: '답보다 과정을 보는 수학',
    intro:
      '사고력은 어려운 문제를 많이 푸는 것만으로 자라지 않습니다. 조건을 살피고, 서로 다른 방법을 비교하고, 선택한 이유를 설명하는 수업 속에서 문제를 끝까지 해결하는 힘을 키웁니다.',
    heroImage: { src: '/images/math/playfacto-activity.png', alt: '교구 블록으로 사고력 활동을 하는 아이들' },
    features: [
      { title: '조건을 관찰하기', description: '문제에 주어진 정보와 관계를 차분히 찾는 습관을 만듭니다.' },
      { title: '방법을 비교하기', description: '한 가지 풀이에 머물지 않고 여러 해결 전략의 차이를 살펴봅니다.' },
      { title: '생각을 설명하기', description: '답에 이른 과정을 말과 그림으로 표현하며 논리성을 다집니다.' },
    ],
    recommendedFor: [
      '정답은 찾지만 풀이 과정을 설명하기 어려운 아이',
      '새로운 문제를 만나면 쉽게 포기하는 아이',
      '교과 수학과 함께 유연한 문제 해결력을 기르고 싶은 아이',
    ],
    programs: ['플레이팩토', '요리수 연산', '씨투엠(C2M)'],
    tone: 'leaf',
  },
  {
    slug: 'elementary-lower-grades',
    title: '초등 저학년 수학, 개념과 사고력을 함께',
    metaTitle: '흥덕 초등 저학년 수학학원 | 개념·사고력 수업',
    description:
      '용인 흥덕 초등 저학년 수학 수업. 씨투엠과 교구 활동으로 개념을 이해하고 사고력 문제와 교과 학습까지 자연스럽게 연결합니다.',
    ogImage: '/images/og/elementary-lower-grades.webp',
    keywords: ['흥덕 초등 수학', '초등 저학년 수학학원', '용인 초등 수학', '기흥 수학학원', '씨투엠'],
    eyebrow: '초등 수학의 단단한 시작',
    intro:
      '초등 저학년은 계산 속도만큼 개념을 정확히 이해하고 문제를 읽는 습관이 중요합니다. 교구로 원리를 확인한 뒤 사고력 문제와 교과 표현으로 연결해 학교 수학의 기초를 다집니다.',
    heroImage: { src: '/images/math/c2m-activity.png', alt: '사고력 문제를 함께 풀어보는 초등 저학년 아이들' },
    features: [
      { title: '원리를 먼저 이해하기', description: '교구와 그림으로 연산과 도형의 원리를 확인한 뒤 기호로 표현합니다.' },
      { title: '문제를 읽는 습관', description: '조건과 질문을 구분하고 필요한 정보를 찾는 과정을 연습합니다.' },
      { title: '교과까지 연결하기', description: '사고 활동에서 발견한 개념을 교과 문제와 문장제로 확장합니다.' },
    ],
    recommendedFor: [
      '초등 수학의 개념을 차근차근 이해하고 싶은 저학년',
      '연산은 가능하지만 문장제와 응용 문제를 어려워하는 아이',
      '사고력과 학교 수학을 균형 있게 준비하고 싶은 아이',
    ],
    programs: ['요리수 연산', '씨투엠(C2M)'],
    tone: 'sky',
  },
  {
    slug: 'heungdeok-math',
    title: '흥덕 수학학원, 유치부부터 초등 저학년까지',
    metaTitle: '흥덕 수학학원 | 용인 흥덕 유치부·초등 저학년 사고력 수학',
    description:
      '경기도 용인시 기흥구 흥덕동 수학학원. 플레이팩토, 요리수 연산, 씨투엠(C2M) 세 과정으로 유치부부터 초등 저학년까지 아이 발달 단계에 맞춰 수업합니다.',
    ogImage: '/images/og/home.webp',
    keywords: ['흥덕 수학학원', '용인 흥덕 수학학원', '기흥 수학학원', '흥덕 유치부 수학학원', '흥덕 저학년 수학학원'],
    eyebrow: '용인시 기흥구 흥덕동 수학학원',
    intro:
      '흥덕2로에 위치한 동네 수학학원입니다. 유아부터 초등 저학년까지, 아이의 현재 발달 단계에 맞는 프로그램을 골라 놀이에서 개념 이해, 사고력, 교과 학습까지 단계적으로 이어갑니다.',
    heroImage: { src: '/images/math/hero-math-activity.png', alt: '교구로 수학 활동을 하는 어린이들' },
    features: [
      { title: '연령에 맞는 프로그램', description: '유아는 놀이와 교구로, 저학년은 개념과 사고력 문제로 시작 지점을 다르게 설계합니다.' },
      { title: '동네에서 꾸준히 다니는 학원', description: '흥덕 지역 아이들이 걸어서 다니며 등하원과 상담이 편리합니다.' },
      { title: '세 과정의 유기적 연결', description: '플레이팩토·요리수 연산·씨투엠을 아이 성장에 따라 자연스럽게 이어갑니다.' },
    ],
    recommendedFor: [
      '흥덕·기흥 인근에서 다닐 수학학원을 찾는 유아·초등 저학년 학부모',
      '놀이에서 시작해 사고력, 교과까지 단계적으로 이어가고 싶은 아이',
      '아이 성향에 맞는 프로그램을 상담받고 싶은 학부모',
    ],
    programs: ['플레이팩토', '요리수 연산', '씨투엠(C2M)'],
    tone: 'sun',
  },
]

export function getSeoLandingContent(slug: SeoLandingContent['slug']): SeoLandingContent {
  const content = seoLandingPages.find((page) => page.slug === slug)
  if (!content) throw new Error(`Unknown SEO landing slug: ${slug}`)
  return content
}
