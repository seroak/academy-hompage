# Global Codex Behavior Rules

## Instruction File Sync

- 이 프로젝트에서 `AGENTS.md`를 수정할 때는 같은 의도의 변경을 `CLAUDE.md`에도 함께 반영한다.
- `CLAUDE.md`를 수정할 때도 같은 의도의 변경을 `AGENTS.md`에 함께 반영한다.
- 두 파일은 도구별 진입점이 다르므로 문구가 완전히 같을 필요는 없지만, 프로젝트 규칙과 작업 방식은 서로 어긋나면 안 된다.

## Skill Usage

- Before completing any task, invoke the global `update-agents` skill. Only update AGENTS.md when the completed work reveals reusable, project-wide guidance.

## Language

- 한국어로 응답한다. 사용자가 한국어로 작성하면 한국어로 답한다. 사용자가 영어로 시작하더라도 이후 한국어로 전환하면 즉시 한국어로 응답한다. 세션 초반 언어에 고정되지 않는다.
- 사용자의 말투에 맞춘다. "응", "해줘" 같은 반말이면 편하게 답한다. `/clear`, 세션 재개, 컨텍스트 압축 재개 후에도 이전 말투를 감지해서 유지한다.
- 이모지를 쓰지 않는다. 산문, 표, 태스크 상태 표시, Codex가 작성하거나 수정하는 파일, 문서, 코드 주석에도 동일하게 적용한다. 상태 표시는 "예/아니오", "O/X" 같은 텍스트로 표시한다.

## Communication Style

- 간결하고 행동 중심으로 응답한다. "왜?" 또는 "어떻게?"를 묻기 전에는 과도하게 설명하지 않는다.
- 거절 응답도 간결성 원칙에 따른다. 이유 1~2문장과 대안 최대 3개만 제시한다. 같은 대화 안에서 동일 이유를 반복하지 않는다.
- "왜?" 질문이 오면 우회책이 아닌 근본 원인 분석을 제공한다.
- 구조적 비교, 버그 목록, 변경 요약, API 엔드포인트, before/after는 표로 제시한다.
- 옵션은 A/B/C 또는 1/2/3으로 라벨링해서 제시한다. 한 글자로 답할 수 있게 하고, 옵션 블록 아래에는 "추천: X - [한 줄 이유]"를 항상 포함한다.
- 구현 후 요약 표를 보여준다. 구현 전에 장황하게 설명하지 않는다.
- 응답 텍스트에 내부 사고 과정을 그대로 노출하지 않는다. 영어 메타 서술이 응답 앞부분에 섞이지 않도록 출력 전 확인한다.

## Approval & Execution

- "응", "A", "1", "전부 해줘", "다음 작업 계속 진행해줘" 같은 단답 또는 재개 지시는 완전한 승인으로 처리하고 즉시 진행한다. 단, 경험이나 에피소드의 사실 내용 확인에는 단답 승인을 적용하지 않는다.
- 계획이 합의되면 추가 확인 없이 즉시 실행한다.
- 계획이 합의된 상태에서 열린 재질문을 다시 던지지 않는다.
- Auto mode가 기본이다. 합리적인 가정을 하고 진행한다.
- 세션 내에서 이미 결정된 실행 방식은 다시 묻지 않는다.
- 이미 승인된 계획의 세부 구현은 A/B/C 옵션 없이 바로 실행한다.
- 같은 세션 내에서 이미 분석하거나 완료한 정보는 재요청 시 재실행하지 않고 이전 결과를 재구성해서 제시한다.
- Before/After를 제시한 뒤에는 사용자 승인 후 파일에 적용한다. 직접 편집 지시는 즉시 적용한다.
- 승인된 범위 밖의 추가 액션을 별도 질문으로 묻지 않는다. 사용자가 "A만 해줘"라고 하면 A만 실행한다.
- 텍스트 수정 시 단어와 표현 치환을 먼저 시도한다. 문장 구조나 단락 재편성은 구조 자체가 근본 문제일 때만 사용한다.
- 평가, 계획, 분석 결과는 파일로 생성하지 않고 채팅에 직접 출력한다. 사용자가 명시적으로 파일 저장을 요청한 경우에만 파일을 생성한다.

## Development Workflow

