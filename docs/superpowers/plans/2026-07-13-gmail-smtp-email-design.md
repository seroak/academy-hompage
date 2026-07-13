# Gmail SMTP Email Design Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Gmail SMTP로 발송하는 4종 알림에 `생각을 여는 수학` 브랜드의 따뜻한 에디토리얼 HTML 디자인을 추가한다.

**Architecture:** `email-templates.ts`가 공통 테이블 레이아웃과 알림별 HTML을 책임지고, `NotificationService`는 기존 텍스트와 생성된 HTML을 Nodemailer에 함께 전달한다. 동적 값은 템플릿 경계에서 HTML 이스케이프하며 기존 SMTP 폴백과 오류 격리 동작은 유지한다.

**Tech Stack:** NestJS 11, TypeScript 5.7, Nodemailer 9, Jest 30, ts-jest ESM

## Global Constraints

- 대상은 신청 접수, 그룹 확정, 그룹 제외, 이메일 인증 메일 4종이다.
- 브랜드 색상은 `#fff7e8`, `#ff9f2f`, `#ff8a1f`, `#e86f00`, `#3b2506`을 사용한다.
- Gmail 호환성을 위해 외부 폰트·이미지·JavaScript 없이 테이블 레이아웃과 인라인 CSS를 사용한다.
- 예약 관련 메일에는 CTA를 추가하지 않고 이메일 인증에만 CTA와 원문 URL을 제공한다.
- 기존 텍스트 본문, SMTP 미설정 로그, 발송 실패 격리 동작을 유지한다.
- 새 런타임 의존성을 추가하지 않는다.

---

### Task 1: 안전한 브랜드 HTML 템플릿

**Files:**
- Create: `backend/src/notifications/email-templates.ts`
- Create: `backend/src/notifications/email-templates.spec.ts`

**Interfaces:**
- Consumes: 보호자 이름, 어린이 이름, 그룹명, 일정 문자열, 인증 URL
- Produces: `reservationReceivedEmail`, `groupConfirmedEmail`, `groupMemberRemovedEmail`, `parentEmailVerificationEmail` 함수. 각 함수는 완성된 HTML 문자열을 반환한다.

- [x] **Step 1: 동적 값 이스케이프와 4종 콘텐츠를 요구하는 실패 테스트 작성**

```ts
import {
  groupConfirmedEmail,
  groupMemberRemovedEmail,
  parentEmailVerificationEmail,
  reservationReceivedEmail,
} from './email-templates.js';

describe('email templates', () => {
  it('신청 접수 메일에 브랜드와 개인화 정보를 포함한다', () => {
    const html = reservationReceivedEmail({ parentName: '김엄마', childName: '민준' });
    expect(html).toContain('생각을 여는 수학');
    expect(html).toContain('수업 신청이 잘 접수되었어요');
    expect(html).toContain('김엄마');
    expect(html).toContain('민준');
  });

  it('그룹 확정 메일에 그룹과 일정을 포함하고 동적 값을 이스케이프한다', () => {
    const html = groupConfirmedEmail({
      parentName: '김<엄마>',
      childName: '민&준',
      groupLabel: '월수 <A조>',
      scheduleText: '월 12:00~13:10',
    });
    expect(html).toContain('함께 배울 그룹이 정해졌어요');
    expect(html).toContain('김&lt;엄마&gt;');
    expect(html).toContain('민&amp;준');
    expect(html).toContain('월수 &lt;A조&gt;');
    expect(html).toContain('월 12:00~13:10');
    expect(html).not.toContain('김<엄마>');
  });

  it('그룹 제외 메일에 기존 그룹과 대기 상태를 포함한다', () => {
    const html = groupMemberRemovedEmail({
      parentName: '김엄마', childName: '민준', groupLabel: '월수금반',
    });
    expect(html).toContain('수업 그룹 편성이 변경되었어요');
    expect(html).toContain('월수금반');
    expect(html).toContain('대기 상태');
  });

  it('인증 메일에 안전한 CTA와 원문 URL을 포함한다', () => {
    const html = parentEmailVerificationEmail({
      name: '김엄마',
      verifyUrl: 'https://academy.example/auth/verify-email?token=a&next=<home>',
    });
    expect(html).toContain('이메일 인증을 완료해 주세요');
    expect(html).toContain('이메일 인증하기');
    expect(html).toContain('https://academy.example/auth/verify-email?token=a&amp;next=&lt;home&gt;');
    expect(html).not.toContain('next=<home>');
  });
});
```

