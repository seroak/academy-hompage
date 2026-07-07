# 희망 시간 자유 지정(분 단위 범위) 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/apply` 신청 폼과 관리자 예약 페이지의 희망 시간을 `hour`(정시 고정) 대신 `startMinute`/`endMinute`(10분 단위 자유 범위)로 표현하도록 백엔드·프론트 전체를 바꾼다.

**Architecture:** Prisma 스키마의 `ReservationPreferredSlot`/`ReservationGroup`에서 `hour: Int`를 `startMinute: Int`/`endMinute: Int`로 교체하고, 그룹 확정 매칭 로직을 "정확히 같은 시각"에서 "확정 범위가 희망 범위 안에 완전히 포함"으로 바꾼다. 신청 폼은 요일×10분 그리드에서 마우스 드래그(또는 2-클릭)로 범위를 선택하는 신규 컴포넌트로 교체하고, 관리자 페이지는 30분 단위 시간표 + 시작/종료 시간 입력 폼으로 바꾼다.

**Tech Stack:** NestJS + Prisma 6.x + PostgreSQL(docker-compose, 로컬 개발용), class-validator, Next.js App Router + React + Zod, Playwright MCP(수동 e2e 확인용, 별도 테스트 러너 없음)

**참고 문서:** `docs/superpowers/specs/2026-07-07-flexible-preferred-time-design.md`

**중요 — 컴파일이 일시적으로 깨지는 구간:** Task 1에서 Prisma 스키마를 바꾸는 순간부터 Task 7(백엔드)이 끝날 때까지, `hour`를 참조하던 여러 백엔드 파일(서비스/DTO/시드)이 순차적으로 고쳐진다. 그 사이 `npx jest`를 돌리면 아직 손대지 않은 파일에서 컴파일 에러가 날 수 있다 — 이는 각 태스크가 예상한 RED 상태이며, Task 7에서 전체가 GREEN이 되는 것을 최종 확인한다.

---

## 사전 준비

```bash
cd backend
docker compose up -d
```

---

## Task 1: DB 초기화 + Prisma 스키마를 시간 범위로 마이그레이션

로컬 개발 Postgres에는 seed 데이터 4건뿐이고 운영 데이터가 없으므로, 데이터 변환 없이 컬럼을 교체한다.

**Files:**
- Modify: `backend/prisma/schema.prisma:125-145`

- [ ] **Step 1: 기존 예약 관련 테이블 비우기**

```bash
cd backend
docker compose exec -T postgres psql -U academy -d academy -c 'TRUNCATE "ReservationPreferredSlot", "ReservationGroup", "Reservation" RESTART IDENTITY CASCADE;'
```

Expected: `TRUNCATE TABLE` 출력.

- [ ] **Step 2: schema.prisma의 두 모델을 시간 범위로 교체**

`backend/prisma/schema.prisma`의 125~145행(`model ReservationPreferredSlot { ... }`, `model ReservationGroup { ... }`)을 다음으로 교체:

```prisma
model ReservationPreferredSlot {
  id            String      @id @default(cuid())
  reservation   Reservation @relation(fields: [reservationId], references: [id], onDelete: Cascade)
  reservationId String
  dayOfWeek     String
  startMinute   Int
  endMinute     Int

  @@unique([reservationId, dayOfWeek, startMinute, endMinute])
  @@index([dayOfWeek, startMinute, endMinute])
}

model ReservationGroup {
  id           String                 @id @default(cuid())
  label        String
  dayOfWeek    String
  startMinute  Int
  endMinute    Int
  status       ReservationGroupStatus @default(CONFIRMED)
  reservations Reservation[]
  createdAt    DateTime               @default(now())
  updatedAt    DateTime               @updatedAt
}
```

- [ ] **Step 3: 마이그레이션 생성 및 적용**

```bash
npx prisma migrate dev --name reservation_time_range
```

Expected: `backend/prisma/migrations/<timestamp>_reservation_time_range/migration.sql` 생성, 데이터 손실 확인 프롬프트 없이(테이블이 비어 있으므로) 바로 적용됨. 마지막에 "Your database is now in sync with your schema."

- [ ] **Step 4: 커밋**

```bash
git add backend/prisma/schema.prisma backend/prisma/migrations
git commit -m "feat(backend): 예약 희망 시간을 hour 고정값에서 분 단위 범위로 마이그레이션"
```

---

## Task 2: 공용 시간 범위 검증기 + PreferredSlotDto 변경 (TDD)

**Files:**
- Create: `backend/src/common/validators/time-range.validators.ts`
- Create: `backend/src/reservations/dto/create-reservation.dto.spec.ts`
- Modify: `backend/src/reservations/dto/create-reservation.dto.ts`

- [ ] **Step 1: 실패하는 DTO 검증 테스트 작성**

`backend/src/reservations/dto/create-reservation.dto.spec.ts` 생성:

```ts
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { PreferredSlotDto } from './create-reservation.dto';

describe('PreferredSlotDto', () => {
  function makeSlot(overrides: Partial<{ dayOfWeek: string; startMinute: number; endMinute: number }> = {}) {
    return plainToInstance(PreferredSlotDto, {
      dayOfWeek: 'MON',
      startMinute: 720,
      endMinute: 790,
      ...overrides,
    });
  }

  it('유효한 10분 단위 범위는 통과한다', async () => {
    const errors = await validate(makeSlot());
    expect(errors).toHaveLength(0);
  });

  it('시작 시각이 10분 단위가 아니면 실패한다', async () => {
    const errors = await validate(makeSlot({ startMinute: 725 }));
    expect(errors.some((error) => error.property === 'startMinute')).toBe(true);
  });

  it('종료 시각이 시작 시각보다 30분 이상 이후가 아니면 실패한다', async () => {
    const errors = await validate(makeSlot({ startMinute: 720, endMinute: 740 }));
    expect(errors.some((error) => error.property === 'endMinute')).toBe(true);
  });

  it('운영 시간(12:00~18:00)보다 이른 시작 시각은 실패한다', async () => {
    const errors = await validate(makeSlot({ startMinute: 700, endMinute: 760 }));
    expect(errors.some((error) => error.property === 'startMinute')).toBe(true);
  });

  it('운영 시간(12:00~18:00)보다 늦은 종료 시각은 실패한다', async () => {
    const errors = await validate(makeSlot({ startMinute: 1050, endMinute: 1100 }));
    expect(errors.some((error) => error.property === 'endMinute')).toBe(true);
  });
});
```

- [ ] **Step 2: 실패 확인**

```bash
npx jest src/reservations/dto/create-reservation.dto.spec.ts
```

Expected: FAIL — 기존 `PreferredSlotDto`는 `hour` 필드만 검증하므로, `hour`가 없는 입력에 대해 `errors`에 `hour` 관련 에러가 남아 `toHaveLength(0)` 기대가 깨지고, `startMinute`/`endMinute` 관련 에러는 존재하지 않아 나머지 테스트도 실패한다.

- [ ] **Step 3: 공용 검증기 구현**

`backend/src/common/validators/time-range.validators.ts` 생성:

```ts
import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

export const OPERATING_START_MINUTE = 720; // 12:00
export const OPERATING_END_MINUTE = 1080; // 18:00
export const SLOT_STEP_MINUTES = 10;
export const MIN_SLOT_DURATION_MINUTES = 30;

@ValidatorConstraint({ name: 'isMultipleOfSlotStep', async: false })
class IsMultipleOfSlotStepConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    return typeof value === 'number' && value % SLOT_STEP_MINUTES === 0;
  }

  defaultMessage(): string {
    return `시간은 ${SLOT_STEP_MINUTES}분 단위로 입력해 주세요`;
  }
}

export function IsMultipleOfSlotStep(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: IsMultipleOfSlotStepConstraint,
    });
  };
}

@ValidatorConstraint({ name: 'isValidSlotEndMinute', async: false })
class IsValidSlotEndMinuteConstraint implements ValidatorConstraintInterface {
  validate(endMinute: unknown, args: ValidationArguments): boolean {
    const object = args.object as { startMinute?: unknown };
    if (typeof endMinute !== 'number' || typeof object.startMinute !== 'number') {
      return false;
    }
    return endMinute - object.startMinute >= MIN_SLOT_DURATION_MINUTES;
  }

  defaultMessage(): string {
    return `종료 시각은 시작 시각보다 ${MIN_SLOT_DURATION_MINUTES}분 이상 이후여야 합니다`;
  }
}

export function IsValidSlotEndMinute(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: IsValidSlotEndMinuteConstraint,
    });
  };
}
```

