# Global Codex Behavior Rules

## Instruction File Sync

- 이 프로젝트에서 `AGENTS.md`를 수정할 때는 같은 의도의 변경을 `CLAUDE.md`에도 함께 반영한다.
- `CLAUDE.md`를 수정할 때도 같은 의도의 변경을 `AGENTS.md`에 함께 반영한다.
- 두 파일은 도구별 진입점이 다르므로 문구가 완전히 같을 필요는 없지만, 프로젝트 규칙과 작업 방식은 서로 어긋나면 안 된다.

## Skill Usage

- Before completing any task, invoke the global `update-agents` skill. Only update AGENTS.md when the completed work reveals reusable, project-wide guidance.
- If this skill is not registered in the current environment (invocation fails), judge directly without it — review `CLAUDE.md`/`AGENTS.md` yourself for reusable project-wide guidance from the completed work, and don't silently skip this step.

## Language

- 한국어로 응답한다. 사용자가 한국어로 작성하면 한국어로 답한다. 사용자가 영어로 시작하더라도 이후 한국어로 전환하면 즉시 한국어로 응답한다. 세션 초반 언어에 고정되지 않는다.
- 사용자의 말투에 맞춘다. "응", "해줘" 같은 반말이면 편하게 답한다. `/clear`, 세션 재개, 컨텍스트 압축 재개 후에도 이전 말투를 감지해서 유지한다.
- 이모지를 쓰지 않는다. 산문, 표, 태스크 상태 표시, Codex가 작성하거나 수정하는 파일, 문서, 코드 주석에도 동일하게 적용한다. 상태 표시는 "예/아니오", "O/X" 같은 텍스트로 표시한다.
- 응답 중 의도치 않은 제3언어가 섞이지 않도록 출력 전 확인한다. 한국어/영어 전환뿐 아니라 일본어 등 요청되지 않은 언어가 새어나오는 경우도 동일하게 방지 대상이다.

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

- TDD 원칙을 따른다. 실패 테스트 작성(RED), 구현(GREEN), 사용자 확인 후 커밋 순서로 태스크 단위 진행한다. 마크다운 문서와 PPT 프로젝트는 예외다.
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
- 로직이나 DOM 상호작용 등 동작이 바뀐 변경은 타입체크/빌드 성공만으로 완료 선언하지 않는다. 최소 1회 실제 실행 로그를 확인한다. 로그인 여부·role 등 조건부 분기가 있는 변경은 각 분기를 최소 한 번씩 실제로 실행해 확인한다.
- 완료 선언 전 관련 파일을 직접 읽어서 잔존 이슈를 점검한다.
- 글자수, 파일 수, 코드 라인 수 등 카운트 가능한 수치는 추정하지 않고 직접 측정해서 보고한다.
- API 에러 및 런타임 연결 에러 발생 시 즉시 진단하고 수정한다. 사용자에게 조사를 맡기지 않는다.
- 이미 떠 있는 dev 서버로 E2E 검증을 하기 전, 그 서버가 최신 코드를 반영하는지 확인한다. watch 모드인지 정적 빌드본을 서빙 중인지, 마지막 기동 시각이 최근 변경 시각보다 이전은 아닌지 점검한다.
- 디버깅 중 원인불명의 에러나 상태 변화가 보이면 곧장 자신의 구현 버그로 단정하지 않는다. 같은 dev 서버·브라우저를 다른 세션이 동시에 쓰고 있을 가능성을 먼저 배제하고, 의심되면 curl 등 격리된 방법으로 재확인한다.
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
- 장시간 이어지는 다단계 작업은 진행 상황을 중간중간 짧게 남겨둔다(`HANDOFF.md` 갱신 등). 메인 세션 자체가 한도에 도달해 예고 없이 끊기더라도 다음 세션이 이어받을 수 있도록 한다.
- 컨텍스트 압축 재개 후 폼에 입력할 자소서 원문이 필요하면 기존 원문 파일, JSONL 원문 순으로 탐색한다. 재작성은 최후 수단이다.
- Playwright로 폼 자동입력 시 사용자가 같은 URL을 Chrome에서 열고 있지 않은지 먼저 확인하고, 열려 있으면 닫도록 요청한 뒤 진행한다.