- [x] **Step 2: 실패를 확인**

Run: `cd backend && npm test -- --runInBand src/notifications/email-templates.spec.ts`

Expected: FAIL — `Cannot find module './email-templates.js'`.

- [x] **Step 3: 최소 HTML 템플릿 구현**

`email-templates.ts`에 다음 경계를 구현한다.

```ts
interface ReservationEmailData { parentName: string; childName: string }
interface GroupConfirmedEmailData extends ReservationEmailData {
  groupLabel: string;
  scheduleText: string;
}
interface GroupRemovedEmailData extends ReservationEmailData { groupLabel: string }
interface VerificationEmailData { name: string; verifyUrl: string }

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character] ?? character);
}

function layout(title: string, intro: string, content: string): string {
  return `<!doctype html>
<html lang="ko">
<body style="margin:0;background:#f4f2ed;font-family:Arial,'Apple SD Gothic Neo',sans-serif;color:#3b2506;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f2ed;">
    <tr><td align="center" style="padding:24px 12px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border-top:6px solid #ff8a1f;">
        <tr><td style="padding:36px 40px 24px;background:#fff7e8;">
          <p style="margin:0 0 12px;color:#e86f00;font-size:13px;font-weight:700;">생각을 여는 수학</p>
          <h1 style="margin:0 0 12px;font-size:28px;line-height:1.35;">${title}</h1>
          <p style="margin:0;color:#6b6255;line-height:1.7;">${intro}</p>
        </td></tr>
        <tr><td style="padding:32px 40px;">${content}</td></tr>
        <tr><td style="padding:22px 40px;background:#3b2506;color:#fff7e8;font-size:12px;line-height:1.6;">놀이에서 사고력, 교과까지 이어지는 배움<br>본 메일은 발신 전용입니다.</td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function reservationReceivedEmail(data: ReservationEmailData): string;
export function groupConfirmedEmail(data: GroupConfirmedEmailData): string;
export function groupMemberRemovedEmail(data: GroupRemovedEmailData): string;
export function parentEmailVerificationEmail(data: VerificationEmailData): string;
```

공통 레이아웃에는 오렌지 상단선, 브랜드명, 큰 제목, 본문, `놀이에서 사고력, 교과까지 이어지는 배움` 푸터를 넣는다. 인증 CTA는 `<a href="이스케이프된 URL">이메일 인증하기</a>`로 만들고 같은 URL을 일반 텍스트 링크로 한 번 더 표시한다.

- [x] **Step 4: 템플릿 테스트 통과 확인**

Run: `cd backend && npm test -- --runInBand src/notifications/email-templates.spec.ts`

Expected: PASS — 4 tests.

- [x] **Step 5: 템플릿 변경 커밋**

```bash
git add backend/src/notifications/email-templates.ts backend/src/notifications/email-templates.spec.ts
git commit -m "feat(backend): 브랜드 이메일 템플릿 추가"
```

### Task 2: Nodemailer의 multipart 발송 연결

**Files:**
- Modify: `backend/src/notifications/notification.service.ts:4-133`
- Modify: `backend/src/notifications/notification.service.spec.ts:61-150`

**Interfaces:**
- Consumes: Task 1의 4개 HTML 생성 함수
- Produces: Nodemailer `sendMail({ from, to, subject, text, html })` 호출

- [x] **Step 1: 4종 발송이 text와 html을 함께 전달하는 실패 테스트 작성**

기존 `notification.service.spec.ts`의 각 발송 기대값에 구체적인 HTML 검증을 추가한다.

```ts
expect(sendMail).toHaveBeenCalledWith(expect.objectContaining({
  to: 'parent@example.com',
  text: expect.stringContaining('민준'),
  html: expect.stringContaining('수업 신청이 잘 접수되었어요'),
}));

