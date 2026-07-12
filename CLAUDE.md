# academy-hompage 프로젝트 안내

## 지침 파일 동기화

- `CLAUDE.md`와 `AGENTS.md`의 프로젝트 기술·아키텍처·검증·작업 규칙은 같은 의도로 유지한다.
- 도구별 전역 행동 규칙은 각 진입점에만 둘 수 있다.

## 스킬 사용

- 작업 완료 전 `update-agents` 스킬을 실행한다. 재사용 가능한 프로젝트 전반 교훈이 있을 때만 지침 파일을 갱신한다.

## 빠른 실행

```bash
# backend
cd backend
docker compose up -d
npx prisma migrate dev
npm run prisma:generate
npm run prisma:seed
npm run start:dev
npm test

# frontend
cd frontend
npm run dev
npx tsc --noEmit
npx playwright test
```

- 백엔드 테스트는 ESM 설정 때문에 반드시 `npm test`로 실행한다.
- 프론트엔드에는 별도 단위 테스트 러너가 없다. 타입 검사는 `npx tsc --noEmit`, 동작 검증은 Playwright E2E를 사용한다.
- 새 dev 서버 전 포트 3000·3001 점유와 기존 서버의 최신 watch 상태를 확인한다.

## 변경 전 읽을 가이드

| 변경 영역 | 가이드 |
|---|---|
| API, 인증, 폼, TanStack Query, React, 예약 그룹 | [architecture.md](docs/agent-guides/architecture.md) |
| Playwright, 실제 서버 검증, 생성 파일, 테스트 데이터 | [testing.md](docs/agent-guides/testing.md) |
| Prisma schema, migration, seed | [prisma.md](docs/agent-guides/prisma.md) |
| Docker, Vercel, 도메인, 배포 | [deployment.md](docs/agent-guides/deployment.md) |
| Git, 커밋, 장기 작업 | [workflow.md](docs/agent-guides/workflow.md) |

## 필수 프로젝트 규칙

- 쓰기 API는 `JwtAuthGuard`, 공개 GET은 가드 없이 둔다. 개인정보 GET만 메서드 단위 가드를 유지한다.
- 프론트 API 응답은 Zod로 파싱하고 `as T` 단언을 쓰지 않는다. 프론트 검증과 별개로 Nest DTO에서도 입력을 검증한다.
- `DELETE`는 204를 반환한다.
- Prisma schema·migration 변경은 대상 DB에 적용하고 실제 API 요청으로 검증한다.
- 통합 경로 변경은 양쪽 서버와 Playwright 또는 curl로 확인한다. 정적 단일 영역 변경에 양쪽 서버를 강제하지 않는다.
- 필수 검증을 못 했으면 구현과 검증 상태를 분리하고 미실행 검증을 남은 작업으로 명시한다.
- lint 경고 해결에 임계값 상향·규칙 비활성화·예외 추가를 쓰려면 먼저 사용자 승인을 받는다.
- E2E·빌드 후 `git status`와 diff로 생성 파일 변경을 확인한다. 기존 사용자 변경은 덮어쓰지 않는다.
- 공유 DB에 남는 테스트 데이터만 식별자·삭제 여부를 보고한다. 전용 임시 DB는 계획대로 폐기하고 사실만 보고한다.