# academy-hompage 프로젝트 안내

학원 홈페이지: 공개 사이트(강좌·강사·공지 조회) + 관리자 CRUD(로그인 필요).
`backend/`(NestJS)와 `frontend/`(React)는 완전히 분리된 프로젝트다 — 각자 `npm install`/실행.

## 기술 스택

| 영역 | 스택 |
|------|------|
| Backend | NestJS + Prisma 7 + PostgreSQL(docker-compose) + JWT(passport-jwt) |
| Frontend | Next.js App Router + React + TypeScript + TanStack Query + Zod + Zustand + Tailwind CSS |

## 구조

```
academy-hompage/
├── docker-compose.prod.yml  # 배포용: postgres + backend + caddy (프론트는 Vercel에 별도 배포, 아래 "배포/인프라" 참고)
├── Caddyfile                # 리버스 프록시. frontend 블록은 현재 이 compose에 대응 컨테이너가 없어 미사용(DNS도 Vercel로 연결됨)
├── .github/workflows/deploy-backend.yml  # main push 시 백엔드 이미지 빌드→GHCR→오라클 서버 SSH 배포 자동화
├── backend/
│   ├── docker-compose.yml   # Postgres 16, 포트 5433:5432 (5432는 다른 프로젝트 컨테이너가 점유 중)
│   ├── Dockerfile           # 배포용 이미지 (아래 "배포/인프라" 주의사항 참고)
│   ├── prisma/schema.prisma # Course / Instructor / Notice / Admin
│   ├── prisma/seed.ts       # 관리자 1 + 강사 3 + 강좌 4 + 공지 2
│   └── src/
│       ├── prisma/          # PrismaService (전역 모듈)
│       ├── courses/ notices/ instructors/  # 각각 controller/service/dto, 동일 CRUD 패턴
│       └── auth/            # JWT 로그인 + JwtAuthGuard, auth-cookies.ts(admin/parent 공용 httpOnly 쿠키 유틸)
└── frontend/
    └── src/
        ├── api/              # fetch + Zod 파싱 (schemas/ 하위에 스키마)
        ├── app/              # Next App Router 라우트, metadata/robots/sitemap
        ├── queries/          # 여러 곳에서 쓰는 클라이언트 조회 훅 + queryKeys.ts (중앙 관리)
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

- 프론트엔드에는 별도 테스트 러너가 없다 — `npx tsc --noEmit`이 사실상의 검증 수단이고, 실제 동작 확인은 브라우저(Playwright)로 한다.
- dev 서버를 새로 띄우기 전 해당 포트(3000/3001)가 이미 점유돼 있는지 먼저 확인한다 — 중복 실행은 `EADDRINUSE`로 조용히 실패할 수 있고, 기존 서버가 stale build(`dist/main`, 옛 `.env`)를 서빙 중이라 방금 수정한 코드가 반영 안 될 수도 있다. E2E 검증 직전에는 기존 프로세스가 watch 모드인지, 최근 변경을 반영했는지 확인한다.

## 아키텍처 규칙

### 공통 CRUD/인증

- **CRUD 패턴 통일**: courses/notices/instructors는 동일한 구조(controller/service/dto, `findAll`/`findOne`/`create`/`update`/`remove`)를 따른다. 새 도메인 추가 시 이 패턴을 복제한다.
- **인증 가드는 쓰기 작업에만**: `GET`은 공개, `POST`/`PATCH`/`DELETE`에만 `@UseGuards(JwtAuthGuard)`. 새 엔드포인트 추가 시 동일하게 적용.
- **관리자 권한**: 모든 인증된 관리자는 동일한 전체 권한을 갖는다. 관리자 API에는 서버에서 `JwtAuthGuard`를 적용하고, 프론트 메뉴·페이지 가드는 UX 보조로만 쓴다. 관리자 계정 생성(`POST /admins`)도 인증된 관리자가 수행할 수 있다.
- **단, GET이 개인정보를 반환하면 예외적으로 가드 유지**: 신청자 이름·이메일 등이 포함된 목록/상세 GET(`reservations`, `reservation-groups`의 `findAll`/`findOne` 등)은 클래스 레벨 대신 **메서드 레벨 `@UseGuards(JwtAuthGuard)`**로 개별 유지하고, 같은 컨트롤러에 공개해야 하는 집계/익명 GET(예: `GET /reservation-groups/confirmed-slots` — 요일·시간만 반환)이 있으면 가드 없이 별도 라우트로 추가한다. 공개 라우트는 반드시 `:id` 같은 파라미터 라우트보다 **먼저 선언**해 경로 충돌을 피한다.
- **DELETE는 204 반환 필수**: `@HttpCode(HttpStatus.NO_CONTENT)`. Nest 기본값(200 + 빈 바디)은 프론트 `response.json()` 파싱 에러를 유발한다(실제로 겪은 버그, `src/lib/apiClient.ts` 참고).
- **API 응답은 Zod로 파싱**: `frontend/src/api/*.ts`에서 `schema.parse(raw)` 필수, `as T` 단언 금지. 신규 API 함수 작성 시 `api-zod-boundary` 스킬 참고.
- **Next 라우팅**: 공개 페이지 SEO는 `frontend/src/app/`의 App Router metadata/서버 렌더링을 기준으로 관리한다. 브라우저 상태가 필요한 화면은 `use client` 컴포넌트로 분리한다.
- **`metadata.openGraph`는 layout↔page 간 딥머지가 아니라 통째로 덮어쓰기**: 페이지에서 `openGraph`를 새로 정의하면 layout의 `og:image`/`og:type`/`og:site_name` 등이 사라진다 — 반드시 `src/lib/seo.ts`의 `baseOpenGraph()`를 스프레드한 뒤 페이지별 `title`/`description`/`url`만 덮어쓴다.
- **`<dialog>` 모달 + Tailwind preflight 중앙정렬 주의**: Tailwind preflight의 `margin: 0` 리셋이 `<dialog>`의 UA 기본 스타일(자동 중앙정렬)을 깨뜨려 왼쪽에 붙어버릴 수 있다. 새 `<dialog>` 기반 모달을 만들 때는 기존 모달들(`GroupDetailModal.tsx`, `ReservationDetailModal.tsx`, `AdminLoginModal.tsx` 등)의 중앙정렬 처리 방식을 그대로 따른다.
- **폼 검증 에러로 스크롤·포커스 이동 시 `block: "start"` + `scroll-mt-*` 사용, 대상 요소에 `tabIndex={-1}`**: `ApplyPage.tsx`의 `fieldRefs`/`FIELD_ORDER` 패턴처럼 제출 실패 시 첫 에러 필드로 스크롤·포커스를 옮길 때, `scrollIntoView({block:'center'})`는 대상 요소가 뷰포트보다 크면(시간 선택 그리드 같은 `<fieldset>`) 중앙 정렬 때문에 정작 보여야 할 안내 문구가 화면 밖으로 밀려날 수 있다(실제로 겪은 버그 — "가능한 시간" 미선택 시 에러 문구가 안 보임). `block:'start'`를 쓰고 `sticky` 헤더에 가리지 않도록 대상 요소에 `scroll-mt-24`(헤더 높이 고려)를 주며, 에러 문구는 큰 컨텐츠(그리드 등)보다 앞쪽(라벨 바로 뒤)에 배치한다. `<input>`/`<select>`가 아닌 `<fieldset>` 등에 포커스를 주려면 `tabIndex={-1}`을 추가해야 `.focus()`가 실제로 동작한다.
- **Agentation 개발 오버레이**: `agentation`은 `frontend/src/components/AgentationDev.tsx`에서 개발 환경에만 렌더링하고, 루트 레이아웃에 유지한다.
- **쿼리 훅 배치**: 2곳 이상에서 쓰면 `src/queries/`, 관리자 화면 전용(1곳)이면 `src/screens/admin/hooks/`, 공개 화면 전용(1곳)이면 `src/screens/hooks/`. `queryKeys.ts`는 항상 중앙(`src/queries/queryKeys.ts`)에서 관리.
- **낙관적 뮤테이션**: `onMutate`에서 관련 쿼리를 취소·스냅샷한 뒤 모든 영향 목록을 즉시 갱신하고, `onError`에서 스냅샷을 복원한다. 성공 응답으로 임시 데이터를 교체하고 `onSettled`에서 무효화해 서버 상태와 다시 맞춘다.
- **뮤테이션 에러 메시지 통일**: catch 핸들러에서 `cause instanceof ApiError ? cause.message : '기본 문구'` 패턴을 기본으로 쓴다 — 서버가 내려준 구체적 에러 메시지를 우선 노출하고, 네트워크 실패 등 `ApiError`가 아닌 경우에만 기본 문구로 대체한다.
- **Instructor 삭제**: 담당 강좌가 남아있으면 `ConflictException`(409)을 던진다 — FK 제약 위반을 그대로 노출하지 않는다.
- **공유 필드 리네임 시 점검 범위**: 예약/강좌 등 여러 계층에 걸친 필드명을 바꿀 때는 `schema.prisma` → migration → 해당 도메인 양쪽 DTO → 양쪽 service/controller spec → `seed.ts` → 프론트 `schemas/*.schema.ts` → `api/*.ts` → 이를 쓰는 화면(`screens/**`) 순으로 훑는다.
- **알림(이메일 등) 발송 실패 격리**: `NotificationService`류는 SMTP 미설정이거나 발송 실패해도 콘솔 로그로 폴백하고, API 요청 자체는 정상 처리되게 만든다 — 발송 실패가 사용자 요청 실패로 전파되지 않아야 한다. SMTP 미설정 폴백 로그는 subject뿐 아니라 본문(text)도 함께 남긴다 — 인증 링크 등 URL이 본문에 있으면 개발 중 콘솔에서 바로 복사해 쓸 수 있어야 한다.

### 인증/세션

- **관리자·학부모 모두 httpOnly 쿠키 기반**: 두 세션 모두 백엔드가 `auth-cookies.ts`의 `setAuthCookie`/`clearAuthCookie`(관리자는 `academy-admin-session`, 학부모는 `academy-parent-session`)로 발급하고, 프론트는 토큰을 어디에도 저장하지 않는다 — `apiClient.ts`의 `credentials:'include'`가 항상 쿠키를 실어 보낸다. 로그인 상태 판정은 오직 서버 컴포넌트 `getServerAuth()`(`serverAuth.ts`, JWT payload 디코드 + `exp` 확인)만 사용하고, 클라이언트 JS는 쿠키를 읽지 못한다. 로그인/로그아웃 직후에는 반드시 `router.refresh()`로 서버 판정을 다시 받아야 화면이 즉시 갱신된다. 관리자 세션과 부모 세션은 서로 독립적인 별개 상태이므로, 인증 가드를 새로 만들 때 "관리자 세션은 있지만 부모 세션은 없음" 같은 조합을 빠뜨리지 않는다.
- **서브도메인 분리 배포에서는 `COOKIE_DOMAIN` 필수**: 프론트(apex 도메인)와 백엔드(api 서브도메인)가 분리 배포되면, `Domain` 속성 없는 쿠키는 백엔드 호스트에만 묶여 프론트 SSR이 로그인 상태를 못 읽는다(로컬 개발은 `localhost:3000`/`3001`이 호스트가 같아 우연히 동작했을 뿐). `backend/.env.production`에 `COOKIE_DOMAIN=<apex 도메인>`을 설정한다.
- **로그인 필요 페이지 추가 시**: 클라이언트 게이트를 새로 만들지 않고, `AdminRoute.tsx`/`/apply` 페이지가 쓰는 서버 컴포넌트 패턴(`getServerAuth()` 확인 후 미인증이면 `redirect()`)을 복제한다.
- **보호자 로그인 수단**: 소셜 로그인뿐 아니라 이메일/비밀번호("일반 로그인")도 지원한다 — 소셜 전용으로 가정하고 검증·자동화를 생략하지 않는다. 이메일 가입은 즉시 계정을 만들지 않고 매직 링크 인증을 거친다: `POST /auth/parents/signup`이 `ParentEmailVerification`(대기 레코드, `email @unique`)을 upsert하고 인증 메일을 보내며, 링크의 `POST /auth/parents/verify-email`에서만 `ParentUser`가 생성되고 로그인 쿠키가 발급된다. 소셜 전용(`passwordHash` null) 기존 계정과의 병합 분기는 `AuthService.verifyParentEmail`에서 처리한다. 비슷한 "제출 즉시 자원을 만들지 않고 검증 후 생성" 흐름을 추가할 때 이 패턴(대기 테이블 + 토큰 + upsert)을 참고한다.
- **`/apply` 관리자 프리뷰**: 관리자 세션만 있고 부모 세션이 없는 경우 화면 진입(`isAdminPreview`)은 허용하되 실제 제출은 `alert`로 차단한다(`ApplyPage.tsx`).

### 예약 그룹(reservation-groups)

- **예약 그룹 확정 단위**: `reservation-groups` 확정은 요일·시간 셀 단위가 아니라, 사용자가 고른 개별 `reservation` ID 목록 기준으로 동작한다.
- **그룹을 반환하는 API는 `reservations`를 반드시 포함**: `reservation-groups`의 조회뿐 아니라 생성/멤버 추가·이동·시간교체 등 모든 뮤테이션이 그룹을 반환할 때 `reservation-group-includes.ts`의 `FULL_GROUP_INCLUDE`(`{ slots: true, reservations: { include: { preferredSlots: true } } }`)를 재사용한다. 일부만 `slots`만 포함해 반환하면, 프론트 낙관적 뮤테이션의 `onSuccess`가 그 응답으로 캐시 그룹을 통째로 덮어쓸 때 `reservations`가 `undefined`가 되어 타임테이블이 그 그룹을 멤버 0명(빈 수업)으로 잘못 렌더링한다(실제로 겪은 버그 — 드래그로 그룹 이동 시 대상 그룹이 잠깐 "빈 수업"으로 깜빡임). 새 그룹-반환 엔드포인트를 추가할 때 이 include를 빠뜨리지 않는다. `onSuccess`가 캐시 항목을 서버 응답으로 통째로 치환하는 패턴(`groups.map((item) => item.id === group.id ? group : item)`) 자체가 전제하는 계약이므로, 새 그룹-반환 뮤테이션을 추가할 때도 이 패턴을 그대로 따르되 응답에 필드 누락이 없는지 먼저 확인한다.
- **그룹 멤버십의 파생 상태(anchor slot·status)는 프론트 낙관적 업데이트도 백엔드와 동일하게 재현**: `reservation-group-membership.service.ts`의 `vacateMemberSlots`는 그룹의 마지막 멤버가 빠지면 슬롯을 삭제하지 않고 `reservationId: null`로만 비워 anchor slot으로 남기고 그룹 `status`를 `EMPTY`로 전환한다(삭제해버리면 그룹이 그리드에서 완전히 사라진다). `useReservationGroupMutations.ts`의 `onMutate`(addMember/removeMember/moveMember 3곳)도 단순히 멤버를 필터링해 지우는 게 아니라 이 로직(멤버 0명이면 slot을 지우지 않고 `reservationId`만 null 처리 + `status: 'EMPTY'`, 아니면 `status: 'CONFIRMED'`)을 그대로 재현해야 한다. 백엔드에서 멤버 추가/제거/이동의 상태 전이 로직을 바꾸면 이 3곳의 낙관적 업데이트도 함께 갱신한다 — 안 그러면 서버 응답이 오기 전까지 화면이 실제 상태와 어긋난다.

## 프론트엔드 E2E(Playwright)

`frontend/e2e/`에 Playwright 스위트가 있다. 백엔드/DB 없이 완전히 목(mock)으로 동작한다. 백엔드 계약 검증은 백엔드 Jest 스펙이 담당한다.

```bash
cd frontend
npx playwright install chromium   # 최초 1회
npx playwright test               # 전체 스위트 실행. 3410/4310 전용 포트를 쓰며 실백엔드(3000)/평소 dev(3001)와 무관하다.
```

- SSR과 클라이언트 요청은 목킹 방식이 다르다. 공개 페이지(`app/**`)의 서버 컴포넌트 fetch는 브라우저 `page.route()`로 잡을 수 없어 `e2e/mock-server/server.ts`(독립 Node 서버, `NEXT_PUBLIC_API_BASE_URL`로 연결)가 응답한다. `/apply`, `/admin/*`처럼 클라이언트(TanStack Query)에서 나가는 요청은 각 spec의 `page.route()`로 시나리오별 제어한다.
- `page.route()` 패턴은 반드시 API origin에 앵커링한다. 느슨한 정규식은 `/admin/courses` 같은 페이지 자체 내비게이션까지 가로채 버린다(실제로 겪은 버그). `e2e/helpers/intercept.ts`의 `apiPattern()`으로 목 API origin까지 통째로 앵커링해서 쓴다.
- `next dev`는 프로젝트 디렉토리당 1개만 허용한다(포트가 달라도 동시 실행 시 잠금 충돌). `next.config.ts`에 `NEXT_E2E=1`일 때 `distDir: '.next-e2e'`로 분리해 평소 dev 서버(3001, `.next`)와 공존시킨다.
- Next의 fetch 데이터 캐시(`next: {revalidate}`)는 디스크에 영구 저장되어(`.next-e2e/dev/cache/fetch-cache`) dev 서버를 껐다 켜도 살아남는다. `playwright.config.ts`의 webServer 커맨드가 기동 전 이 캐시를 지운다.
- 인증은 실제 로그인 없이 위조 쿠키로 세팅한다. `serverAuth.ts`는 JWT 서명 검증을 하지 않으므로 `e2e/helpers/auth.setup.ts`가 관리자·보호자 JWT payload(`makeAdminJwt`/`makeParentJwt`)를 각각 httpOnly 쿠키(`academy-admin-session`/`academy-parent-session`)로 미리 심어 storageState로 재사용한다.
- `window.alert`/`confirm` 같은 네이티브 다이얼로그는 액션 실행 전에 `page.once('dialog', ...)`를 등록한다. `page.waitForEvent('dialog')` 뒤에 `await click()`을 두면 동기 `alert()`가 렌더러를 막아 클릭 자체가 데드락된다.
- 라벨 충돌은 `data-testid`로 해소한다. 같은 화면에 동일 라벨이 여러 곳에 있으면 `getByLabel`이 strict-mode 위반을 낸다. 모호한 컨테이너에만 `data-testid`를 붙여 스코프를 좁힌다.
- 화면·라우트 구조를 리팩토링할 때는 `e2e/helpers`의 Page Object Model도 함께 갱신한다. 옛 셀렉터를 참조한 채 남으면 관련 spec이 조용히 깨질 수 있다 — 리팩토링 직후 영향받는 POM과 spec을 실행해 확인한다.

## Prisma 7 운영 규칙

Prisma Client는 `prisma-client` generator로 `backend/src/generated/prisma`에 생성하며 Git에 커밋하지 않는다. `schema.prisma`에는 datasource provider만 두고 연결 URL·seed는 `prisma.config.ts`에서 관리한다. 앱과 seed는 `@prisma/adapter-pg`의 `PrismaPg` adapter를 주입해 생성 클라이언트를 사용한다. Prisma 7은 migration 뒤 자동 client 생성·seed를 실행하지 않으므로 `npm run prisma:generate`, `npm run prisma:seed`를 명시적으로 실행한다. 백엔드는 ESM이므로 상대 import에는 `.js` 확장자를 쓴다.

백엔드 TypeScript 버전은 5.7.x~5.9.x 범위를 유지한다. `ts-jest`(^29.2.5)·`typescript-eslint`(^8.20.0)가 아직 TypeScript 7을 지원하지 않는다(peer 범위 `>=4.8.4 <6.1.0`). 업그레이드 시도 전 두 패키지의 지원 버전을 먼저 확인한다(프론트는 별도 패키지라 무관 — 이미 `~6.0.2` 사용 중).

## 배포/인프라

- 호스팅 구성: 백엔드는 오라클 클라우드 VM에서 `docker-compose.prod.yml`(postgres + backend + caddy)로 운영하고, 프론트엔드는 Vercel에 별도 배포한다. `Caddyfile`의 프론트 리버스 프록시 블록(`{$SITE_DOMAIN} → frontend:3001`)은 대응하는 `frontend` 컨테이너가 없어 현재 미사용 상태다(사이트 도메인 DNS도 이 서버가 아니라 Vercel을 가리킨다) — 되살리지 않는다.
- 배포 자동화: `main`에 `backend/**` 변경이 push되면 `.github/workflows/deploy-backend.yml`이 이미지를 빌드해 GHCR에 올리고, SSH로 오라클 서버에 접속해 `git pull` → `docker compose pull/up backend`까지 자동 처리한다. 프론트(Vercel)는 별도로 재배포해야 한다.
- `docker compose` 명령에는 항상 `--env-file .env.production`을 명시한다. 파일명이 정확히 `.env`가 아니면 자동 로드되지 않아, `docker-compose.prod.yml`의 `${POSTGRES_USER}` 등 변수 치환이 빈 값이 되고 backend가 Prisma `P1010`(DB 접근 거부)으로 크래시한다.
- `backend/Dockerfile`은 `npm ci`를 `NODE_ENV=production` 설정보다 먼저 실행한다. 순서가 바뀌면 devDependencies(seed에 필요한 `tsx` 등)가 설치되지 않아 `prisma:seed`가 `ENOENT`로 실패한다. seed는 `src/generated`뿐 아니라 `src` 전체를 러너 이미지에 복사해야 한다(TS 소스를 직접 import하므로).
- 서버 컴포넌트(SSR) fetch는 `NEXT_PUBLIC_API_BASE_URL`이 아니라 `API_INTERNAL_URL`을 우선 사용한다. `frontend/src/api/public.api.ts`가 `API_INTERNAL_URL ?? NEXT_PUBLIC_API_BASE_URL`로 폴백한다 — 브라우저용 공개 URL은 같은 Docker 네트워크 안에서 컨테이너 내부로 도달 못 할 수 있다. 관련 함수가 에러를 삼켜 빈 배열을 반환하면 겉으로는 정상처럼 보이니 SSR에서 목록이 비어 보이면 이 URL부터 의심한다.
- 배포용 SSH 키는 패스프레이즈 없이 발급한다. `appleboy/ssh-action` 같은 CI 스텝은 대화형 입력을 못 받으므로, 개인 접속용 키와는 별도로 패스프레이즈 없는 배포 전용 키를 만들어 시크릿에 등록한다.
- 도메인 변경 시 갱신할 값이 두 파일에 나뉘어 있다: 루트 `.env.production`(`SITE_DOMAIN`/`API_DOMAIN`/`NEXT_PUBLIC_API_BASE_URL`/`NEXT_PUBLIC_SITE_URL`)과 `backend/.env.production`(`CORS_ORIGIN`/`BACKEND_PUBLIC_URL`/`FRONTEND_URL`/`COOKIE_DOMAIN`) 양쪽 다 고쳐야 한다.

## 개발 워크플로

- 백엔드 기능 추가/수정은 TDD(RED-GREEN)로 진행 — `*.spec.ts` 먼저 작성해 실패 확인 후 구현.
- 프론트/백엔드 동시 실행 후 실제 브라우저(Playwright) 또는 curl로 end-to-end 확인 없이 완료 선언하지 않는다.
- 이 git 저장소(`/Users/igyuyeol/Desktop/project`)에는 다수의 독립 프로젝트가 공존한다 — 커밋 시 `academy-hompage/` 밖의 변경을 섞지 않는다.
- E2E 검증을 위해 띄운 개발 서버를 종료했다면 완료 보고에 반드시 명시한다 — 다음 턴에서 서버 다운이 새 버그로 오인되는 걸 방지.
- E2E 검증 중 생성한 테스트 데이터(부모 계정, 예약 등)는 완료 보고에 식별자를 명시하고 삭제 여부를 사용자에게 확인받는다.
- **`npm run start:dev`(`nest start --watch`) 재기동 시 EADDRINUSE 주의**: 이미 떠 있는 watch 프로세스를 죽이지 않고 새로 띄우면, 재컴파일된 새 워커가 이전 워커와 포트(3000)를 두고 충돌해 새 워커만 크래시하고 옛 코드가 계속 떠 있는 상태로 남을 수 있다. 코드를 바꾼 뒤 재검증할 때는 `pkill -f "nest start --watch"` 등으로 완전히 정리한 다음 다시 기동하고, curl 등으로 최신 변경(새 라우트·로그 문구 등)이 실제로 반영됐는지 확인한다.
- 예약 도메인 E2E용 테스트 데이터는 `POST /reservations/walk-in`(관리자 토큰, 보호자 인증 불필요)으로 `WAITING` 예약을 먼저 만들고, 그 예약 ID를 `POST /reservation-groups`의 `slots[].reservationId`로 참조해 확정 그룹을 만든다 — 예약과 그룹을 한 번에 생성하는 엔드포인트는 없다.
- **실제 dev 서버(목 없는 진짜 백엔드/DB)에서 보호자 로그인 세션이 필요한 화면을 Playwright로 검증할 때**: `frontend/e2e/`의 목 기반 스위트와 달리 진짜 서명된 JWT가 필요하다(`serverAuth.ts`는 SSR에서 서명 검증 없이 payload만 디코드하지만, 클라이언트 TanStack Query가 호출하는 실제 API는 백엔드가 서명을 검증하므로 위조 쿠키로는 SSR 렌더링만 되고 데이터 조회 API가 401로 실패한다). 순서: (1) `POST /auth/parents/signup`으로 가입 → (2) SMTP 미설정 시 인증 링크가 콘솔 로그로만 남고 별도로 tail할 방법이 없으면 `docker exec <postgres 컨테이너> psql -U academy -d academy -c "SELECT token FROM \"ParentEmailVerification\" WHERE email='...'"`로 DB에서 토큰을 직접 조회 → (3) `POST /auth/parents/verify-email`을 curl로 호출해 실제 서명된 `academy-parent-session` JWT를 응답/쿠키로 받음 → (4) Playwright MCP `browser_run_code_unsafe`에서 `page.context().addCookies([...])`로 그 JWT를 브라우저에 주입(httpOnly 쿠키라 `document.cookie`로는 못 심는다) → (5) 필요하면 같은 쿠키로 `POST /children` 등을 curl로 먼저 호출해 화면이 요구하는 선행 데이터(자녀 등록 등)도 만들어 둔다.
- 여러 세션에 걸쳐 진행하는 미완성 기능은 완료 전까지 `main`이 항상 빌드 가능한 상태를 유지한다 — 중간 상태로 오래 남으면 무관한 후속 작업의 빌드가 깨질 수 있다.
- 계획 수립 전 `git log --oneline`, 관련 파일의 최근 커밋/브랜치를 확인한다 — 같은 문제를 다른 세션·브랜치가 이미 다른 방식으로 작업 중일 수 있다.
- 커밋 대상을 `git add`할 때는 세션 시작 시점 `git status`에 이미 있던 untracked 파일을 자동으로 포함하지 않는다 — 이번 세션에서 만든 게 아니면 사용자에게 별도 확인한다.
- 아키텍처 규칙의 같은 하위 주제에 불릿이 3개 이상 쌓이면 즉시 서브섹션으로 분리한다.