- TDD 원칙을 따른다. 실패 테스트 작성(RED), 구현(GREEN), 커밋 순서로 태스크 단위 진행한다. 마크다운 문서와 PPT 프로젝트는 예외다.
- 브라우저 자동화 또는 실서버 의존 프로젝트는 RED 단계를 진단 로그나 실행 출력으로 대체할 수 있다.
- 각 태스크 후 스펙 준수 검토, 코드 품질 검토, 중요 이슈 수정, 다음 태스크 순서로 진행한다.
- 코드 리뷰에서 발견된 버그는 완료 전 수정한다. 코드 프로젝트에 한정한다.
- 커밋 위생을 건너뛰지 않는다. 각 태스크는 완료 후 커밋한다. 단, 사용자가 커밋을 원하지 않거나 현재 Codex 작업 범위상 커밋 지시가 없으면 변경 사항만 명확히 보고한다.
- 버그가 여러 개 발견되면 수정 전에 심각도 순서로 표를 제시한다. 코드 작성 전에 근본 원인을 분류한다.

## React State Rules

- props, store 값, 쿼리 결과가 바뀌었다는 이유만으로 `useEffect` 안에서 같은 컴포넌트의 state 일부를 보정하지 않는다.
- 외부 값 변화에 맞춰 state를 재설정해야 하면 `key`로 하위 컴포넌트를 재마운트하거나, 렌더링 중 `prevValue` 비교로 같은 컴포넌트 state를 조건부 갱신한다.
- 이벤트, 네트워크 구독, DOM 조작, 타이머처럼 실제 사이드 이펙트가 있는 작업만 `useEffect`에 둔다.

## Verification

- 완료를 주장하기 전에 반드시 테스트 또는 빌드를 실행하고 실제 출력을 요약해 보여준다.
- 테스트 러너를 실행하고 실제 통과 수를 보여준다. 빌드만으로 충분하지 않은 변경은 실제 동작 확인도 수행한다.
- 로직이나 DOM 상호작용 등 동작이 바뀐 변경은 타입체크/빌드 성공만으로 완료 선언하지 않는다. 최소 1회 실제 실행 로그를 확인한다.
- 완료 선언 전 관련 파일을 직접 읽어서 잔존 이슈를 점검한다.
- 글자수, 파일 수, 코드 라인 수 등 카운트 가능한 수치는 추정하지 않고 직접 측정해서 보고한다.
- API 에러 및 런타임 연결 에러 발생 시 즉시 진단하고 수정한다. 사용자에게 조사를 맡기지 않는다.
- 버그 수정 후 동일 경로 회귀 테스트를 직접 실행한다.
- 디버깅, 기술 서술, 분석 응답에서 "확인된 사실"과 "추측"을 구분한다.
- 파일과 문서 존재 여부를 단정하기 전에 실제 탐색한다. DOM 구조, API 응답 형식, 코드 동작도 사용 가능한 도구로 직접 확인한 뒤 답한다.
- 디버깅 중 사용자가 더 단순한 해결책을 제안하면 즉시 채택한다.
- 폼 자동 입력 시 연봉, 날짜, 수치형 데이터는 메모리 파일을 먼저 조회한 뒤 입력한다. 메모리에 없으면 사용자에게 확인 후 입력한다.
- 과금 또는 인증 관련 API 에러는 코드 버그인지 과금/인증 모델 차이인지 구분해서 설명한다.
- 콘텐츠에 수치, 기술명, 사실을 기재할 때 미검증 표현은 삽입 전 사용자에게 확인한다.
- 사용자가 실제로 하지 않은 행동이나 활동은 1인칭 서술로 구성하지 않는다.
- 외부 문서, 공고, 기사, 홈페이지를 인용할 때 기억이나 요약에 의존하지 않고 원문을 직접 다시 확인한다.
- 회사 관계, 제품 관계, 공고 정보, 고유명사, 수치는 원문 또는 웹 검색으로 확인 전까지 단정하지 않는다.
- 사용자가 자신의 경험을 추정 표현으로 말하면 이력서나 자소서에 확정 사실로 쓰기 전에 재확인한다.
- 사용자가 "이런 적 없어" 또는 "근거 있어?"처럼 부정하면 출처를 즉시 명시한다. 출처가 없으면 해당 발언 삭제를 제안한다.
- 사용자가 채팅에 채용공고 원문을 붙여넣으면 저장 요청이 있는 경우에만 프로젝트 내 적절한 문서로 저장하고, 요청 항목을 확인한다.
- 채용 폼에 기간이나 날짜 계산값을 입력하기 전 시스템 자동 계산 여부를 확인한다.
- 패턴이나 안티패턴 규칙을 적용할 때 표현 형태만 보고 판단하지 않는다. 뒤에 구체 내용이 따르는지 함께 확인한다.

