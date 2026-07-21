# 아키텍처 가이드

## Backend CRUD와 인증

- `courses`, `notices`, `instructors`는 controller/service/dto와 `findAll`/`findOne`/`create`/`update`/`remove` 패턴을 통일한다.
- 새 모듈을 만들거나 기존 모듈에 엔드포인트를 추가할 때는 유사한 모듈(예: `members`)과 CRUD 대칭성을 확인한다 — `leads` 모듈에 `DELETE :id`가 없어 관리자 화면에서 테스트 데이터를 지울 방법이 없었던 사례가 있었다.
- `GET`은 공개다. `POST`·`PATCH`·`DELETE`에는 `JwtAuthGuard`를 적용한다. 신청자 개인정보 GET은 클래스가 아니라 메서드 단위로 가드한다.
- 공개 정적 경로는 `:id` 라우트보다 먼저 선언한다.
- `DELETE`는 `@HttpCode(HttpStatus.NO_CONTENT)`로 204를 반환한다.
- 담당 강좌가 남은 instructor 삭제는 FK 오류 대신 409 `ConflictException`을 반환한다.
- 연관 데이터가 있는 엔티티 삭제 기능을 추가할 때는 각 연관 모델의 cascade/SetNull/제한 여부를 먼저 표로 정리하고, 여러 방식이 가능하면 옵션으로 제시해 사용자 확인을 받은 뒤 구현한다.
- `@Body()`/`@Query()`는 항상 DTO 클래스로 타입을 지정한다 — `@Body() dto: { code: string }`처럼 인라인 객체 타입을 쓰면 전역 `ValidationPipe`(`whitelist`/`forbidNonWhitelisted`/`transform`)가 class-validator 메타데이터 없는 body를 전혀 검증하지 못한다. `social-auth.controller.ts`의 `exchange()`가 이 형태라 검증이 통째로 우회되고 있던 걸 발견해 전용 DTO(`ExchangeSessionDto`)로 교체한 사례가 있다.

## API 경계와 프론트 데이터

- `frontend/src/api/`는 raw 응답을 Zod schema로 `parse`한다. `as T` 단언을 쓰지 않는다.
- 프론트 Zod 검증과 별개로 Nest DTO에서도 필수값·형식·공백을 검증하고 DTO 테스트를 둔다.
- 여러 화면에서 쓰는 query hook은 `src/queries/`, 단일 화면 전용 hook은 해당 screen 아래에 둔다. query key는 `src/queries/queryKeys.ts`에서 관리한다.
- 낙관적 뮤테이션은 `onMutate`에서 취소·스냅샷·모든 영향 캐시 갱신, `onError`에서 복원, `onSettled`에서 무효화를 수행한다.
- 뮤테이션 오류는 `cause instanceof ApiError ? cause.message : '기본 문구'`로 서버 메시지를 우선 노출한다.

## Next.js와 React

