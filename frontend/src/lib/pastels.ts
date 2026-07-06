// 러셀 스타일 카드에서 순환 사용하는 파스텔 배경 톤.
// index % PASTELS.length 로 카드마다 돌려가며 사용한다.
export const PASTELS = ['bg-violet-50', 'bg-sky-50', 'bg-blue-50', 'bg-amber-50'] as const

export function pastelFor(index: number): string {
  return PASTELS[index % PASTELS.length]
}