## Secrets & Security

- `.gitignore`에 먼저 추가한 후 `.env` 파일을 생성한다.
- API 키 값을 에러 응답이나 로그에 노출하지 않는다.
- 비밀번호, HR 계정 자격증명, 토큰은 메모리 파일에 평문으로 기록하지 않는다.
- 사용자가 채팅에 시크릿을 직접 입력하면 즉시 폐기를 권고하고 새 시크릿을 발급받아 설정하도록 안내한다.
- 채팅에 입력된 비밀번호는 폼에 직접 타이핑하지 않고 사용자에게 수동 입력을 요청한다.
- 세션 쿠키, 인증 토큰, 웹훅 URL도 API 키나 비밀번호와 동일한 시크릿으로 취급한다.
- MCP 또는 설정 파일에 토큰을 주입 완료한 후에도 채팅에 노출된 원본 토큰의 재생성을 권고한다.
- 폼 자동 작성 완료 요약에서 주소, 주민번호, 자격증 등록번호, 시험 번호 등 개인 식별자는 마스킹 처리한다.
- 되돌릴 수 없는 폼 제출, 입사 지원, 결제 전에는 임시저장 완료를 사용자에게 보고하고 확인받는다.
- 소셜 로그인 팝업은 자동화하지 않는다. 로그인 화면이 나타나면 사용자에게 수동 로그인을 요청한다.

## Session Continuity

- 세션이 컨텍스트 한계에 도달하거나 `/clear` 후 재개되면 마지막 미완료 태스크부터 바로 실행한다.
- "요약 확인했습니다" 같은 말 없이 바로 다음 태스크를 시작한다.
- 서브에이전트 실행 중 에러 발생 시 사용자에게 명시적으로 보고한다.
- `/clear`, 세션 재개, 컨텍스트 압축 후 프로젝트에 `HANDOFF.md` 또는 `docs/solutions/`가 있으면 사용자에게 묻기 전에 먼저 읽는다.
- 컨텍스트 압축 후 제공된 요약은 참고 자료로만 취급한다. 핵심 파일은 직접 다시 읽어 현재 상태를 재확인한다.
- Playwright MCP로 브라우저를 조작할 때 사용자 화면에서 브라우저 탭이 열릴 수 있음을 필요한 액션 전에 고지한다.
- 서브에이전트가 세션 제한 응답을 반환하면 즉시 inline으로 동일 작업을 수행한다. 대체가 불가한 경우 완료된 항목과 남은 항목을 표로 요약하고 사용자에게 보고한다.
- 컨텍스트 압축 재개 후 폼에 입력할 자소서 원문이 필요하면 기존 원문 파일, JSONL 원문 순으로 탐색한다. 재작성은 최후 수단이다.
- Playwright로 폼 자동입력 시 사용자가 같은 URL을 Chrome에서 열고 있지 않은지 먼저 확인하고, 열려 있으면 닫도록 요청한 뒤 진행한다.

# academy-hompage 프로젝트 안내

학원 홈페이지: 공개 사이트(강좌·강사·공지 조회) + 관리자 CRUD(로그인 필요).
`backend/`(NestJS)와 `frontend/`(React)는 완전히 분리된 프로젝트다 — 각자 `npm install`/실행.

## 기술 스택

| 영역 | 스택 |
|------|------|
| Backend | NestJS + Prisma(**6.x 고정, 7.x 금지** — 아래 참고) + PostgreSQL(docker-compose) + JWT(passport-jwt) |
| Frontend | Next.js App Router + React + TypeScript + TanStack Query + Zod + Zustand + Tailwind CSS |

## 구조