- 공개 페이지 SEO는 App Router metadata와 서버 렌더링을 기준으로 관리한다. 브라우저 상태는 `use client` 컴포넌트로 분리한다.
- 페이지 metadata 객체는 layout과 딥머지되지 않는다. `openGraph`는 `baseOpenGraph()`, canonical을 정의한 `alternates`는 `rssAlternate()`를 함께 스프레드해 공통 속성을 유지한다.
- 백엔드 콘텐츠로 만드는 RSS 같은 피드 라우트는 빌드 시 빈 응답이 정적 산출물로 고정되지 않게 동적 생성하고 응답 캐시 헤더로 부하를 제어한다.
- `AgentationDev.tsx`는 개발 환경에서만 루트 레이아웃에 렌더링한다. 이 devtools는 다른 에이전트가 세션 도중 워킹 디렉토리 파일을 직접 수정할 수 있는 경로다 — 손대지 않은 파일(예: DTO, 폼 컴포넌트)에서 원인불명의 diff가 발견되면 자신의 실수로 단정하지 말고, 확인 전까지 커밋 대상에서 제외한 뒤 원인을 파악한다.
- `## Page Feedback: /경로` 형식 메시지(Agentation 툴바가 자동 제출하는 주석)는 실시간 대화가 아니라 답장을 받을 수 없는 단발성 입력이다 — 지시가 모호해도 "확인이 필요해"로 멈추지 말고, "이렇게 해석해 진행합니다: [전제]"로 전제만 명시한 뒤 바로 처리한다.
- RSC 클라이언트 매니페스트 500 에러가 나면 `outputFileTracingRoot`/`turbopack.root` 불일치부터 의심하되, 그걸 고쳐도 안 되면 파일명 자체(예: 다른 모듈과 충돌하는 `AdminLayout.tsx` 같은 이름)를 바꿔본다 — 근본 원인이 설정이 아니라 Next.js/webpack 특이 케이스였던 사례가 있었다.
- props·store·query 값 변경을 이유로 같은 컴포넌트 state를 `useEffect`에서 보정하지 않는다. `key` 재마운트 또는 렌더 중 이전 값 비교를 사용한다.
- `useEffect`는 네트워크 구독, DOM 조작, 타이머 같은 실제 사이드 이펙트에만 사용한다.
- `<dialog open>` 모달은 `useModalFocusTrap`과 `data-autofocus`로 포커스 격리를 제공한다. Tailwind preflight 중앙정렬은 기존 모달 방식을 복제한다. 이 훅의 키보드 핸들러는 `event.isComposing`을 확인한다 — 한글 등 조합 입력 중 Tab을 누르면 조합 미확정 상태로 트랩 처리가 꼬이는 레이스 컨디션이 있었던 걸 막기 위함이라, 이 체크는 지우지 않는다(여러 모달이 이 훅을 공유한다).
- 폼 오류 이동은 `scrollIntoView({ block: 'start' })`, `scroll-mt-*`, `tabIndex={-1}`을 사용한다.
- CSS `scroll-behavior: smooth`와 JS `scrollIntoView({ behavior: 'smooth' })`를 같은 요소에 동시에 걸면 Meta/Instagram 인앱 브라우저(웹뷰)에서 프로그램적 스무스 스크롤이 무시되어 CTA 버튼을 눌러도 폼으로 이동하지 않는다 — 광고 랜딩 등 인앱 브라우저 유입이 많은 페이지의 스크롤 이동 코드에서 재발 가능하니 주의한다.
- 긴 시간표의 터치는 드래그 캡처 대신 이동 임계값을 둔 탭 방식으로 분기한다. 반응형은 `useIsNarrow`를 재사용하고 마운트 후 전환을 E2E에서 기다린다.
- 여러 화면(공개/관리자 등)이 공유하는 컴포넌트(`MonthCalendar` 등)를 수정하기 전에는 grep으로 전체 사용처를 찾고 각 사용처의 관련 E2E 테스트를 먼저 읽는다 — 겉보기엔 단순 표시 요소가 다른 화면에서는 의도된 기능(예: 관리자 드래그 편집)일 수 있다.
- 신규 광고 랜딩페이지(`*LandingPage.tsx`)는 독자적인 색상 팔레트를 새로 만들지 않는다. 이미 확립된 사이트 톤(크림 배경, 웜다크 텍스트, 앰버 포인트)과 동일 타깃의 기존 페이지를 먼저 확인해 재사용한다.
- 프로그램·브랜드 문구(예: "요리수 연산", "플레이팩토")를 바꿀 때는 grep으로 전체 참조를 먼저 확인한다 — 랜딩 페이지, `courses` 페이지, `seo-landing/data.ts`, 커리큘럼 데이터, `ComparisonTable`, `seo.ts`, E2E 스펙(`ad-landing.spec.ts`, `public-smoke.spec.ts` 등)까지 흩어져 있어 단순 이름 변경도 6개 이상 파일을 건드리게 된다. 프로그램 카드 이미지 alt 텍스트는 `${program.name} 수업 활동`으로 name에서 자동 생성되므로 name만 바꾸면 따라간다.