- [ ] **Step 4: PreferredSlotDto 및 CreateReservationDto 변경**

`backend/src/reservations/dto/create-reservation.dto.ts` 전체를 다음으로 교체:

```ts
import { Type } from 'class-transformer';
import { ArrayMinSize, IsIn, IsInt, IsOptional, IsString, Max, Min, ValidateNested } from 'class-validator';
import {
  IsMultipleOfSlotStep,
  IsValidSlotEndMinute,
  OPERATING_END_MINUTE,
  OPERATING_START_MINUTE,
} from '../../common/validators/time-range.validators';

const DAYS_OF_WEEK = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export class PreferredSlotDto {
  @IsIn(DAYS_OF_WEEK)
  dayOfWeek: string;

  @IsInt()
  @Min(OPERATING_START_MINUTE)
  @Max(OPERATING_END_MINUTE)
  @IsMultipleOfSlotStep()
  startMinute: number;

  @IsInt()
  @Min(OPERATING_START_MINUTE)
  @Max(OPERATING_END_MINUTE)
  @IsMultipleOfSlotStep()
  @IsValidSlotEndMinute()
  endMinute: number;
}

export class CreateReservationDto {
  @IsString()
  childName: string;

  @IsInt()
  @Min(4)
  @Max(10)
  childAge: number;

  @IsString()
  parentName: string;

  @IsString()
  parentEmail: string;

  @IsOptional()
  @IsString()
  parentPhone?: string;

  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PreferredSlotDto)
  preferredSlots: PreferredSlotDto[];

  @IsOptional()
  @IsString()
  note?: string;
}
```

- [ ] **Step 5: 통과 확인**

```bash
npx jest src/reservations/dto/create-reservation.dto.spec.ts
```

Expected: PASS (5/5).

- [ ] **Step 6: 커밋**

```bash
git add backend/src/common backend/src/reservations/dto/create-reservation.dto.ts backend/src/reservations/dto/create-reservation.dto.spec.ts
git commit -m "feat(backend): 희망 시간 범위 검증기 추가 및 PreferredSlotDto를 분 단위로 변경"
```

---

## Task 3: 기존 reservations 스펙 픽스처 정리 (동작 변경 없음)

`reservations.service.ts`의 `create`/`update`는 `preferredSlots`를 그대로 통과시키므로 로직 변경은 없다. Task 2에서 DTO 타입이 바뀌었기 때문에 기존 테스트 픽스처의 `hour` 필드를 `startMinute`/`endMinute`로 바꿔야 컴파일이 유지된다.

**Files:**
- Modify: `backend/src/reservations/reservations.service.spec.ts:97-107,153-185`
- Modify: `backend/src/reservations/reservations.controller.spec.ts:46-60`

- [ ] **Step 1: reservations.service.spec.ts의 create 픽스처 수정**

97~107행의 `dto` 정의를 교체:

```ts
  describe('create', () => {
    const dto = {
      childName: '민준',
      childAge: 5,
      parentName: '김엄마',
      parentEmail: 'parent@example.com',
      preferredSlots: [
        { dayOfWeek: 'MON', startMinute: 720, endMinute: 790 },
        { dayOfWeek: 'WED', startMinute: 900, endMinute: 970 },
      ],
    };
```

- [ ] **Step 2: reservations.service.spec.ts의 update 테스트 수정**

153~185행("후보 시간이 포함되면...") 테스트 전체를 교체:

```ts
    it('후보 시간이 포함되면 기존 후보 시간을 새 목록으로 교체한다', async () => {
      const updated = {
        id: '1',
        preferredSlots: [
          { dayOfWeek: 'TUE', startMinute: 780, endMinute: 850 },
          { dayOfWeek: 'THU', startMinute: 960, endMinute: 1050 },
        ],
      };
      prisma.reservation.update.mockResolvedValue(updated);

      await expect(
        service.update('1', {
          preferredSlots: [
            { dayOfWeek: 'TUE', startMinute: 780, endMinute: 850 },
            { dayOfWeek: 'THU', startMinute: 960, endMinute: 1050 },
          ],
        }),
      ).resolves.toBe(updated);

      expect(prisma.reservation.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          preferredSlots: {
            deleteMany: {},
            create: [
              { dayOfWeek: 'TUE', startMinute: 780, endMinute: 850 },
              { dayOfWeek: 'THU', startMinute: 960, endMinute: 1050 },
            ],
          },
        },
        include: { preferredSlots: true },
      });
    });
```

- [ ] **Step 3: reservations.controller.spec.ts의 create 테스트 수정**

46~60행의 테스트를 교체:

```ts
  it('delegates create to the service with parent user principal', async () => {
    const dto = {
      childName: '민준',
      childAge: 5,
      parentName: '김엄마',
      parentEmail: 'parent@example.com',
      preferredSlots: [{ dayOfWeek: 'MON', startMinute: 720, endMinute: 790 }],
    };
    service.create.mockResolvedValue('created');

    await expect(
      controller.create(dto, { user: { parentUserId: 'parent-1' } }),
    ).resolves.toBe('created');
    expect(service.create).toHaveBeenCalledWith(dto, 'parent-1');
  });
```

- [ ] **Step 4: 통과 확인**

```bash
npx jest src/reservations/reservations.service.spec.ts src/reservations/reservations.controller.spec.ts
```

Expected: PASS (두 파일의 모든 테스트, `findAll`의 hour 필터 테스트는 아직 실패해도 무방 — Task 4에서 처리).

- [ ] **Step 5: 커밋**

```bash
git add backend/src/reservations/reservations.service.spec.ts backend/src/reservations/reservations.controller.spec.ts
git commit -m "test(backend): reservations 스펙 픽스처를 분 단위 필드로 정리"
```

---

## Task 4: QueryReservationsDto의 hour 필터 제거 (TDD)

단일 정시(hour)로 필터링하는 것은 시간 범위 모델과 맞지 않고, 어느 화면에서도 실제로 쓰이지 않는 기능이므로 제거한다.

**Files:**
- Modify: `backend/src/reservations/dto/query-reservations.dto.ts`
- Modify: `backend/src/reservations/reservations.service.ts:16-35`
- Modify: `backend/src/reservations/reservations.service.spec.ts:60-79`

- [ ] **Step 1: 실패 테스트로 갱신**

`reservations.service.spec.ts`의 60~79행(`'status/age/dayOfWeek/hour 필터를 where 절로 조립한다'`)을 교체:

```ts
    it('status/age/dayOfWeek 필터를 where 절로 조립한다', async () => {
      prisma.reservation.findMany.mockResolvedValue([]);

      await service.findAll({
        status: 'WAITING',
        age: 5,
        dayOfWeek: 'MON',
      });

      expect(prisma.reservation.findMany).toHaveBeenCalledWith({
        where: {
          status: 'WAITING',
          childAge: 5,
          preferredSlots: { some: { dayOfWeek: 'MON' } },
        },
        include: { preferredSlots: true },
        orderBy: { createdAt: 'desc' },
      });
    });
```

- [ ] **Step 2: 실패 확인**

```bash
npx jest src/reservations/reservations.service.spec.ts
```

Expected: FAIL — `reservations.service.ts`가 아직 `query.hour`를 참조하는데(Task 1에서 Prisma가 재생성한 `ReservationPreferredSlotWhereInput`에는 더 이상 `hour` 필드가 없음) 타입 에러 또는, `QueryReservationsDto`가 아직 `hour`를 갖고 있어 관련 없는 필드가 남아있는 상태로 컴파일은 되지만 개념적으로 낡은 코드가 남아 있는 상태.

- [ ] **Step 3: QueryReservationsDto에서 hour 제거**

`backend/src/reservations/dto/query-reservations.dto.ts` 전체 교체:

```ts
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

export class QueryReservationsDto {
  @IsOptional()
  @IsIn(['WAITING', 'GROUPED', 'CANCELLED'])
  status?: 'WAITING' | 'GROUPED' | 'CANCELLED';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(4)
  @Max(10)
  age?: number;

  @IsOptional()
  @IsIn(['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'])
  dayOfWeek?: string;
}
```

- [ ] **Step 4: reservations.service.ts의 findAll 정리**

