# 배포와 인프라 가이드

- 백엔드는 Oracle VM의 `docker-compose.prod.yml`(postgres, backend_blue, backend_green, caddy)에서 운영한다. 프론트는 Vercel에 별도 배포한다.
- Caddy는 `API_DOMAIN` 도메인만 처리한다. frontend 프록시 블록은 대응 컨테이너가 없어 제거했다(프론트는 Vercel이 직접 서빙) — 되살리지 않는다.
- compose의 `--env-file`은 YAML 파일 자체의 `${VAR}` 치환에만 쓰이고, 컨테이너 내부 환경변수로 자동 전달되지 않는다. Caddyfile의 `{$API_DOMAIN}` 같은 런타임 플레이스홀더가 해석되려면 해당 서비스에 `environment: API_DOMAIN: ${API_DOMAIN}`을 명시해야 한다 — 이게 빠져 있어서 서버에 도메인이 하드코딩된 Caddyfile이 로컬 수정으로 남아있던 적이 있었다(2026-07-12 발견, `caddy` 서비스에 `environment` 추가로 수정).
- `main`에 `backend/**`가 push되면 GitHub Actions가 GHCR 이미지 빌드와 서버 배포를 수행한다. 프론트는 Vercel에서 별도 재배포한다.
- `backend/package.json`이 바뀌면 GHA의 `npm ci` 레이어 캐시가 무효화되어 의존성이 통째로 재다운로드된다(1회성 비용, 수백MB 규모일 수 있음) — 이 경우 배포가 평소보다 느려 보여도 재조사 없이 원인으로 판단할 수 있다.
- production compose는 항상 `--env-file .env.production`을 명시한다.
- Dockerfile은 `NODE_ENV=production`보다 먼저 `npm ci`를 실행한다. seed를 위해 `src/generated`와 필요한 `src` 소스를 러너 이미지에 포함한다.
- SSR fetch는 `API_INTERNAL_URL`을 우선하고 `NEXT_PUBLIC_API_BASE_URL`로 폴백한다. SSR 목록이 비어 보이면 이 URL부터 확인한다.
- 도메인 변경 시 루트 `.env.production`, `backend/.env.production`, Vercel 환경변수와 Google OAuth 리디렉션 URI·출처를 함께 갱신한다.
- Vercel Production에는 `NEXT_PUBLIC_SITE_URL`을 실제 프론트 도메인으로 설정하고 `NAVER_SITE_VERIFICATION`을 서치어드바이저가 발급한 값으로 설정한 뒤 재배포한다. 두 값은 metadata·사이트맵의 빌드 결과에 영향을 주므로 환경변수 저장만 하고 재배포를 생략하지 않는다.
- `vercel`/`vercel build`/`vercel deploy` CLI는 저장소 루트에서 실행한다. Vercel 프로젝트의 Root Directory 설정이 `frontend`이므로 `frontend/` 안에서 실행하면 `frontend/frontend`를 찾아 에러가 난다.
- 로컬에서 `vercel --prod`를 직접 실행하기 전 `git status`로 워킹 디렉토리가 clean한지 확인한다. dirty 상태로 실행하면 커밋되지 않은 무관한 변경까지 그대로 업로드된다 — dirty하면 GitHub Actions의 clean checkout 배포 경로(아래 워크플로)를 우선한다.
- Vercel 대시보드의 "Redeploy" 버튼은 prebuilt 배포에는 `Prebuilt deployments cannot be redeployed` 에러로 실패한다. 이 프로젝트의 프론트 재배포는 `gh workflow run frontend-seo.yml --ref main`으로 한다.
- Vercel 환경변수를 "Sensitive"로 등록하면 `vercel pull`/CLI 빌드 시 값이 마스킹되어 빈 문자열로 처리될 수 있다 — `NEXT_PUBLIC_*`처럼 클라이언트 번들에 그대로 노출되는 값은 Sensitive 토글을 쓰지 않는다. 실제로 Sensitive로 잘못 등록돼 CI 빌드가 값을 못 읽고 번들에 리터럴 문자열 `"[SENSITIVE]"`가 그대로 박힌 채 배포된 사례가 있었다 — 배포 후 프로덕션 번들에서 `grep -r "\[SENSITIVE\]"`로 검증한다.
- 새 필수 환경변수를 요구하는 공개 기능(예: Turnstile 자동입력방지)을 배포하기 전, 해당 운영 키가 Vercel과 백엔드 운영 환경 양쪽에 실제로 설정돼 있는지 확인한다 — 미설정 상태로 배포하면 실사용자도 해당 기능(상담 신청 등)을 못 쓰는 상태로 조용히 운영될 수 있다.
- 새 환경변수를 추가하면 `backend/.env.example`(개발용)뿐 아니라 `backend/.env.production.example`(운영용)도 함께 갱신한다 — 한쪽만 갱신하면 운영 환경에 해당 값이 누락된 채 방치되기 쉽다.
- `next.config`의 `output: 'standalone'`은 Docker 배포 전용이라 Vercel 빌드와 충돌한다. `process.env.VERCEL` 여부로 분기해 Vercel 빌드에서는 `standalone`을 쓰지 않는다.
- production compose의 `.env.production` 등 env_file 내용을 바꾼 뒤에는 `docker restart`만으로 반영되지 않는다 — 컨테이너를 `--force-recreate`로 재생성해야 한다.
- 광고 측정 랜딩을 배포할 때 Vercel에는 `NEXT_PUBLIC_GA_MEASUREMENT_ID`, `NEXT_PUBLIC_META_PIXEL_ID`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`를 설정한다. 백엔드 운영 환경에는 같은 Turnstile 위젯의 `TURNSTILE_SECRET_KEY`와 리드 제한값(`LEAD_DEDUP_DAYS`, `LEAD_RATE_LIMIT`, `LEAD_RATE_WINDOW_SECONDS`)을 설정한다.
- Turnstile 키는 운영 도메인 `openmath.io.kr`을 허용한 위젯의 한 쌍을 사용한다. 키를 바꾼 뒤에는 랜딩에서 실제 테스트 리드를 제출하고 관리자 `/admin/leads`에 저장되는지 확인한다.
- Meta 광고 분석 자동 동기화는 백엔드 운영 환경의 `META_ACCESS_TOKEN`, `META_AD_ACCOUNT_ID`, `META_API_VERSION`, `META_SYNC_ENABLED=true`를 사용한다. 토큰은 `ads_read`만 가진 시스템 사용자 토큰으로 제한하고 프론트·로그·Compose 치환용 루트 환경파일에는 넣지 않는다.
- 홈페이지 연결 광고의 URL 매개변수는 `utm_campaign={{campaign.id}}`, `utm_content={{ad.id}}`로 설정해야 Meta Insights와 리드가 자동 연결된다. 배포 후 `/admin/marketing`의 수동 동기화로 광고 관리자 수치와 일치하는지 확인한다.
- 배포용 SSH 키는 전용 패스프레이즈 없는 키를 사용하고 시크릿으로 등록한다.
- 프로덕션 서버 로그인용 SSH 키(`~/.ssh/oci_academy`)는 패스프레이즈가 걸려 있어 Claude Code의 Bash 도구(TTY 없음)로는 직접 접속할 수 없다 — 진단·조치 명령을 사용자에게 제공하고 결과를 받아 진단하는 방식으로 진행한다.
- Google Search Console 등록, DNS/HTML 소유권 확인, sitemap 제출, 개별 URL 색인 요청은 사용자의 구글 계정으로만 가능한 수동 작업이다. Claude가 담당하는 범위는 코드·설정(검증 메타태그·파일 추가, `sitemap.ts` 자동 생성)까지다.

## 백엔드 무중단(블루-그린) 배포

- 백엔드는 `backend_blue`/`backend_green` 두 서비스로 정의돼 있다(`docker-compose.prod.yml`, YAML 앵커로 설정 동일하게 유지). `backend_green`은 `profiles: [green]`이라 평시 `docker compose up -d`(서비스명 미지정)로는 기동되지 않고, 배포 스크립트가 서비스명을 명시할 때만 뜬다.
- `GET /health`(`backend/src/app.controller.ts`)가 Prisma로 DB 연결을 확인해 200/503을 반환한다. Caddy(`Caddyfile`)가 이 엔드포인트로 `backend_blue`/`backend_green` 양쪽을 액티브 헬스체크하며, 살아있는 쪽으로만 트래픽을 라우팅한다.
- `.github/workflows/deploy-backend.yml`의 deploy 잡: 현재 실행 중인 컬러를 감지 → 반대 컬러에 새 이미지 배포 → healthy 될 때까지 대기(최대 60초) → `docker exec academy-caddy-prod caddy reload`로 Caddy 설정 무중단 리로드(컨테이너 재시작이 아니라 `caddy reload`라 API/프론트 프록시가 끊기지 않는다) → 기존 컬러 정지. healthy 확인 실패 시 새 컨테이너를 롤백하고 기존 컬러는 그대로 유지한 채 워크플로를 실패 처리한다.
- `docker-compose.override.yml`(IP 직접 테스트용, `backend`에 host 포트 3000 매핑)은 도메인·Caddy HTTPS 확인 후 제거 대상이었고, blue/green 전환에서 `backend` 서비스 자체가 없어져 남아 있으면 컴포즈 병합이 깨진다. 배포 스크립트는 더 이상 `-f docker-compose.override.yml`을 참조하지 않아 병합 자체는 더 이상 문제가 안 되지만, 서버에 파일이 남아 있다면 정리 대상이다.
- 현재 실행 중인 컨테이너명(blue/green 중 어느 쪽인지)을 추측해서 안내하지 않는다 — 안내 전 서버에서 `docker ps`로 실제 실행 중인 컨테이너를 확인한다.
- **최초 1회 수동 전환**: blue/green 도입 전에는 컨테이너명이 `academy-backend-prod`(서비스명 `backend`) 하나였다. 자동 배포 워크플로는 `academy-backend-blue`/`-green`만 감지하므로 구 컨테이너를 정리하지 않으면 orphan으로 남는다 — 첫 전환 직후 `docker stop academy-backend-prod && docker rm academy-backend-prod`로 수동 정리한다.
- **Caddyfile은 단일 파일이 아니라 `caddy/` 디렉터리째로 바인드 마운트한다**(`./caddy:/etc/caddy`). Docker가 파일 하나만 바인드 마운트하면 컨테이너는 마운트 시점의 inode를 계속 참조하는데, git은 pull/checkout 시 파일을 새 inode로 교체(rename)한다 — 그 결과 호스트에서 `cat`하면 새 내용이 보여도 컨테이너 안에서는(`caddy adapt`/`caddy reload`) 여전히 옛 내용을 읽어 `caddy reload`가 "config is unchanged"로 조용히 아무 것도 안 바꾸는 사고가 났다(2026-07-12). 디렉터리 마운트는 내부 rename을 정상 추적해 이 문제를 없앤다.
- `caddy` 서비스 자체의 정의(볼륨, 이미지, ports)가 바뀌면 배포 스크립트가 자동으로 반영하지 않는다 — 스크립트는 `backend_blue`/`backend_green`과 `caddy reload`(설정 내용 반영)만 다루므로, `docker-compose.prod.yml`의 caddy 서비스 정의를 바꿨다면 서버에서 `docker compose -f docker-compose.prod.yml --env-file .env.production up -d caddy`를 한 번 수동 실행해 컨테이너를 재생성해야 한다(이 순간만 짧게 끊긴다).
- `caddy`는 `depends_on: backend_blue`를 갖고 있어서, `up -d caddy`(또는 caddy만 대상으로 한 어떤 compose 명령이든)를 실행하면 그 시점에 `backend_blue`가 꺼져 있어도 compose가 의존성 충족을 위해 **자동으로 다시 기동시킨다**. 이미 `backend_green`이 active인 상태에서 caddy를 재생성하면 blue가 되살아나 blue/green이 동시에 뜬 채로 남을 수 있다(2026-07-12 실제 발생) — caddy를 단독으로 조작한 뒤에는 `docker ps`로 blue/green이 둘 다 떠 있지 않은지 확인하고, 남아 있으면 비활성 컬러를 수동으로 정지·삭제한다.
