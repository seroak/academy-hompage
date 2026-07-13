# Global Codex Behavior Rules

## Instruction File Sync

- `AGENTS.md`와 `CLAUDE.md`의 프로젝트 기술·아키텍처·검증·작업 규칙은 같은 의도로 유지한다.
- 도구별 전역 행동 규칙은 각 진입점에만 둘 수 있다.

## Working Style

- 한국어로 응답하고 사용자의 말투를 따른다. 이모지와 요청되지 않은 제3언어를 쓰지 않는다.
- 간결하고 행동 중심으로 답한다. 구조적 비교·버그 목록·변경 요약은 표로 제시한다.
- 단답 승인과 합의된 계획은 즉시 실행한다. 이미 승인된 범위를 다시 묻지 않는다.
- "확인이 필요합니다"라고 물었다면 실제 사용자 응답 전에는 실행하지 않는다.
- 평가·계획·분석은 채팅에만 출력한다. 사용자가 요청하지 않은 보고 파일은 만들지 않는다.
- 코드 변경은 TDD(RED-GREEN)로 진행한다. 문서 작업은 예외다.
- `update-agents` 스킬을 완료 전 실행하고, 재사용 가능한 프로젝트 전반 교훈이 있을 때만 이 파일을 갱신한다.

## Verification and Security

- 완료 전 관련 테스트·빌드와 위험에 비례한 실제 동작을 확인하고, 실제 출력·통과 수를 보고한다.
- 필수 검증을 못 했으면 구현과 검증 상태를 분리하고 미실행 검증을 남은 작업으로 명시한다. 이를 "완료", "정상", "통과"로 표현하지 않는다.
- 카운트 가능한 수치, 파일 존재, DOM·API 동작은 직접 확인한 뒤 보고한다. 사실과 추측을 구분한다.
- 채팅에 노출된 키·토큰·쿠키·비밀번호는 시크릿으로 취급한다. 로그나 파일에 남기지 말고 재발급을 권고한다.
- 되돌릴 수 없는 제출·결제·지원은 임시저장 후 사용자 확인을 받는다. 소셜 로그인과 채팅 비밀번호 입력은 자동화하지 않는다.

## Session Continuity

- 재개·압축 후에는 `HANDOFF.md` 또는 `docs/solutions/`를 먼저 읽고, 핵심 파일은 다시 확인한다.
- 서브에이전트 오류는 즉시 알리고, 대체 가능하면 inline으로 이어간다.
- 브라우저 자동화 전에는 사용자 화면에 탭이 열릴 수 있음을 알린다.

# academy-hompage

공개 학원 사이트와 관리자 CRUD를 제공한다. `backend/`(NestJS)와 `frontend/`(Next.js)는 분리된 프로젝트다.

## Quick Start

```bash
# 새 워크트리
./scripts/create-worktree.sh <작업명>

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
npm run build
npm run seo:audit
```

- 새 워크트리는 수동 `git worktree add` 대신 반드시 `./scripts/create-worktree.sh <작업명>`으로 만든다. 이 명령이 `.env` 링크, 양쪽 `npm ci`, Prisma Client 생성을 함께 처리한다.
- 백엔드 테스트는 반드시 `npm test`로 실행한다. ESM 설정 때문에 `npx jest` 직접 실행은 실패한다.
- 프론트엔드에는 별도 단위 테스트 러너가 없다. 타입 검사는 `npx tsc --noEmit`, 동작 검증은 Playwright E2E를 사용한다.
- SEO·공개 페이지 성능 변경은 production build 후 `npm run seo:audit`으로 핵심 URL 게이트를 확인한다.
- 새 dev 서버 전 포트 3000·3001 점유와 기존 서버가 최신 watch 프로세스인지 확인한다.

## Read the Relevant Guide Before Changing

| 변경 영역 | 가이드 |
|---|---|
| API, 인증, 폼, TanStack Query, React, 예약 그룹 | [architecture.md](docs/agent-guides/architecture.md) |
| Playwright, 실제 서버 검증, 생성 파일, 테스트 데이터 | [testing.md](docs/agent-guides/testing.md) |
| Prisma schema, migration, seed | [prisma.md](docs/agent-guides/prisma.md) |
| Docker, Vercel, 도메인, 배포 | [deployment.md](docs/agent-guides/deployment.md) |
| Git, 커밋, 장기 작업 | [workflow.md](docs/agent-guides/workflow.md) |

## Non-Negotiable Project Rules

- 쓰기 API는 `JwtAuthGuard`, 공개 GET은 가드 없이 둔다. 개인정보 GET만 메서드 단위 가드를 유지한다.
- 프론트 API 응답은 Zod로 파싱하고 `as T` 단언을 쓰지 않는다. 프론트 검증과 별개로 Nest DTO에서도 입력을 검증한다.
- `DELETE`는 204를 반환한다.
- Prisma schema·migration 변경은 대상 DB에 적용하고 실제 API 요청으로 검증한다.
- 통합 경로 변경은 양쪽 서버와 Playwright 또는 curl로 확인한다. 정적 단일 영역 변경에 양쪽 서버를 강제하지 않는다.
- 운영 Compose 명령은 프로젝트 루트에서 실행한다. 루트 `.env.production`은 Compose 치환용이고, 백엔드 런타임 환경변수는 `backend/.env.production`에서 관리한다.
- `(healthy)`는 백엔드·DB 상태만 확인한다. OAuth 등 외부 연동 설정은 실제 흐름으로 별도 검증한다.
- lint 경고 해결에 임계값 상향·규칙 비활성화·예외 추가를 쓰려면 먼저 사용자 승인을 받는다.
- E2E·빌드 후 `git status`와 diff로 생성 파일 변경을 확인한다. 기존 사용자 변경은 덮어쓰지 않는다.
- 공유 DB에 남는 테스트 데이터만 식별자·삭제 여부를 보고한다. 전용 임시 DB는 계획대로 폐기하고 사실만 보고한다.