`backend/src/reservations/reservations.service.ts`의 16~35행(`findAll`)을 교체:

```ts
  findAll(query: QueryReservationsDto) {
    const where: Prisma.ReservationWhereInput = {};

    if (query.status) where.status = query.status;
    if (query.age !== undefined) where.childAge = query.age;
    if (query.dayOfWeek) {
      where.preferredSlots = { some: { dayOfWeek: query.dayOfWeek } };
    }

    return this.prisma.reservation.findMany({
      where,
      include: { preferredSlots: true },
      orderBy: { createdAt: 'desc' },
    });
  }
```

- [ ] **Step 5: 통과 확인**

```bash
npx jest src/reservations/reservations.service.spec.ts
```

Expected: PASS (전체).

- [ ] **Step 6: 프론트 ReservationFilters와의 정합성을 위해 hour 필터 사용처가 없는지 확인**

```bash
grep -rn "filters.hour\|query.hour\|\.hour\b" backend/src frontend/src --include="*.ts" --include="*.tsx" | grep -v node_modules
```

Expected: 남은 `hour` 참조가 없어야 함(Task 5~13에서 나머지도 제거될 예정이므로 이 시점엔 admin/그룹 관련 잔여만 보일 수 있음 — 정상).

- [ ] **Step 7: 커밋**

```bash
git add backend/src/reservations/dto/query-reservations.dto.ts backend/src/reservations/reservations.service.ts backend/src/reservations/reservations.service.spec.ts
git commit -m "refactor(backend): 사용하지 않는 hour 조회 필터 제거"
```

---

## Task 5: CreateReservationGroupDto 변경 + 그룹 확정 포함 범위 검증 (TDD)

**Files:**
- Modify: `backend/src/reservation-groups/dto/create-reservation-group.dto.ts`
- Modify: `backend/src/reservation-groups/reservation-groups.service.ts:34-77`
- Modify: `backend/src/reservation-groups/reservation-groups.service.spec.ts:50-129`

- [ ] **Step 1: 실패하는 스펙으로 갱신**

`reservation-groups.service.spec.ts`의 50~129행(`describe('create', ...)` 전체)을 교체:

```ts
  describe('create', () => {
    const dto = {
      label: '월수금 12시반',
      dayOfWeek: 'MON',
      startMinute: 720,
      endMinute: 790,
      reservationIds: ['r1', 'r2'],
    };
    const waitingReservations = [
      {
        id: 'r1',
        status: 'WAITING',
        childName: '민준',
        parentName: '김엄마',
        parentEmail: 'a@example.com',
        preferredSlots: [{ dayOfWeek: 'MON', startMinute: 720, endMinute: 800 }],
      },
      {
        id: 'r2',
        status: 'WAITING',
        childName: '서연',
        parentName: '이엄마',
        parentEmail: 'b@example.com',
        preferredSlots: [
          { dayOfWeek: 'MON', startMinute: 700, endMinute: 800 },
          { dayOfWeek: 'WED', startMinute: 900, endMinute: 970 },
        ],
      },
    ];

    it('그룹을 생성하고 신청들을 GROUPED로 전환한 뒤 확정 이메일을 발송한다', async () => {
      prisma.reservation.findMany.mockResolvedValue(waitingReservations);
      const createdGroup = {
        id: 'g1',
        label: dto.label,
        dayOfWeek: dto.dayOfWeek,
        startMinute: dto.startMinute,
        endMinute: dto.endMinute,
        status: 'CONFIRMED',
      };
      prisma.reservationGroup.create.mockResolvedValue(createdGroup);
      prisma.reservation.updateMany.mockResolvedValue({ count: 2 });

      const result = await service.create(dto);

      expect(result).toBe(createdGroup);
      expect(prisma.reservationGroup.create).toHaveBeenCalledWith({
        data: {
          label: dto.label,
          dayOfWeek: dto.dayOfWeek,
          startMinute: dto.startMinute,
          endMinute: dto.endMinute,
        },
      });
      expect(prisma.reservation.updateMany).toHaveBeenCalledWith({
        where: { id: { in: dto.reservationIds } },
        data: { status: 'GROUPED', groupId: 'g1' },
      });
      expect(notification.sendGroupConfirmed).toHaveBeenCalledTimes(2);
      expect(notification.sendGroupConfirmed).toHaveBeenCalledWith(waitingReservations[0], createdGroup);
      expect(notification.sendGroupConfirmed).toHaveBeenCalledWith(waitingReservations[1], createdGroup);
    });

    it('확정 범위와 겹치는 후보 시간이 아예 없으면 ConflictException을 던진다', async () => {
      prisma.reservation.findMany.mockResolvedValue([
        waitingReservations[0],
        {
          ...waitingReservations[1],
          preferredSlots: [{ dayOfWeek: 'WED', startMinute: 900, endMinute: 970 }],
        },
      ]);

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
      expect(prisma.reservationGroup.create).not.toHaveBeenCalled();
    });

    it('확정 범위를 완전히 포함하지 못하는 후보 시간(부분 겹침)만 있으면 ConflictException을 던진다', async () => {
      prisma.reservation.findMany.mockResolvedValue([
        waitingReservations[0],
        {
          ...waitingReservations[1],
          preferredSlots: [{ dayOfWeek: 'MON', startMinute: 720, endMinute: 760 }],
        },
      ]);

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
      expect(prisma.reservationGroup.create).not.toHaveBeenCalled();
    });

    it('reservationIds 중 존재하지 않는 것이 있으면 ConflictException을 던진다', async () => {
      prisma.reservation.findMany.mockResolvedValue([waitingReservations[0]]);

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
      expect(prisma.reservationGroup.create).not.toHaveBeenCalled();
    });

    it('WAITING이 아닌 신청이 포함되어 있으면 ConflictException을 던진다', async () => {
      prisma.reservation.findMany.mockResolvedValue([
        waitingReservations[0],
        { ...waitingReservations[1], status: 'GROUPED' },
      ]);

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
      expect(prisma.reservationGroup.create).not.toHaveBeenCalled();
    });
  });
```

- [ ] **Step 2: 실패 확인**

```bash
npx jest src/reservation-groups/reservation-groups.service.spec.ts
```

Expected: FAIL — `dto`/`waitingReservations` 픽스처가 `startMinute`/`endMinute`를 쓰는데 `CreateReservationGroupDto`와 서비스 로직은 아직 `hour` 기준이라 타입/런타임 불일치로 컴파일 또는 어서션이 깨짐.

- [ ] **Step 3: CreateReservationGroupDto 변경**

`backend/src/reservation-groups/dto/create-reservation-group.dto.ts` 전체 교체:

```ts
import { ArrayNotEmpty, IsIn, IsInt, IsString, Max, Min } from 'class-validator';
import {
  IsMultipleOfSlotStep,
  IsValidSlotEndMinute,
  OPERATING_END_MINUTE,
  OPERATING_START_MINUTE,
} from '../../common/validators/time-range.validators';

const DAYS_OF_WEEK = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export class CreateReservationGroupDto {
  @IsString()
  label: string;

  @IsIn(DAYS_OF_WEEK)
  dayOfWeek: string;

  @IsInt()
  @Min(OPERATING_START_MINUTE)
  @Max(OPERATING_END_MINUTE)
  @IsMultipleOfSlotStep()
  startMinute: number;

  @IsInt()
  @Min(OPERATING_START_MINUTE)
  @Max(OPERATING_END_MINUTE)
  @IsMultipleOfSlotStep()
  @IsValidSlotEndMinute()
  endMinute: number;

  @ArrayNotEmpty()
  @IsString({ each: true })
  reservationIds: string[];
}
```

`update-reservation-group.dto.ts`는 `PartialType(OmitType(CreateReservationGroupDto, ['reservationIds']))` 구조라 새 필드를 자동으로 물려받으므로 수정 불필요.

- [ ] **Step 4: 그룹 매칭 로직을 포함 범위 검증으로 변경**

`backend/src/reservation-groups/reservation-groups.service.ts`의 34~77행(`create` 메서드) 중 아래 두 블록을 교체.

기존:

```ts
    if (
      reservations.some(
        (reservation) =>
          !reservation.preferredSlots.some(
            (slot) => slot.dayOfWeek === dto.dayOfWeek && slot.hour === dto.hour,
          ),
      )
    ) {
      throw new ConflictException('확정 시간은 모든 신청의 후보 시간에 포함되어야 합니다');
    }
```

