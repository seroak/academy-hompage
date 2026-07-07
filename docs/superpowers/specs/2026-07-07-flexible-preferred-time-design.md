# 신청 희망 시간 자유 지정(분 단위 범위) 설계

## 배경 / 문제

`/apply` 신청 폼과 관리자 예약 페이지의 "희망 시간"은 현재 `dayOfWeek` + `hour(12~17 정수)` 조합의 체크박스 그리드로만 표현된다. 실제 수업은 70분/90분처럼 정각에 딱 맞지 않는 길이로 운영되므로, 학부모가 원하는 시작 시각과 소요 시간을 정각 단위로만 강제하는 현재 구조로는 실제 희망을 정확히 표현할 수 없다.

## 목표

- 학부모가 신청 폼에서 요일별로 "시작 시각 + 소요 시간"을 자유롭게(10분 단위) 지정할 수 있게 한다.
- 관리자가 신청을 모아 그룹을 확정할 때도 임의의 시작~종료 시각을 직접 입력할 수 있게 한다.
- `hour` 정수 필드에 의존하던 백엔드 스키마·매칭 로직·프론트 스키마·관리자 화면을 모두 분 단위 범위(`startMinute`/`endMinute`) 기반으로 일관되게 바꾼다.

## 범위

백엔드(schema/DTO/service) + 신청 폼(`/apply`) + 관리자 예약 페이지(`/admin/reservations`) 전체. 로컬 개발용 Postgres(docker-compose)만 사용 중이고 seed 데이터 4건 외 운영 데이터가 없으므로, 기존 `hour` 컬럼은 데이터 변환 마이그레이션 없이 컬럼 교체 + 재시딩으로 처리한다.

## 결정 사항 요약

| 질문 | 결정 |
|---|---|
| 학부모가 입력하는 것 | 시작 시각 + 소요 시간 (둘 다) |
| 소요 시간 입력 방식 | 시간대를 드래그해서 선택하는 UI |
| 드래그 스냅 단위 | 10분 |
| 하루에 여러 블록 선택 | 가능해야 함 |
| 그리드 적용 범위(운영 시간) | 기존과 동일한 창구: 12:00~18:00 |
| 그룹 확정 시 실제 수업 시간 결정 방식 | 관리자가 시작~종료를 직접 입력 |
| 작업 범위 | 백엔드 + 신청폼 + 관리자 페이지 모두 |

## 1. 데이터 모델

### `ReservationPreferredSlot`

| 필드 | 기존 | 변경 |
|---|---|---|
| `dayOfWeek` | `String` | 유지 |
| `hour` | `Int` (12~17) | 제거 |
| `startMinute` | 없음 | `Int` 신규 — 자정 기준 분 |
| `endMinute` | 없음 | `Int` 신규 — 자정 기준 분 |

제약:
- `720 <= startMinute < endMinute <= 1080` (12:00~18:00)
- `startMinute % 10 === 0 && endMinute % 10 === 0`
- `endMinute - startMinute >= 30` (최소 30분 — 10분짜리 실수 드래그 방지, 70/90분 같은 실제 수업 길이를 표현하려는 목적에 맞춤)
- 유니크 제약은 `[reservationId, dayOfWeek, startMinute, endMinute]`로 교체
- 인덱스 `[dayOfWeek, startMinute, endMinute]`로 교체

### `ReservationGroup`

`hour: Int` → `startMinute: Int`, `endMinute: Int` (동일 제약 재사용, 최소 30분 제약은 그룹 확정에도 동일 적용).

### 마이그레이션

`npx prisma migrate dev`로 신규 마이그레이션 생성. 기존 `hour` 값 백필 없이 컬럼 교체(로컬 개발 데이터만 존재하므로 허용). `seed.ts`의 4건 `preferredSlots`를 `hour` → `{startMinute, endMinute}` 쌍으로 갱신(예: 기존 `hour: 12` → `startMinute: 720, endMinute: 790`(70분) 등 임의의 대표값으로 교체).

## 2. 백엔드 API / 검증

- `create-reservation.dto.ts`: `preferredSlots` 항목을 `{dayOfWeek, startMinute, endMinute}`로, 위 제약을 `class-validator`로 반영.
- `create-reservation-group.dto.ts`, `update-reservation-group.dto.ts`: `hour` → `startMinute`, `endMinute`.
- `reservation-groups.service.ts`의 `create()` 검증 로직 변경:
  - 기존: `slot.dayOfWeek === dto.dayOfWeek && slot.hour === dto.hour`
  - 변경: `slot.dayOfWeek === dto.dayOfWeek && slot.startMinute <= dto.startMinute && slot.endMinute >= dto.endMinute` (확정 범위가 해당 신청의 희망 범위 안에 완전히 포함되어야 함)
- 관련 `*.spec.ts`(reservations, reservation-groups 양쪽 controller/service)를 TDD로 먼저 실패시키고 구현.

## 3. 프론트 공용 스키마 (`frontend/src/api/schemas/reservation.schema.ts`)

