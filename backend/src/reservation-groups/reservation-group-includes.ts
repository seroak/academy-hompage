import { Prisma } from '../generated/prisma/client.js';

/**
 * 그룹을 반환하는 모든 API(GET 목록/상세, 생성, 멤버 추가/이동/시간 교체)가 공유하는
 * include 형태. reservations를 빠뜨리면 프론트 낙관적 캐시가 서버 응답으로 그룹을
 * 덮어쓸 때 멤버 0명으로 착각해 "빈 수업"으로 잘못 렌더링한다(실제로 겪은 버그).
 */
export const FULL_GROUP_INCLUDE = {
  slots: true,
  reservations: { include: { preferredSlots: true } },
} satisfies Prisma.ReservationGroupInclude;