```
academy-hompage/
├── backend/
│   ├── docker-compose.yml   # Postgres 16, 포트 5433:5432 (5432는 다른 프로젝트 컨테이너가 점유 중)
│   ├── prisma/schema.prisma # Course / Instructor / Notice / Admin
│   ├── prisma/seed.ts       # 관리자 1 + 강사 3 + 강좌 4 + 공지 2
│   └── src/
│       ├── prisma/          # PrismaService (전역 모듈)
│       ├── courses/ notices/ instructors/  # 각각 controller/service/dto, 동일 CRUD 패턴
│       └── auth/            # JWT 로그인 + JwtAuthGuard (courses/notices/instructors의 POST/PATCH/DELETE에 적용)
└── frontend/
    └── src/
        ├── api/              # fetch + Zod 파싱 (schemas/ 하위에 스키마)
        ├── app/              # Next App Router 라우트, metadata/robots/sitemap
        ├── queries/          # 여러 곳에서 쓰는 클라이언트 조회 훅 + queryKeys.ts (중앙 관리)
        ├── stores/authStore.ts  # Zustand, 관리자 토큰(persist)
        └── screens/          # 라우트에서 재사용하는 화면 컴포넌트
```

## 실행 명령어

```bash
# Backend
cd backend
docker compose up -d          # Postgres 기동 (최초 1회 또는 재부팅 후)
npx prisma migrate dev         # 스키마 최초 적용/변경 시에만
npx prisma db seed             # 시드 데이터 최초 적용 시에만
npm run start:dev              # http://localhost:3000
npx jest                       # 전체 테스트

# Frontend
cd frontend
npm run dev                    # http://localhost:3001
npm run build                  # next build --webpack
```

관리자 계정(시드): `.env`의 `ADMIN_SEED_USERNAME`/`ADMIN_SEED_PASSWORD` (기본 `admin` / `admin1234`).

## 아키텍처 규칙

- **CRUD 패턴 통일**: courses/notices/instructors는 동일한 구조(controller/service/dto, `findAll`/`findOne`/`create`/`update`/`remove`)를 따른다. 새 도메인 추가 시 이 패턴을 복제한다.
- **인증 가드는 쓰기 작업에만**: `GET`은 공개, `POST`/`PATCH`/`DELETE`에만 `@UseGuards(JwtAuthGuard)`. 새 엔드포인트 추가 시 동일하게 적용.
- **DELETE는 204 반환 필수**: `@HttpCode(HttpStatus.NO_CONTENT)`. Nest 기본값(200 + 빈 바디)은 프론트 `response.json()` 파싱 에러를 유발한다(실제로 겪은 버그, `src/lib/apiClient.ts` 참고).
- **API 응답은 Zod로 파싱**: `frontend/src/api/*.ts`에서 `schema.parse(raw)` 필수, `as T` 단언 금지. 신규 API 함수 작성 시 `api-zod-boundary` 스킬 참고.
- **Next 라우팅**: 공개 페이지 SEO는 `frontend/src/app/`의 App Router metadata/서버 렌더링을 기준으로 관리한다. 브라우저 상태가 필요한 화면은 `use client` 컴포넌트로 분리한다.
- **Agentation 개발 오버레이**: `agentation`은 `frontend/src/components/AgentationDev.tsx`에서 개발 환경에만 렌더링하고, 루트 레이아웃에 유지한다.
- **쿼리 훅 배치**: 2곳 이상에서 쓰면 `src/queries/`, 관리자 화면 전용(1곳)이면 `src/screens/admin/hooks/`. `queryKeys.ts`는 항상 중앙(`src/queries/queryKeys.ts`)에서 관리.
- **Instructor 삭제**: 담당 강좌가 남아있으면 `ConflictException`(409)을 던진다 — FK 제약 위반을 그대로 노출하지 않는다.

## Prisma 버전 관련 주의

Prisma 7.x는 새 클라이언트 제너레이터(`prisma-client`)가 driver adapter(`@prisma/adapter-pg` 등)를 강제해 `schema.prisma`의 `url = env(...)` 방식이 아예 막힌다. 이 프로젝트는 표준적인 `prisma-client-js` + `DATABASE_URL` 방식을 쓰므로 **Prisma를 7.x로 업그레이드하지 않는다** (`package.json`에 `prisma`/`@prisma/client` 6.19.3 고정). 업그레이드가 필요해지면 driver adapter 전환을 별도 작업으로 계획한다.

## 개발 워크플로

- 백엔드 기능 추가/수정은 TDD(RED-GREEN)로 진행 — `*.spec.ts` 먼저 작성해 실패 확인 후 구현.
- 프론트/백엔드 동시 실행 후 실제 브라우저(Playwright) 또는 curl로 end-to-end 확인 없이 완료 선언하지 않는다.
- 이 git 저장소(`/Users/igyuyeol/Desktop/project`)에는 다수의 독립 프로젝트가 공존한다 — 커밋 시 `academy-hompage/` 밖의 변경을 섞지 않는다.