## 인증과 세션

- 관리자와 보호자 세션은 각각 httpOnly 쿠키를 쓴다. 토큰을 클라이언트에 저장하지 않는다.
- 로그인 판정은 `getServerAuth()`만 사용하고 로그인·로그아웃 후 `router.refresh()`한다.
- 새 보호 페이지는 클라이언트 게이트 대신 서버 컴포넌트 `redirect()` 패턴을 복제한다.
- 관리자 세션과 보호자 세션은 독립적이다. `/apply`는 관리자 프리뷰를 허용하지만 보호자 세션 없이는 제출을 막는다.
- 서브도메인 배포는 `COOKIE_DOMAIN`을 설정한다.
- 보호자 가입은 대기 레코드를 upsert한 뒤 매직 링크 인증에서만 계정을 만들고 쿠키를 발급한다. 소셜 전용 계정 병합은 `AuthService.verifyParentEmail` 흐름을 따른다.
- 실사용자 이메일로 가입·인증 플로우를 검증하기 전에는 그 이메일이 기존 `ParentUser`와 겹치는지 먼저 조회한다 — 특히 소셜 로그인 전용(비밀번호 없음) 계정에 검증용 비밀번호가 실수로 설정될 수 있다.

## 변경 전파와 알림

- 예약·강좌처럼 공유 필드를 바꾸면 Prisma schema → migration → 양쪽 DTO → service/controller spec → seed → 프론트 schema·API·screen 순으로 점검한다.
- 알림 발송 실패는 API 요청 실패로 전파하지 않는다. SMTP 미설정 폴백 로그에는 subject와 text 본문을 함께 남긴다.
- `SMTP_FROM`(발신 전용, 받는 편지함 불필요)과 `ADMIN_NOTIFICATION_EMAIL`(수신용, 실제 확인 가능한 메일함 필수)은 역할이 다르므로 한쪽을 no-reply 계정으로 바꿀 때 다른 쪽까지 같이 바꾸지 않는다.
- `openmath.io.kr`은 MX 레코드가 없는 발신 전용 도메인이다. Resend SMTP의 SPF/DKIM/DMARC는 `send`/`resend._domainkey` 서브도메인에 설정한다.
- dotenv v17.2.3+가 콘솔에 자체 홍보 문구(`vestauth.com`/dotenvx 언급 등)를 출력하는 것은 정상 동작이며 시크릿 유출이 아니다.
- `frontend/.env`의 `VITE_API_BASE_URL`은 Next.js 전환 이전(Vite 시절) 잔여 변수로, 앱은 `NEXT_PUBLIC_*`만 읽고 `src`에서 참조하는 곳이 없다 — 디버깅 중 발견해도 원인일 가능성은 낮은 죽은 변수이니 재조사에 시간을 쓰지 않는다.

## 예약 생성

- 같은 시간대 중복 신청 판단은 요일·분 단위 overlap 비교로 하고, 판단 범위는 `childId` 단위다 — 형제자매(부모는 같지만 childId가 다름)는 서로 독립적으로 같은 시간에 신청할 수 있다.

## 예약 그룹

- 그룹 확정은 시간 셀이 아니라 선택한 reservation ID 단위다.
- 그룹을 반환하는 모든 API는 `FULL_GROUP_INCLUDE`로 `slots`와 `reservations.preferredSlots`를 포함한다.
- 마지막 멤버 제거 시 anchor slot은 삭제하지 않고 `reservationId: null`, 그룹 상태는 `EMPTY`로 유지한다. 프론트 낙관적 업데이트도 동일하게 재현한다.
- 예약 생성·이동의 충돌 검사와 쓰기는 Prisma `Serializable` 트랜잭션에 묶고 `P2034`만 제한 횟수 재시도한다.