교체:

```ts
    if (
      reservations.some(
        (reservation) =>
          !reservation.preferredSlots.some(
            (slot) =>
              slot.dayOfWeek === dto.dayOfWeek &&
              slot.startMinute <= dto.startMinute &&
              slot.endMinute >= dto.endMinute,
          ),
      )
    ) {
      throw new ConflictException('확정 시간은 모든 신청의 후보 시간 범위 안에 포함되어야 합니다');
    }
```

기존:

```ts
      const createdGroup = await tx.reservationGroup.create({
        data: { label: dto.label, dayOfWeek: dto.dayOfWeek, hour: dto.hour },
      });
```

교체:

```ts
      const createdGroup = await tx.reservationGroup.create({
        data: {
          label: dto.label,
          dayOfWeek: dto.dayOfWeek,
          startMinute: dto.startMinute,
          endMinute: dto.endMinute,
        },
      });
```

- [ ] **Step 5: 통과 확인**

```bash
npx jest src/reservation-groups/reservation-groups.service.spec.ts
```

Expected: PASS (5/5).

- [ ] **Step 6: 커밋**

```bash
git add backend/src/reservation-groups/dto/create-reservation-group.dto.ts backend/src/reservation-groups/reservation-groups.service.ts backend/src/reservation-groups/reservation-groups.service.spec.ts
git commit -m "feat(backend): 그룹 확정 매칭을 정시 일치에서 시간 범위 포함 검증으로 변경"
```

---

## Task 6: reservation-groups.controller.spec.ts 픽스처 정리

**Files:**
- Modify: `backend/src/reservation-groups/reservation-groups.controller.spec.ts:45-56`

- [ ] **Step 1: create 테스트 dto 수정**

45~56행을 교체:

```ts
  it('delegates create to the service', async () => {
    const dto = {
      label: '월수금 12시반',
      dayOfWeek: 'MON',
      startMinute: 720,
      endMinute: 790,
      reservationIds: ['r1', 'r2'],
    };
    service.create.mockResolvedValue('created');

    await expect(controller.create(dto)).resolves.toBe('created');
    expect(service.create).toHaveBeenCalledWith(dto);
  });
```

- [ ] **Step 2: 통과 확인**

```bash
npx jest src/reservation-groups/reservation-groups.controller.spec.ts
```

Expected: PASS (전체).

- [ ] **Step 3: 커밋**

```bash
git add backend/src/reservation-groups/reservation-groups.controller.spec.ts
git commit -m "test(backend): reservation-groups 컨트롤러 스펙 픽스처를 분 단위 필드로 정리"
```

---

## Task 7: seed.ts 갱신 + 재시딩 + 백엔드 전체 검증

**Files:**
- Modify: `backend/prisma/seed.ts:130-166`

- [ ] **Step 1: seed.ts의 예약 데이터를 분 단위 범위로 교체**

130~166행(`const reservations = [...]`)을 교체:

```ts
  const reservations = [
    {
      id: "seed-reservation-1",
      childName: "김하윤",
      childAge: 5,
      parentName: "김지은",
      parentEmail: "parent1@example.com",
      parentPhone: "010-1111-2222",
      preferredSlots: [{ dayOfWeek: "MON", startMinute: 720, endMinute: 790 }],
    },
    {
      id: "seed-reservation-2",
      childName: "이도현",
      childAge: 5,
      parentName: "이수진",
      parentEmail: "parent2@example.com",
      parentPhone: "010-2222-3333",
      preferredSlots: [{ dayOfWeek: "MON", startMinute: 720, endMinute: 810 }],
    },
    {
      id: "seed-reservation-3",
      childName: "박서아",
      childAge: 6,
      parentName: "박민영",
      parentEmail: "parent3@example.com",
      preferredSlots: [{ dayOfWeek: "WED", startMinute: 900, endMinute: 970 }],
    },
    {
      id: "seed-reservation-4",
      childName: "최지호",
      childAge: 4,
      parentName: "최은경",
      parentEmail: "parent4@example.com",
      preferredSlots: [{ dayOfWeek: "FRI", startMinute: 720, endMinute: 810 }],
      note: "낯가림이 있어 소규모 그룹을 희망합니다.",
    },
  ];
```

(reservation-1은 12:00~13:10(70분), reservation-2는 12:00~13:30(90분)으로 겹치게 만들어, 이후 관리자 그룹편성 e2e에서 "확정 범위가 두 신청 모두의 희망 범위 안에 포함"되는 케이스를 그대로 시연할 수 있게 함.)

- [ ] **Step 2: 백엔드 빌드 확인**

```bash
cd backend
npm run build
```

Expected: 에러 없이 `dist/` 생성 완료 (seed.ts를 포함해 hour를 참조하던 나머지 파일이 모두 정리됐는지 최종 확인).

- [ ] **Step 3: 재시딩**

```bash
npx prisma db seed
```

Expected: "Seed completed." 출력, 에러 없음.

- [ ] **Step 4: 전체 테스트 통과 확인**

```bash
npx jest
```

Expected: 모든 테스트 스위트 PASS, 실패 0건. 실제 "Tests: X passed, X total" 출력을 확인하고 기록한다.

- [ ] **Step 5: 커밋**

```bash
git add backend/prisma/seed.ts
git commit -m "chore(backend): seed 데이터를 분 단위 희망 시간 범위로 갱신"
```

---

## Task 8: 프론트 공용 스키마 개편 (reservation.schema.ts / reservation-group.schema.ts)

**Files:**
- Modify: `frontend/src/api/schemas/reservation.schema.ts`
- Modify: `frontend/src/api/schemas/reservation-group.schema.ts`

- [ ] **Step 1: reservation.schema.ts 전체 교체**

```ts
import { z } from 'zod'

export const DAY_OF_WEEK_OPTIONS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'] as const
export const RESERVATION_STATUS_OPTIONS = ['WAITING', 'GROUPED', 'CANCELLED'] as const

export const DAY_OF_WEEK_LABELS: Record<(typeof DAY_OF_WEEK_OPTIONS)[number], string> = {
  MON: '월',
  TUE: '화',
  WED: '수',
  THU: '목',
  FRI: '금',
  SAT: '토',
}

export const OPERATING_START_MINUTE = 720
export const OPERATING_END_MINUTE = 1080
export const SLOT_STEP_MINUTES = 10
export const MIN_SLOT_DURATION_MINUTES = 30

export function timeLabel(minute: number): string {
  const hours = Math.floor(minute / 60)
  const minutes = minute % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

export function timeRangeLabel(startMinute: number, endMinute: number): string {
  return `${timeLabel(startMinute)}~${timeLabel(endMinute)} · ${endMinute - startMinute}분`
}

export function parseTimeLabel(value: string): number {
  const [hoursText, minutesText] = value.split(':')
  return Number(hoursText) * 60 + Number(minutesText)
}

export const RESERVATION_STATUS_LABELS: Record<(typeof RESERVATION_STATUS_OPTIONS)[number], string> = {
  WAITING: '대기중',
  GROUPED: '그룹편성',
  CANCELLED: '취소됨',
}

export const PreferredSlotSchema = z
  .object({
    id: z.string().optional(),
    reservationId: z.string().optional(),
    dayOfWeek: z.enum(DAY_OF_WEEK_OPTIONS, {
      message: '희망 요일을 선택해 주세요',
    }),
    startMinute: z
      .number()
      .int('시작 시각은 10분 단위 정수로 입력해 주세요')
      .min(OPERATING_START_MINUTE, '12:00~18:00 사이에서 선택해 주세요')
      .max(OPERATING_END_MINUTE, '12:00~18:00 사이에서 선택해 주세요'),
    endMinute: z
      .number()
      .int('종료 시각은 10분 단위 정수로 입력해 주세요')
      .min(OPERATING_START_MINUTE, '12:00~18:00 사이에서 선택해 주세요')
      .max(OPERATING_END_MINUTE, '12:00~18:00 사이에서 선택해 주세요'),
  })
  .refine((slot) => slot.startMinute % SLOT_STEP_MINUTES === 0, {
    message: `${SLOT_STEP_MINUTES}분 단위로 선택해 주세요`,
    path: ['startMinute'],
  })
  .refine((slot) => slot.endMinute % SLOT_STEP_MINUTES === 0, {
    message: `${SLOT_STEP_MINUTES}분 단위로 선택해 주세요`,
    path: ['endMinute'],
  })
  .refine((slot) => slot.endMinute - slot.startMinute >= MIN_SLOT_DURATION_MINUTES, {
    message: `최소 ${MIN_SLOT_DURATION_MINUTES}분 이상 선택해 주세요`,
    path: ['endMinute'],
  })

export type PreferredSlot = z.infer<typeof PreferredSlotSchema>

export const ReservationSchema = z.object({
  id: z.string(),
  childName: z.string(),
  childAge: z.number(),
  parentName: z.string(),
  parentEmail: z.string(),
  parentPhone: z.string().nullable().optional(),
  preferredSlots: z.array(PreferredSlotSchema),
  note: z.string().nullable().optional(),
  status: z.enum(RESERVATION_STATUS_OPTIONS),
  groupId: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const ReservationListSchema = z.array(ReservationSchema)

export type Reservation = z.infer<typeof ReservationSchema>

export const CreateReservationInputSchema = z.object({
  childName: z.string().min(1, '아이 이름을 입력해 주세요'),
  childAge: z
    .number()
    .int('나이는 정수로 입력해 주세요')
    .min(4, '만 4세 이상만 신청 가능합니다')
    .max(10, '만 10세 이하만 신청 가능합니다'),
  parentName: z.string().min(1, '보호자 이름을 입력해 주세요'),
  parentEmail: z.string().min(1, '이메일을 입력해 주세요').email('올바른 이메일 형식이 아닙니다'),
  parentPhone: z.string().optional(),
  preferredSlots: z.array(PreferredSlotSchema).min(1, '가능한 시간을 1개 이상 선택해 주세요'),
  note: z.string().optional(),
})

export type CreateReservationInput = z.infer<typeof CreateReservationInputSchema>

export interface ReservationFilters {
  status?: (typeof RESERVATION_STATUS_OPTIONS)[number]
  age?: number
  dayOfWeek?: string
}
```

