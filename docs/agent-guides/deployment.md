# 배포와 인프라 가이드

- 백엔드는 Oracle VM의 `docker-compose.prod.yml`(postgres, backend_blue, backend_green, caddy)에서 운영한다. 프론트는 Vercel에 별도 배포한다.
- Caddy의 frontend 프록시 블록은 대응 컨테이너가 없어 미사용이다. 되살리지 않는다.
- `main`에 `backend/**`가 push되면 GitHub Actions가 GHCR 이미지 빌드와 서버 배포를 수행한다. 프론트는 Vercel에서 별도 재배포한다.
- production compose는 항상 `--env-file .env.production`을 명시한다.
- Dockerfile은 `NODE_ENV=production`보다 먼저 `npm ci`를 실행한다. seed를 위해 `src/generated`와 필요한 `src` 소스를 러너 이미지에 포함한다.
- SSR fetch는 `API_INTERNAL_URL`을 우선하고 `NEXT_PUBLIC_API_BASE_URL`로 폴백한다. SSR 목록이 비어 보이면 이 URL부터 확인한다.
- 도메인 변경 시 루트 `.env.production`, `backend/.env.production`, Vercel 환경변수와 Google OAuth 리디렉션 URI·출처를 함께 갱신한다.
- 배포용 SSH 키는 전용 패스프레이즈 없는 키를 사용하고 시크릿으로 등록한다.

## 백엔드 무중단(블루-그린) 배포

- 백엔드는 `backend_blue`/`backend_green` 두 서비스로 정의돼 있다(`docker-compose.prod.yml`, YAML 앵커로 설정 동일하게 유지). `backend_green`은 `profiles: [green]`이라 평시 `docker compose up -d`(서비스명 미지정)로는 기동되지 않고, 배포 스크립트가 서비스명을 명시할 때만 뜬다.
- `GET /health`(`backend/src/app.controller.ts`)가 Prisma로 DB 연결을 확인해 200/503을 반환한다. Caddy(`Caddyfile`)가 이 엔드포인트로 `backend_blue`/`backend_green` 양쪽을 액티브 헬스체크하며, 살아있는 쪽으로만 트래픽을 라우팅한다.
- `.github/workflows/deploy-backend.yml`의 deploy 잡: 현재 실행 중인 컬러를 감지 → 반대 컬러에 새 이미지 배포 → healthy 될 때까지 대기(최대 60초) → `docker exec academy-caddy-prod caddy reload`로 Caddy 설정 무중단 리로드(컨테이너 재시작이 아니라 `caddy reload`라 API/프론트 프록시가 끊기지 않는다) → 기존 컬러 정지. healthy 확인 실패 시 새 컨테이너를 롤백하고 기존 컬러는 그대로 유지한 채 워크플로를 실패 처리한다.
- `docker-compose.override.yml`(IP 직접 테스트용, `backend`에 host 포트 3000 매핑)은 도메인·Caddy HTTPS 확인 후 제거 대상이었고, blue/green 전환에서 `backend` 서비스 자체가 없어져 남아 있으면 컴포즈 병합이 깨진다. 2026-07-12 blue/green 전환 시 서버에서 삭제했고, 배포 스크립트도 더 이상 `-f docker-compose.override.yml`을 참조하지 않는다.
- **최초 1회 수동 전환**: blue/green 도입 전에는 컨테이너명이 `academy-backend-prod`(서비스명 `backend`) 하나였다. 자동 배포 워크플로는 `academy-backend-blue`/`-green`만 감지하므로 구 컨테이너를 정리하지 않으면 orphan으로 남는다 — 첫 전환 직후 `docker stop academy-backend-prod && docker rm academy-backend-prod`로 수동 정리한다.