- `HOUR_OPTIONS`, `hourLabel` 제거.
- 신규:
  - `OPERATING_START_MINUTE = 720`, `OPERATING_END_MINUTE = 1080`, `SLOT_STEP_MINUTES = 10`, `MIN_SLOT_DURATION_MINUTES = 30`
  - `timeLabel(minute: number): string` — 예: `870` → `"14:30"`
  - `timeRangeLabel(start: number, end: number): string` — 예: `"14:00~15:10 · 70분"`
- `PreferredSlotSchema`: `dayOfWeek` 유지, `hour` 제거, `startMinute`/`endMinute`에 위 제약을 `zod refine`으로 반영.
- `ReservationGroup` 관련 스키마(`reservation-group.schema.ts`)도 동일하게 `hour` → `startMinute`/`endMinute`.

## 4. 신청 폼(`/apply`) — 드래그 선택 UI

신규 컴포넌트 `frontend/src/components/PreferredSlotsPicker.tsx` (기존 `ReservationDetailModal.tsx`와 같은 위치 — 특정 화면 전용이지만 로직이 복잡해 별도 파일로 분리).

동작:
- 요일(6열) × 10분 단위 시간축(12:00~18:00, 36행)의 타임라인 그리드.
- 마우스: `mousedown`(시작 셀) → `mousemove`(드래그 중 프리뷰) → `mouseup`(확정). 터치: `touchstart`/`touchmove`/`touchend` 동일 대응.
- 접근성 대안: 드래그 없이 "시작 셀 클릭 → 끝 셀 클릭"의 2-클릭으로도 동일한 블록 생성 가능(키보드 포커스 + Enter로도 동작).
- 드래그/2-클릭 중 실시간으로 `"화 14:00~15:10 · 70분"` 프리뷰 표시.
- 같은 요일 안에서 기존 블록과 겹치지 않도록 드래그 범위를 클램프(기존 블록 경계에서 멈춤).
- 하루에 여러 블록 생성 가능.
- 선택된 블록은 칩 목록으로 하단에 표시, 칩의 삭제 버튼으로 제거 가능.
- `ApplyPage.tsx`는 `form.preferredSlots: {dayOfWeek, startMinute, endMinute}[]`를 이 컴포넌트에 위임하고, 기존 `togglePreferredSlot`/`isPreferredSlotSelected`/그리드 JSX(103~267행 부근)를 제거.

## 5. 관리자 예약 페이지(`ReservationsAdminPage.tsx`)

- 시간표: 기존 `HOUR_OPTIONS`(6행) → 30분 단위(12행, 12:00~17:30) 세분화.
- `cellReservations(day, rowStartMinute)`: 해당 30분 구간과 **겹치는**(`slot.startMinute < rowStartMinute+30 && slot.endMinute > rowStartMinute`) 신청을 표시. 70/90분짜리 블록은 여러 행에 걸쳐 반복 노출(같은 예약 버튼이 여러 셀에 나타나되 클릭 시 선택 상태는 동일 id로 공유).
- "이 칸 전체 선택"은 동일하게 유지(해당 행에 겹치는 대기중 신청 전체 선택).
- 그룹 확정 폼: "확정 시간" `<select>`(hour) 1개 → 시작/종료 `<input type="time" step={600} min="12:00" max="18:00">` 2개로 교체. `groupForm`은 `{label, dayOfWeek, startMinute, endMinute}`.
- 확정된 그룹 카드, `ReservationDetailModal.tsx`의 희망 시간 표시는 `timeRangeLabel`로 교체.

## 6. 테스트 / 검증 순서 (TDD)

1. 백엔드: `schema.prisma` 마이그레이션 → DTO 변경 → `reservation-groups.service.ts` 매칭 로직 변경 → 관련 `*.spec.ts`를 먼저 실패시키고(RED) 구현(GREEN) → `seed.ts` 갱신.
2. 프론트 공용 스키마(`reservation.schema.ts`, `reservation-group.schema.ts`) 변경.
3. `PreferredSlotsPicker` 신규 구현 → `ApplyPage.tsx` 연동.
4. 관리자 페이지(`ReservationsAdminPage.tsx`, `ReservationDetailModal.tsx`) 갱신.
5. 백엔드 `npx jest` 전체 통과 확인.
6. 프론트/백엔드 동시 기동 후 Playwright(또는 브라우저 수동)로 신청(`/apply`, 드래그 선택) → 관리자 그룹편성(`/admin/reservations`, 시작~종료 입력)까지 end-to-end 확인.

## 비목표(이번 범위 아님)

- 실제 수업 시간(70분/90분) 자체를 상품/강좌 데이터로 관리하는 기능(강좌별 표준 소요시간 필드 등)은 이번 범위에 포함하지 않는다. 이번 변경은 "희망 시간 표현 방식"만 다룬다.
- 겹치는 그룹 확정 범위 간 충돌 검사(같은 시간대에 여러 그룹이 동시에 잡히는 경우 경고 등)는 다루지 않는다 — 기존에도 없던 기능이며 이번 변경과 무관.