- [ ] **Step 2: reservation-group.schema.ts 전체 교체**

```ts
import { z } from 'zod'
import {
  DAY_OF_WEEK_OPTIONS,
  MIN_SLOT_DURATION_MINUTES,
  OPERATING_END_MINUTE,
  OPERATING_START_MINUTE,
  ReservationListSchema,
  SLOT_STEP_MINUTES,
} from './reservation.schema'

export const RESERVATION_GROUP_STATUS_OPTIONS = ['CONFIRMED', 'CANCELLED'] as const

export const ReservationGroupSchema = z.object({
  id: z.string(),
  label: z.string(),
  dayOfWeek: z.string(),
  startMinute: z.number(),
  endMinute: z.number(),
  status: z.enum(RESERVATION_GROUP_STATUS_OPTIONS),
  reservations: ReservationListSchema.optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const ReservationGroupListSchema = z.array(ReservationGroupSchema)

export type ReservationGroup = z.infer<typeof ReservationGroupSchema>

export const CreateReservationGroupInputSchema = z
  .object({
    label: z.string().min(1, '그룹 이름을 입력해 주세요'),
    dayOfWeek: z.enum(DAY_OF_WEEK_OPTIONS, { message: '요일을 선택해 주세요' }),
    startMinute: z
      .number()
      .int('시작 시각은 10분 단위 정수로 입력해 주세요')
      .min(OPERATING_START_MINUTE, '12:00~18:00 사이에서 선택해 주세요')
      .max(OPERATING_END_MINUTE, '12:00~18:00 사이에서 선택해 주세요'),
    endMinute: z
      .number()
      .int('종료 시각은 10분 단위 정수로 입력해 주세요')
      .min(OPERATING_START_MINUTE, '12:00~18:00 사이에서 선택해 주세요')
      .max(OPERATING_END_MINUTE, '12:00~18:00 사이에서 선택해 주세요'),
    reservationIds: z.array(z.string()).min(1, '신청을 1명 이상 선택해 주세요'),
  })
  .refine((input) => input.startMinute % SLOT_STEP_MINUTES === 0, {
    message: `${SLOT_STEP_MINUTES}분 단위로 선택해 주세요`,
    path: ['startMinute'],
  })
  .refine((input) => input.endMinute % SLOT_STEP_MINUTES === 0, {
    message: `${SLOT_STEP_MINUTES}분 단위로 선택해 주세요`,
    path: ['endMinute'],
  })
  .refine((input) => input.endMinute - input.startMinute >= MIN_SLOT_DURATION_MINUTES, {
    message: `최소 ${MIN_SLOT_DURATION_MINUTES}분 이상 선택해 주세요`,
    path: ['endMinute'],
  })

export type CreateReservationGroupInput = z.infer<typeof CreateReservationGroupInputSchema>
```

- [ ] **Step 3: 커밋**

```bash
git add frontend/src/api/schemas/reservation.schema.ts frontend/src/api/schemas/reservation-group.schema.ts
git commit -m "feat(frontend): 예약 스키마를 hour 고정값에서 분 단위 범위로 개편"
```

---

## Task 9: reservations.api.ts / reservationGroups.api.ts 필드명 정리

**Files:**
- Modify: `frontend/src/api/reservations.api.ts:10-18`
- Modify: `frontend/src/api/reservationGroups.api.ts:29-32`

- [ ] **Step 1: reservations.api.ts에서 hour 쿼리 파라미터 제거**

10~18행을 교체:

```ts
function toQueryString(filters: ReservationFilters): string {
  const params = new URLSearchParams()
  if (filters.status) params.set('status', filters.status)
  if (filters.age !== undefined) params.set('age', String(filters.age))
  if (filters.dayOfWeek) params.set('dayOfWeek', filters.dayOfWeek)
  const query = params.toString()
  return query ? `?${query}` : ''
}
```

- [ ] **Step 2: reservationGroups.api.ts의 updateReservationGroup 시그니처 수정**

29~32행을 교체:

```ts
export async function updateReservationGroup(
  id: string,
  input: Partial<Pick<CreateReservationGroupInput, 'label' | 'dayOfWeek' | 'startMinute' | 'endMinute'>>,
): Promise<ReservationGroup> {
```

- [ ] **Step 3: 커밋**

```bash
git add frontend/src/api/reservations.api.ts frontend/src/api/reservationGroups.api.ts
git commit -m "refactor(frontend): 예약 API 클라이언트를 분 단위 필드명으로 정리"
```

---

## Task 10: PreferredSlotsPicker 컴포넌트 신규 구현 (드래그 선택 UI)

**Files:**
- Create: `frontend/src/components/PreferredSlotsPicker.tsx`

- [ ] **Step 1: 컴포넌트 작성**

`frontend/src/components/PreferredSlotsPicker.tsx` 생성:

