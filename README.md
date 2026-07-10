# Academy Homepage (학원 홈페이지)

공개 사이트(강좌·강사·공지 조회 및 수강신청)와 관리자용 백오피스(CRUD)를 포함하는 학원 홈페이지 프로젝트입니다.
프론트엔드(`frontend/`)와 백엔드(`backend/`)가 완전히 분리된 구조를 가집니다.

## 🛠 기술 스택

### Frontend

- **Framework**: Next.js (App Router), React
- **Language**: TypeScript
- **State Management & Fetching**: Zustand, TanStack Query (React Query)
- **Styling**: Tailwind CSS
- **Validation**: Zod

### Backend

- **Framework**: NestJS
- **Language**: TypeScript
- **Database / ORM**: PostgreSQL (Docker Compose), Prisma (v6.x)
- **Auth**: JWT (passport-jwt)

---

## 📁 프로젝트 구조

```text
academy-hompage/
├── backend/          # NestJS 서버
│   ├── docker-compose.yml   # Postgres DB (포트: 5433:5432)
│   ├── prisma/              # 스키마 및 시드 데이터
│   └── src/                 # 백엔드 비즈니스 로직 (Auth, Courses, Notices 등)
└── frontend/         # Next.js 클라이언트
    └── src/
        ├── api/             # API 호출 및 Zod 스키마 검증
        ├── app/             # App Router 라우트 기반 파일
        ├── components/      # 공통 컴포넌트
        ├── queries/         # TanStack Query 훅
        ├── stores/          # Zustand 상태 관리
        └── screens/         # 재사용 가능한 화면 단위 컴포넌트
```

---

## 🚀 로컬 개발 환경 실행 방법

백엔드와 프론트엔드를 각각 다른 터미널을 열어 별도로 실행해야 합니다.

### 1. 백엔드 (Backend) 실행

```bash
cd backend

# 패키지 설치
npm install

# 데이터베이스(PostgreSQL) 컨테이너 기동 (최초 1회 또는 재부팅 후)
docker compose up -d

# 스키마 동기화 및 시드 데이터 초기화 (최초 1회만)
npx prisma migrate dev
npx prisma db seed

# 백엔드 서버 실행 (http://localhost:3000)
npm run start:dev

# 시드값으로 초기화
cd backend
npx prisma migrate reset      # 스키마 초기화 + 기존 데이터 삭제 (확인 프롬프트 있음, --force로 스킵 가능)
npm run prisma:generate       # Prisma 7은 자동 생성 안 함 — 명시적 실행 필요
npm run prisma:seed           # 시드 데이터 재적용
```

> **주의**: Prisma 버전은 호환성 유지를 위해 `6.x`로 고정되어 있습니다. `7.x`로 강제 업그레이드하지 마세요.

### 2. 프론트엔드 (Frontend) 실행

```bash
cd frontend

# 패키지 설치
npm install

# 프론트엔드 개발 서버 실행 (http://localhost:3001)
npm run dev
```

---

## 🔑 초기 관리자 계정 (시드 데이터)

최초 `npx prisma db seed` 실행 시 기본적으로 생성되는 관리자 계정 정보입니다.

- **아이디**: `admin`
- **비밀번호**: `admin1234`
  _(환경변수 `.env`의 `ADMIN_SEED_USERNAME`, `ADMIN_SEED_PASSWORD` 설정에 따라 다를 수 있습니다.)_

---

## 📌 주요 아키텍처 규칙

- **API 응답 파싱**: 프론트엔드에서는 항상 `Zod`를 이용해 백엔드 API 응답을 검증하고 타입 안정성을 확보합니다.
- **인증(Auth)**: 백엔드의 조회(`GET`)는 기본적으로 공개되어 있으며, 생성/수정/삭제(`POST`, `PATCH`, `DELETE`) 등 쓰기 작업에만 `JwtAuthGuard`가 적용되어 있습니다.
- **SEO 최적화**: 검색 노출이 필요한 페이지는 `Next.js`의 App Router(`src/app/`) 기능을 활용하여 관리합니다.
