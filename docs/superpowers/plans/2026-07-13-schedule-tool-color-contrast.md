# 일정 드래그 도구 색상 대비 개선 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 관리자 수업 일정에서 첫 번째와 두 번째 월 도구·달력 셀의 보라색과 하늘색을 명확히 구분한다.

**Architecture:** `MonthCalendar.tsx`의 `monthColors`는 도구 버튼과 달력 수업일 셀이 공통으로 소비하는 단일 색상 소스다. 첫 두 색상 토큰만 각각 라벤더/자주색 및 민트/청록색 세트로 변경하고, Playwright가 도구와 드래그된 셀에 적용된 색상 클래스를 확인한다.

**Tech Stack:** Next.js, React, Tailwind CSS, Playwright

## Global Constraints

- 데이터 모델, 선택·드래그 동작, 세 번째 이후 월 색상은 변경하지 않는다.
- 프론트엔드 동작 변경은 Playwright RED-GREEN 순서로 검증한다.
- E2E는 `frontend/`에서 `npx playwright test`로 실행한다.

---

### Task 1: 월 도구와 달력 셀의 고대비 색상 계약

**Files:**
- Modify: `frontend/e2e/specs/admin-class-schedule.spec.ts`
- Modify: `frontend/src/components/class-schedule/MonthCalendar.tsx:4`

**Interfaces:**
- Consumes: `monthColor(index: number): string`가 반환하는 Tailwind 배경·테두리 클래스
- Produces: 첫 번째 월은 `bg-[#f0e5ff] border-[#7e3fb2]`, 두 번째 월은 `bg-[#d7f4f0] border-[#16877b]`를 사용하는 일정 도구와 달력 셀

- [ ] **Step 1: 실패하는 Playwright 명세를 작성한다**

  `frontend/e2e/specs/admin-class-schedule.spec.ts`에 다음 명세를 추가한다.

  ```ts
  test('월별 도구와 달력 셀에 서로 구분되는 색상을 사용한다', async ({ page }) => {
    await page.goto('/admin/schedules')
    const toolbar = page.getByRole('toolbar', { name: '드래그 도구' })
    await expect(toolbar.getByRole('button', { name: '6월분' })).toHaveClass(/bg-\[#f0e5ff\].*border-\[#7e3fb2\]/)
    await expect(toolbar.getByRole('button', { name: '7월분' })).toHaveClass(/bg-\[#d7f4f0\].*border-\[#16877b\]/)
  })
  ```

- [ ] **Step 2: 명세가 실패하는지 확인한다**

  Run: `npx playwright test e2e/specs/admin-class-schedule.spec.ts --grep "월별 도구와 달력 셀"`

  Expected: FAIL. 기존 도구는 `bg-[#eadcff]` 또는 `bg-[#c9ecff]` 클래스를 가져 기대한 고대비 색상 클래스와 일치하지 않는다.

- [ ] **Step 3: 최소 색상 변경을 구현한다**

  `frontend/src/components/class-schedule/MonthCalendar.tsx`의 `monthColors` 첫 두 항목만 아래 값으로 바꾼다.

  ```ts
  const monthColors = [
    'bg-[#f0e5ff] border-[#7e3fb2]',
    'bg-[#d7f4f0] border-[#16877b]',
    'bg-[#dff3a8] border-[#acd85d]',
    'bg-[#ffeaa1] border-[#f1c84b]',
    'bg-[#ffd5c2] border-[#efaa8c]',
  ]
  ```

- [ ] **Step 4: 변경된 명세와 기존 일정 관리자 명세를 확인한다**

  Run: `npx playwright test e2e/specs/admin-class-schedule.spec.ts`

  Expected: PASS. 도구 색상 명세를 포함한 관리자 수업 일정 명세 전체가 통과한다.

- [ ] **Step 5: 타입 검사를 실행한다**

  Run: `npx tsc --noEmit`

  Expected: exit code 0.

- [ ] **Step 6: 변경 파일을 검토하고 커밋한다**

  Run: `git diff --check && git diff -- frontend/src/components/class-schedule/MonthCalendar.tsx frontend/e2e/specs/admin-class-schedule.spec.ts`

  Expected: 공백 오류 없이 첫 두 색상 토큰과 E2E 색상 계약만 변경되어 있다.

  ```bash
  git add frontend/src/components/class-schedule/MonthCalendar.tsx frontend/e2e/specs/admin-class-schedule.spec.ts
  git commit -m "fix(frontend): 일정 도구 색상 대비 강화"
  ```