```tsx
'use client'

import { useRef, useState, type TouchEvent as ReactTouchEvent } from 'react'
import {
  DAY_OF_WEEK_LABELS,
  DAY_OF_WEEK_OPTIONS,
  MIN_SLOT_DURATION_MINUTES,
  OPERATING_END_MINUTE,
  OPERATING_START_MINUTE,
  SLOT_STEP_MINUTES,
  timeRangeLabel,
  type PreferredSlot,
} from '../api/schemas/reservation.schema'

type DayOfWeek = (typeof DAY_OF_WEEK_OPTIONS)[number]

interface PreferredSlotsPickerProps {
  value: PreferredSlot[]
  onChange: (slots: PreferredSlot[]) => void
}

const CELL_COUNT = (OPERATING_END_MINUTE - OPERATING_START_MINUTE) / SLOT_STEP_MINUTES
const CELL_INDEXES = Array.from({ length: CELL_COUNT }, (_, index) => index)

function indexToMinute(index: number): number {
  return OPERATING_START_MINUTE + index * SLOT_STEP_MINUTES
}

function slotContainsIndex(slot: PreferredSlot, index: number): boolean {
  const minute = indexToMinute(index)
  return minute >= slot.startMinute && minute < slot.endMinute
}

function slotKey(slot: PreferredSlot): string {
  return `${slot.dayOfWeek}-${slot.startMinute}-${slot.endMinute}`
}

export default function PreferredSlotsPicker({ value, onChange }: PreferredSlotsPickerProps) {
  const [pendingStart, setPendingStart] = useState<{ day: DayOfWeek; index: number } | null>(null)
  const [dragPreview, setDragPreview] = useState<{ day: DayOfWeek; low: number; high: number } | null>(null)
  const dragAnchorRef = useRef<{ day: DayOfWeek; index: number } | null>(null)
  const hasDraggedRef = useRef(false)

  function slotsForDay(day: DayOfWeek): PreferredSlot[] {
    return value.filter((slot) => slot.dayOfWeek === day)
  }

  function occupiedSlot(day: DayOfWeek, index: number): PreferredSlot | undefined {
    return slotsForDay(day).find((slot) => slotContainsIndex(slot, index))
  }

  function clampToFreeRange(day: DayOfWeek, anchor: number, target: number): { low: number; high: number } {
    let low = Math.min(anchor, target)
    let high = Math.max(anchor, target)
    for (const slot of slotsForDay(day)) {
      const slotLow = (slot.startMinute - OPERATING_START_MINUTE) / SLOT_STEP_MINUTES
      const slotHigh = (slot.endMinute - OPERATING_START_MINUTE) / SLOT_STEP_MINUTES - 1
      if (anchor > slotHigh) {
        low = Math.max(low, slotHigh + 1)
      }
      if (anchor < slotLow) {
        high = Math.min(high, slotLow - 1)
      }
    }
    return { low, high }
  }

  function commitRange(day: DayOfWeek, low: number, high: number) {
    const startMinute = indexToMinute(low)
    const endMinute = indexToMinute(high) + SLOT_STEP_MINUTES
    if (endMinute - startMinute < MIN_SLOT_DURATION_MINUTES) {
      return
    }
    onChange([...value, { dayOfWeek: day, startMinute, endMinute }])
  }

  function removeSlot(target: PreferredSlot) {
    onChange(value.filter((slot) => slotKey(slot) !== slotKey(target)))
  }

  function cellFromPoint(clientX: number, clientY: number): { day: DayOfWeek; index: number } | null {
    const element = document.elementFromPoint(clientX, clientY)
    const cell = element?.closest<HTMLElement>('[data-slot-day]')
    if (!cell || !cell.dataset.slotDay || !cell.dataset.slotIndex) return null
    const day = cell.dataset.slotDay as DayOfWeek
    const index = Number(cell.dataset.slotIndex)
    if (!(DAY_OF_WEEK_OPTIONS as readonly string[]).includes(day) || Number.isNaN(index)) return null
    return { day, index }
  }

  function endDrag(clientX: number, clientY: number) {
    window.removeEventListener('mousemove', handleWindowMouseMove)
    window.removeEventListener('mouseup', handleWindowMouseUp)
    const anchor = dragAnchorRef.current
    dragAnchorRef.current = null
    if (!anchor) return
    const point = cellFromPoint(clientX, clientY)
    const target = point && point.day === anchor.day ? point.index : anchor.index
    const { low, high } = clampToFreeRange(anchor.day, anchor.index, target)
    if (low !== high) {
      hasDraggedRef.current = true
      commitRange(anchor.day, low, high)
    }
    setDragPreview(null)
    setTimeout(() => {
      hasDraggedRef.current = false
    }, 0)
  }

  function handleWindowMouseMove(event: MouseEvent) {
    const anchor = dragAnchorRef.current
    if (!anchor) return
    const point = cellFromPoint(event.clientX, event.clientY)
    const target = point && point.day === anchor.day ? point.index : anchor.index
    const { low, high } = clampToFreeRange(anchor.day, anchor.index, target)
    setDragPreview({ day: anchor.day, low, high })
  }

  function handleWindowMouseUp(event: MouseEvent) {
    endDrag(event.clientX, event.clientY)
  }

  function handleMouseDown(day: DayOfWeek, index: number) {
    const occupied = occupiedSlot(day, index)
    if (occupied) {
      removeSlot(occupied)
      return
    }
    setPendingStart(null)
    dragAnchorRef.current = { day, index }
    setDragPreview({ day, low: index, high: index })
    window.addEventListener('mousemove', handleWindowMouseMove)
    window.addEventListener('mouseup', handleWindowMouseUp)
  }

  function handleTouchStart(day: DayOfWeek, index: number) {
    const occupied = occupiedSlot(day, index)
    if (occupied) {
      removeSlot(occupied)
      return
    }
    setPendingStart(null)
    dragAnchorRef.current = { day, index }
    setDragPreview({ day, low: index, high: index })
  }

  function handleTouchMove(event: ReactTouchEvent) {
    const anchor = dragAnchorRef.current
    if (!anchor) return
    const touch = event.touches[0]
    const point = cellFromPoint(touch.clientX, touch.clientY)
    const target = point && point.day === anchor.day ? point.index : anchor.index
    const { low, high } = clampToFreeRange(anchor.day, anchor.index, target)
    setDragPreview({ day: anchor.day, low, high })
  }

  function handleTouchEnd(event: ReactTouchEvent) {
    const touch = event.changedTouches[0]
    endDrag(touch.clientX, touch.clientY)
  }

  function handleClick(day: DayOfWeek, index: number) {
    if (hasDraggedRef.current) {
      return
    }
    const occupied = occupiedSlot(day, index)
    if (occupied) {
      removeSlot(occupied)
      setPendingStart(null)
      return
    }
    if (!pendingStart) {
      setPendingStart({ day, index })
      return
    }
    if (pendingStart.day !== day) {
      setPendingStart({ day, index })
      return
    }
    if (pendingStart.index === index) {
      setPendingStart(null)
      return
    }
    const { low, high } = clampToFreeRange(day, pendingStart.index, index)
    commitRange(day, low, high)
    setPendingStart(null)
  }

  function isPreviewCell(day: DayOfWeek, index: number): boolean {
    return dragPreview !== null && dragPreview.day === day && index >= dragPreview.low && index <= dragPreview.high
  }

  function isPendingStartCell(day: DayOfWeek, index: number): boolean {
    return pendingStart !== null && pendingStart.day === day && pendingStart.index === index
  }

  return (
    <div>
      <div className="mt-2 overflow-x-auto rounded-xl border border-slate-200 bg-brand-50/40 p-2">
        <div className="grid min-w-[560px] grid-cols-6 gap-1">
          {DAY_OF_WEEK_OPTIONS.map((day) => (
            <div key={day} className="flex flex-col gap-1">
              <p className="px-2 py-1 text-center text-xs font-semibold text-slate-600">
                {DAY_OF_WEEK_LABELS[day]}
              </p>
              <div className="flex flex-col gap-px" onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
                {CELL_INDEXES.map((index) => {
                  const occupied = occupiedSlot(day, index)
                  const preview = isPreviewCell(day, index)
                  const pendingCell = isPendingStartCell(day, index)
                  return (
                    <button
                      key={index}
                      type="button"
                      data-slot-day={day}
                      data-slot-index={index}
                      aria-label={`${DAY_OF_WEEK_LABELS[day]}요일 ${timeRangeLabel(
                        indexToMinute(index),
                        indexToMinute(index) + SLOT_STEP_MINUTES,
                      )}`}
                      aria-pressed={Boolean(occupied)}
                      onMouseDown={() => handleMouseDown(day, index)}
                      onTouchStart={() => handleTouchStart(day, index)}
                      onClick={() => handleClick(day, index)}
                      className={`h-2.5 rounded-sm border transition ${
                        occupied
                          ? 'border-brand-700 bg-brand-600'
                          : preview
                            ? 'border-brand-400 bg-brand-300'
                            : pendingCell
                              ? 'border-brand-500 bg-brand-200'
                              : 'border-slate-200 bg-white hover:bg-brand-100'
                      }`}
                    />
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
      <p className="mt-2 text-xs text-slate-500">
        원하는 요일의 시간대를 마우스로 드래그하거나, 시작 지점과 종료 지점을 각각 클릭해 선택해 주세요. 최소{' '}
        {MIN_SLOT_DURATION_MINUTES}분 이상 선택해야 합니다.
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {value.map((slot) => (
          <span
            key={slotKey(slot)}
            className="inline-flex items-center gap-1 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-800"
          >
            {DAY_OF_WEEK_LABELS[slot.dayOfWeek as DayOfWeek]} {timeRangeLabel(slot.startMinute, slot.endMinute)}
            <button
              type="button"
              aria-label="선택한 시간 삭제"
              onClick={() => removeSlot(slot)}
              className="text-brand-500 hover:text-brand-700"
            >
              ×
            </button>
          </span>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: 커밋**

```bash
git add frontend/src/components/PreferredSlotsPicker.tsx
git commit -m "feat(frontend): 드래그로 희망 시간 범위를 선택하는 PreferredSlotsPicker 추가"
```

---

## Task 11: ApplyPage.tsx에 PreferredSlotsPicker 연동

**Files:**
- Modify: `frontend/src/screens/ApplyPage.tsx`

- [ ] **Step 1: import 정리**

1~18행을 교체:

```tsx
"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";
import type { ParentProfile } from "../api/schemas/auth.schema";
import { useApplyReservationMutation } from "./hooks/useApplyReservationMutation";
import { useLoginModalStore } from "../stores/loginModalStore";
import { useParentAuthStore } from "../stores/parentAuthStore";
import PreferredSlotsPicker from "../components/PreferredSlotsPicker";
import {
  CreateReservationInputSchema,
  type CreateReservationInput,
} from "../api/schemas/reservation.schema";
```

- [ ] **Step 2: 더 이상 쓰지 않는 헬퍼 제거**

32~34행(`function slotKey(...)`)을 삭제.

103~119행(`isPreferredSlotSelected`, `togglePreferredSlot` 함수 두 개)을 삭제.

- [ ] **Step 3: 희망 시간 fieldset을 PreferredSlotsPicker로 교체**

216~267행(`<fieldset className="col-span-full">...</fieldset>`) 전체를 교체:

```tsx
        <fieldset className="col-span-full">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <legend className="text-sm font-medium text-slate-800">가능한 시간</legend>
            <span className="text-xs text-slate-500">선택된 시간 {form.preferredSlots.length}개</span>
          </div>
          <PreferredSlotsPicker
            value={form.preferredSlots}
            onChange={(slots) => setForm({ ...form, preferredSlots: slots })}
          />
          {fieldErrors.preferredSlots && (
            <span className="mt-1 block text-xs text-red-600">{fieldErrors.preferredSlots}</span>
          )}
        </fieldset>