expect(sendMail).toHaveBeenCalledWith(expect.objectContaining({
  html: expect.stringMatching(/월수금 12시반[\s\S]*월 12:00~13:10/),
}));

expect(sendMail).toHaveBeenCalledWith(expect.objectContaining({
  html: expect.stringMatching(/그룹 편성이 변경되었어요[\s\S]*대기 상태/),
}));

expect(sendMail).toHaveBeenCalledWith(expect.objectContaining({
  text: expect.stringContaining('http://localhost:3001/auth/verify-email?token=abc123'),
  html: expect.stringMatching(/이메일 인증하기[\s\S]*token=abc123/),
}));
```

- [x] **Step 2: 기존 서비스 테스트의 실패 확인**

Run: `cd backend && npm test -- --runInBand src/notifications/notification.service.spec.ts`

Expected: FAIL — 실제 `sendMail` 인자에 `html`이 없음.

- [x] **Step 3: 템플릿을 연결하는 최소 구현 작성**

`notification.service.ts`에서 템플릿 함수를 import하고 각 공개 메서드가 기존 텍스트 다음에 HTML을 전달하도록 바꾼다.

```ts
private async sendMail(to: string, subject: string, text: string, html: string): Promise<void> {
  if (!to) { /* 기존 로그 유지 */ return; }
  if (!this.transporter) { /* 기존 subject + text 로그 유지 */ return; }
  try {
    await this.transporter.sendMail({ from: this.from, to, subject, text, html });
  } catch (error) {
    this.logger.error(`메일 발송 실패: to=${to}`, error instanceof Error ? error.stack : error);
  }
}
```

그룹 일정은 기존 `slotLabel` 결과를 그대로 사용하며, HTML 템플릿에는 `scheduleText`로 전달한다.

- [x] **Step 4: 서비스 테스트 통과 확인**

Run: `cd backend && npm test -- --runInBand src/notifications/notification.service.spec.ts`

Expected: PASS — 기존 8 tests와 강화한 HTML 검증 모두 통과.

- [x] **Step 5: 발송 연결 변경 커밋**

```bash
git add backend/src/notifications/notification.service.ts backend/src/notifications/notification.service.spec.ts
git commit -m "feat(backend): SMTP 알림에 브랜드 HTML 적용"
```

### Task 3: 회귀 및 빌드 검증

**Files:**
- Verify: `backend/src/notifications/email-templates.ts`
- Verify: `backend/src/notifications/email-templates.spec.ts`
- Verify: `backend/src/notifications/notification.service.ts`
- Verify: `backend/src/notifications/notification.service.spec.ts`

**Interfaces:**
- Consumes: Task 1과 Task 2의 완성된 구현
- Produces: 테스트·빌드 결과와 깨끗한 생성 파일 상태

- [x] **Step 1: 관련 테스트 함께 실행**

Run: `cd backend && npm test -- --runInBand src/notifications/email-templates.spec.ts src/notifications/notification.service.spec.ts`

Expected: PASS — 2 suites, 12 tests 이상.

- [x] **Step 2: 백엔드 전체 테스트 실행**

Run: `cd backend && npm test -- --runInBand`

Expected: 모든 suite와 test가 PASS.

- [x] **Step 3: 백엔드 production build 실행**

Run: `cd backend && npm run build`

Expected: Prisma Client 생성 및 Nest build가 exit code 0.

- [x] **Step 4: 정적 diff 검증**

Run: `git diff --check && git status --short && git diff --stat HEAD~2..HEAD`

Expected: whitespace 오류 없음. 구현 파일과 계획 문서 외에 예상하지 못한 생성 파일 변경 없음.

- [x] **Step 5: 계획 문서와 최종 조정 커밋**

```bash
git add docs/superpowers/plans/2026-07-13-gmail-smtp-email-design.md
git commit -m "docs: Gmail SMTP 구현 계획 추가"
```
