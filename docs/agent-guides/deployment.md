# 배포와 인프라 가이드

- 백엔드는 Oracle VM의 `docker-compose.prod.yml`(postgres, backend, caddy)에서 운영한다. 프론트는 Vercel에 별도 배포한다.
- Caddy의 frontend 프록시 블록은 대응 컨테이너가 없어 미사용이다. 되살리지 않는다.
- `main`에 `backend/**`가 push되면 GitHub Actions가 GHCR 이미지 빌드와 서버 배포를 수행한다. 프론트는 Vercel에서 별도 재배포한다.
- production compose는 항상 `--env-file .env.production`을 명시한다.
- Dockerfile은 `NODE_ENV=production`보다 먼저 `npm ci`를 실행한다. seed를 위해 `src/generated`와 필요한 `src` 소스를 러너 이미지에 포함한다.
- SSR fetch는 `API_INTERNAL_URL`을 우선하고 `NEXT_PUBLIC_API_BASE_URL`로 폴백한다. SSR 목록이 비어 보이면 이 URL부터 확인한다.
- 도메인 변경 시 루트 `.env.production`, `backend/.env.production`, Vercel 환경변수와 Google OAuth 리디렉션 URI·출처를 함께 갱신한다.
- 배포용 SSH 키는 전용 패스프레이즈 없는 키를 사용하고 시크릿으로 등록한다.