```

- [ ] **Step 4: 커밋**

```bash
git add frontend/src/screens/ApplyPage.tsx
git commit -m "feat(frontend): 신청 폼 희망 시간을 드래그 선택 UI로 교체"
```

---

## Task 12: ReservationsAdminPage.tsx 개편 (30분 단위 시간표 + 시작/종료 입력)

**Files:**
- Modify: `frontend/src/screens/admin/ReservationsAdminPage.tsx`

- [ ] **Step 1: import 및 상수 정리**

10~26행을 교체:

```ts
import {
  DAY_OF_WEEK_LABELS,
  DAY_OF_WEEK_OPTIONS,
  MIN_SLOT_DURATION_MINUTES,
  OPERATING_END_MINUTE,
  OPERATING_START_MINUTE,
  parseTimeLabel,
  SLOT_STEP_MINUTES,
  timeLabel,
  timeRangeLabel,
  type Reservation,
} from '../../api/schemas/reservation.schema'
import { CreateReservationGroupInputSchema } from '../../api/schemas/reservation-group.schema'
import ReservationDetailModal from '../../components/ReservationDetailModal'

const CHILD_AGE_OPTIONS = [4, 5, 6, 7, 8, 9, 10]

const ADMIN_ROW_MINUTES = 30
const ADMIN_ROW_STARTS = Array.from(
  { length: (OPERATING_END_MINUTE - OPERATING_START_MINUTE) / ADMIN_ROW_MINUTES },
  (_, index) => OPERATING_START_MINUTE + index * ADMIN_ROW_MINUTES,
)

const emptyGroupForm = {
  label: '',
  dayOfWeek: 'MON' as (typeof DAY_OF_WEEK_OPTIONS)[number],
  startMinute: OPERATING_START_MINUTE,
  endMinute: OPERATING_START_MINUTE + MIN_SLOT_DURATION_MINUTES,
}
```

- [ ] **Step 2: 셀 조회 헬퍼를 시간 범위 겹침 검사로 변경**

69~80행(`hasPreferredSlot`, `cellReservations`)을 교체:

```ts
  function slotOverlapsRow(reservation: Reservation, day: string, rowStart: number): boolean {
    const rowEnd = rowStart + ADMIN_ROW_MINUTES
    return reservation.preferredSlots.some(
      (slot) => slot.dayOfWeek === day && slot.startMinute < rowEnd && slot.endMinute > rowStart,
    )
  }

  function cellReservations(day: string, rowStart: number) {
    const rowEnd = rowStart + ADMIN_ROW_MINUTES
    return {
      waitingInCell: waiting.filter((r) => slotOverlapsRow(r, day, rowStart)),
      groupedInCell: groups
        .filter(
          (group) =>
            group.status === 'CONFIRMED' &&
            group.dayOfWeek === day &&
            group.startMinute < rowEnd &&
            group.endMinute > rowStart,
        )
        .flatMap((group) => group.reservations ?? []),
    }
  }
```

- [ ] **Step 3: selectCell을 rowStart 기준으로 변경**

94~102행을 교체:

```ts
  function selectCell(day: (typeof DAY_OF_WEEK_OPTIONS)[number], rowStart: number) {
    const { waitingInCell } = cellReservations(day, rowStart)
    setSelectedIds(new Set(waitingInCell.map((r) => r.id)))
    setGroupForm({
      label: groupForm.label || `${DAY_OF_WEEK_LABELS[day]}요일 ${timeLabel(rowStart)}반`,
      dayOfWeek: day,
      startMinute: rowStart,
      endMinute: rowStart + ADMIN_ROW_MINUTES,
    })
  }
```

- [ ] **Step 4: 시간표 테이블 본문을 30분 행 기준으로 교체**

246~318행(`<tbody>{HOUR_OPTIONS.map(...)}</tbody>`) 전체를 교체:

```tsx
              <tbody>
                {ADMIN_ROW_STARTS.map((rowStart) => (
                  <tr key={rowStart}>
                    <td className="border-b border-[#f6ead0] p-3 text-xs font-black text-[#6f6253]">
                      {timeLabel(rowStart)}
                    </td>
                    {DAY_OF_WEEK_OPTIONS.map((day) => {
                      const { waitingInCell, groupedInCell } = cellReservations(day, rowStart)
                      return (
                        <td
                          key={day}
                          className={`border-b border-l border-[#f6ead0] p-2 align-top ${cellBackground(waitingInCell.length)}`}
                        >
                          <div className="flex min-h-16 flex-col gap-1.5">
                            {waitingInCell.map((reservation) => (
                              <div key={reservation.id} className="flex items-center gap-1">
                                <button
                                  type="button"
                                  title={reservationTitle(reservation)}
                                  onClick={() => toggleSelected(reservation.id)}
                                  className={`flex-1 truncate rounded-full px-3 py-1.5 text-left text-xs font-black transition ${
                                    selectedIds.has(reservation.id)
                                      ? 'bg-[#ff8a1f] text-white shadow-[0_8px_18px_rgba(255,138,31,0.22)]'
                                      : 'border border-[#f2dfb9] bg-white text-[#3f3a31] hover:border-[#ffd66b] hover:text-[#e86f00]'
                                  }`}
                                >
                                  {reservation.childName}
                                  <span className="ml-1 opacity-70">({reservation.childAge})</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDetailReservation(reservation)}
                                  aria-label="예약 상세 보기"
                                  className="grid size-7 shrink-0 place-items-center rounded-full text-[#8a7a61] transition hover:bg-[#fff0cf] hover:text-[#e86f00]"
                                >
                                  <Info size={15} strokeWidth={2.5} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleCancelReservation(reservation.id)}
                                  aria-label="신청 취소"
                                  className="grid size-7 shrink-0 place-items-center rounded-full text-[#d8bfa0] transition hover:bg-[#fff5f1] hover:text-[#d6452f]"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                            {groupedInCell.map((reservation) => (
                              <button
                                key={reservation.id}
                                type="button"
                                onClick={() => setDetailReservation(reservation)}
                                title={groupLabelByReservationId.get(reservation.id) ?? '편성됨'}
                                className="w-fit rounded-full bg-[#e7f4ff] px-3 py-1 text-left text-[11px] font-bold text-[#236c9c] transition hover:bg-[#d8ecff]"
                              >
                                {reservation.childName} · 편성됨
                              </button>
                            ))}
                            {waitingInCell.length >= 1 && (
                              <button
                                type="button"
                                onClick={() => selectCell(day, rowStart)}
                                className="text-left text-[10px] font-black text-[#e86f00] hover:underline"
                              >
                                이 칸 전체 선택
                              </button>
                            )}
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
```

- [ ] **Step 5: 그룹 확정 폼의 "확정 시간" select를 시작/종료 time input으로 교체**

기존 "확정 시간" `<label>` 블록(원본 374~389행)을 교체:

```tsx
        <label className={labelClass}>
          시작 시각
          <input
            type="time"
            className={fieldClass}
            min={timeLabel(OPERATING_START_MINUTE)}
            max={timeLabel(OPERATING_END_MINUTE - SLOT_STEP_MINUTES)}
            step={SLOT_STEP_MINUTES * 60}
            value={timeLabel(groupForm.startMinute)}
            onChange={(e) => setGroupForm({ ...groupForm, startMinute: parseTimeLabel(e.target.value) })}
          />
        </label>

        <label className={labelClass}>
          종료 시각
          <input
            type="time"
            className={fieldClass}
            min={timeLabel(OPERATING_START_MINUTE + SLOT_STEP_MINUTES)}
            max={timeLabel(OPERATING_END_MINUTE)}
            step={SLOT_STEP_MINUTES * 60}
            value={timeLabel(groupForm.endMinute)}
            onChange={(e) => setGroupForm({ ...groupForm, endMinute: parseTimeLabel(e.target.value) })}
          />
        </label>
```

- [ ] **Step 6: 확정된 그룹 카드의 시간 표시 갱신**

기존 그룹 카드 안의 시간 배지(원본 439~443행)를 교체:

```tsx
                    <span className="rounded-full bg-[#fff3c8] px-3 py-1 text-xs font-black text-[#9f4d00]">
                      {DAY_OF_WEEK_LABELS[group.dayOfWeek as keyof typeof DAY_OF_WEEK_LABELS] ??
                        group.dayOfWeek}{' '}
                      {timeRangeLabel(group.startMinute, group.endMinute)}
                    </span>
```

- [ ] **Step 7: 커밋**

```bash
git add frontend/src/screens/admin/ReservationsAdminPage.tsx
git commit -m "feat(frontend): 관리자 예약 페이지를 30분 단위 시간표와 시작/종료 입력으로 개편"
```

---

## Task 13: ReservationDetailModal.tsx 표시 갱신

**Files:**
- Modify: `frontend/src/components/ReservationDetailModal.tsx`

- [ ] **Step 1: import 교체**

5~10행의 `hourLabel` import를 `timeRangeLabel`로 교체:

```tsx
import {
  DAY_OF_WEEK_LABELS,
  RESERVATION_STATUS_LABELS,
  timeRangeLabel,
  type Reservation,
} from '../api/schemas/reservation.schema'
```

- [ ] **Step 2: 희망 시간 표시 갱신**

99~108행(`{reservation.preferredSlots.map(...)}`)을 교체:

```tsx
              {reservation.preferredSlots.map((slot) => (
                <span
                  key={`${slot.dayOfWeek}-${slot.startMinute}-${slot.endMinute}`}
                  className="rounded-full bg-[#fff0cf] px-3 py-1 text-xs font-black text-[#9f4d00]"
                >
                  {DAY_OF_WEEK_LABELS[slot.dayOfWeek as keyof typeof DAY_OF_WEEK_LABELS] ?? slot.dayOfWeek}{' '}
                  {timeRangeLabel(slot.startMinute, slot.endMinute)}
                </span>
              ))}
```

- [ ] **Step 3: 커밋**

```bash
git add frontend/src/components/ReservationDetailModal.tsx
git commit -m "feat(frontend): 예약 상세 모달의 희망 시간 표시를 분 단위 범위로 갱신"
```

---

## Task 14: 프론트 빌드 확인 및 잔여 타입 오류 정리

**Files:**
- 없음(검증 전용, 필요 시 위 태스크의 파일들을 미세 조정)

- [ ] **Step 1: 빌드 실행**

```bash
cd frontend
npm run build
```

Expected: 타입 에러 없이 빌드 성공. `hour`/`HOUR_OPTIONS`/`hourLabel` 참조가 남아 있으면 여기서 컴파일 에러로 드러난다 — 남은 참조는 각 태스크의 의도에 맞게 `startMinute`/`endMinute`/`timeLabel`/`timeRangeLabel`로 고친다.

- [ ] **Step 2: 잔여 참조 확인**

```bash
grep -rn "HOUR_OPTIONS\|hourLabel\|\.hour\b" frontend/src --include="*.ts" --include="*.tsx" | grep -v node_modules
```

Expected: 결과 없음.

- [ ] **Step 3: 커밋 (수정이 있었던 경우)**

```bash
git add -u frontend
git commit -m "fix(frontend): 빌드 시 드러난 잔여 hour 참조 정리"
```

수정이 없었다면 이 단계는 건너뛴다.

---

## Task 15: Playwright MCP로 신청 → 관리자 그룹편성 end-to-end 확인

**Files:**
- 없음(수동/브라우저 검증 전용)

- [ ] **Step 1: 백엔드/프론트 동시 기동**

```bash
cd backend && npm run start:dev
```
```bash
cd frontend && npm run dev
```

두 서버가 각각 `http://localhost:3000`, `http://localhost:3001`에서 뜬 것을 로그로 확인한다.

- [ ] **Step 2: 신청 폼 드래그 선택 확인**

Playwright MCP로 `http://localhost:3001/apply`에 접속한다. 로그인이 필요하면(로그인 모달이 뜨면) 화면에 보이는 로그인/회원가입 폼에 맞춰 진행한다(소셜 로그인 버튼만 있다면 자동화가 불가능하므로 사용자에게 수동 로그인을 요청 — 전역 CLAUDE.md 정책). 로그인 후:

1. `browser_snapshot`으로 희망 시간 그리드의 구조(요일별 세로 셀 목록)를 확인한다.
2. `mcp__playwright__browser_drag` 또는 `mcp__playwright__browser_run_code_unsafe`로 화요일 열의 한 셀에서 다른 셀까지 마우스 드래그를 재현해 시간 블록을 하나 만든다.
3. 칩 목록에 "화 HH:MM~HH:MM · N분" 형태로 정확히 표시되는지 `browser_snapshot`으로 확인한다.
4. 나머지 필수 필드(아이 이름, 나이, 보호자 이름, 이메일)를 채우고 "신청하기"를 클릭한다.
5. "접수 완료" 화면이 뜨는지 확인한다.

- [ ] **Step 3: 관리자 그룹편성 확인**

Playwright MCP로 `http://localhost:3001/admin/reservations`에 접속해 관리자 로그인 후:

1. `browser_snapshot`으로 30분 단위 시간표가 렌더링되고, seed된 MON 12:00 행에 김하윤/이도현 신청이 겹쳐 보이는지 확인한다.
2. 두 신청을 선택하고, 그룹 확정 폼의 시작 시각 12:00 / 종료 시각 13:10을 입력해 "선택한 신청으로 그룹 확정"을 클릭한다(seed 데이터상 두 신청 모두 이 범위를 포함하므로 성공해야 함).
3. "확정된 그룹" 목록에 "월 12:00~13:10 · 70분"이 표시되는지 확인한다.
4. 방금 만든 신청(Step 2에서 접수한 것)의 상세 모달을 열어 희망 시간이 드래그로 선택한 범위와 일치하는지 확인한다.

- [ ] **Step 4: 서버 정리**

확인이 끝나면 Step 1에서 띄운 백엔드/프론트 dev 서버를 종료하고, 완료 보고에 종료 사실을 명시한다.

---

## 완료 기준

- [ ] `backend`: `npx jest` 전체 통과
- [ ] `frontend`: `npm run build` 성공
- [ ] `/apply`에서 드래그(또는 2-클릭)로 임의의 시작~종료 시각(예: 70분/90분)을 선택해 신청이 접수됨
- [ ] `/admin/reservations`에서 30분 단위 시간표로 대기 신청을 확인하고, 시작~종료 시각을 직접 입력해 그룹을 확정할 수 있음
- [ ] 확정 범위가 신청 희망 범위 안에 완전히 포함되지 않으면 그룹 확정이 거부됨
