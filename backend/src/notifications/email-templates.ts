interface ReservationEmailData {
  parentName: string;
  childName: string;
}

interface GroupConfirmedEmailData extends ReservationEmailData {
  groupLabel: string;
  scheduleText: string;
}

interface GroupRemovedEmailData extends ReservationEmailData {
  groupLabel: string;
}

interface VerificationEmailData {
  name: string;
  verifyUrl: string;
}

const COLORS = {
  background: '#f4f2ed',
  brand50: '#fff7e8',
  brand500: '#ff9f2f',
  brand600: '#ff8a1f',
  brand700: '#e86f00',
  brand950: '#3b2506',
  body: '#39342d',
  muted: '#6b6255',
  white: '#ffffff',
} as const;

function escapeHtml(value: string): string {
  const entities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };

  return value.replace(
    /[&<>"']/g,
    (character) => entities[character] ?? character,
  );
}

function informationBox(label: string, content: string): string {
  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:22px 0;background:${COLORS.brand50};border-left:4px solid ${COLORS.brand500};">
      <tr>
        <td style="padding:16px 18px;font-size:14px;line-height:1.7;color:${COLORS.body};">
          <strong style="display:block;margin-bottom:4px;color:${COLORS.brand950};">${label}</strong>
          ${content}
        </td>
      </tr>
    </table>`;
}

function emailLayout(title: string, intro: string, content: string): string {
  return `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${title}</title>
  </head>
  <body style="margin:0;padding:0;background:${COLORS.background};font-family:Arial,'Apple SD Gothic Neo','Noto Sans KR',sans-serif;color:${COLORS.body};">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background:${COLORS.background};">
      <tr>
        <td align="center" style="padding:24px 12px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:600px;background:${COLORS.white};border-top:6px solid ${COLORS.brand600};">
            <tr>
              <td style="padding:36px 40px 28px;background:${COLORS.brand50};">
                <p style="margin:0 0 12px;color:${COLORS.brand700};font-size:13px;font-weight:700;letter-spacing:0.08em;">생각을 여는 수학</p>
                <h1 style="margin:0 0 12px;color:${COLORS.brand950};font-size:28px;line-height:1.35;letter-spacing:-0.03em;">${title}</h1>
                <p style="margin:0;color:${COLORS.muted};font-size:15px;line-height:1.75;">${intro}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:32px 40px 36px;color:${COLORS.body};font-size:15px;line-height:1.8;">
                ${content}
              </td>
            </tr>
            <tr>
              <td style="padding:22px 40px;background:${COLORS.brand950};color:${COLORS.brand50};font-size:12px;line-height:1.7;">
                <strong style="font-size:13px;">생각을 여는 수학</strong><br>
                놀이에서 사고력, 교과까지 이어지는 배움<br>
                <span style="color:#d8cbb5;">본 메일은 발신 전용입니다.</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function reservationReceivedEmail(data: ReservationEmailData): string {
  const parentName = escapeHtml(data.parentName);
  const childName = escapeHtml(data.childName);

  return emailLayout(
    '수업 신청이 잘 접수되었어요',
    '아이의 즐거운 배움이 시작될 수 있도록 꼼꼼히 살펴보겠습니다.',
    `<p style="margin:0;"><strong style="color:${COLORS.brand950};">${parentName} 보호자님,</strong><br>${childName} 어린이의 수업 신청을 확인했습니다.</p>
    ${informationBox('다음 안내', '비슷한 신청이 모이면 그룹 편성 결과를 이메일로 알려드려요.')}`,
  );
}

export function groupConfirmedEmail(data: GroupConfirmedEmailData): string {
  const parentName = escapeHtml(data.parentName);
  const childName = escapeHtml(data.childName);
  const groupLabel = escapeHtml(data.groupLabel);
  const scheduleText = escapeHtml(data.scheduleText);

  return emailLayout(
    '함께 배울 그룹이 정해졌어요',
    '기다려 주셔서 감사합니다. 편성된 수업 정보를 확인해 주세요.',
    `<p style="margin:0;"><strong style="color:${COLORS.brand950};">${parentName} 보호자님,</strong><br>${childName} 어린이가 새로운 수업 그룹에 편성되었습니다.</p>
    ${informationBox('편성된 수업', `<strong>${groupLabel}</strong><br>${scheduleText}`)}`,
  );
}

export function groupMemberRemovedEmail(data: GroupRemovedEmailData): string {
  const parentName = escapeHtml(data.parentName);
  const childName = escapeHtml(data.childName);
  const groupLabel = escapeHtml(data.groupLabel);

  return emailLayout(
    '수업 그룹 편성이 변경되었어요',
    '변경된 상태를 안내드립니다. 새로운 편성 결과가 정해지면 다시 알려드리겠습니다.',
    `<p style="margin:0;"><strong style="color:${COLORS.brand950};">${parentName} 보호자님,</strong><br>${childName} 어린이의 수업 그룹 편성에 변경이 생겼습니다.</p>
    ${informationBox('변경 내용', `<strong>${groupLabel}</strong> 그룹에서 제외되어 다시 대기 상태로 변경되었습니다.`)}`,
  );
}

export function parentEmailVerificationEmail(
  data: VerificationEmailData,
): string {
  const name = escapeHtml(data.name);
  const verifyUrl = escapeHtml(data.verifyUrl);

  return emailLayout(
    '이메일 인증을 완료해 주세요',
    '아래 버튼을 눌러 이메일 인증을 마치면 회원가입이 완료됩니다.',
    `<p style="margin:0;"><strong style="color:${COLORS.brand950};">${name}님,</strong><br>생각을 여는 수학에 가입해 주셔서 감사합니다.</p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:26px 0;">
      <tr>
        <td align="center">
          <a href="${verifyUrl}" style="display:inline-block;padding:14px 28px;background:${COLORS.brand700};color:${COLORS.white};font-size:15px;font-weight:700;text-decoration:none;border-radius:8px;">이메일 인증하기</a>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 8px;color:${COLORS.muted};font-size:12px;line-height:1.7;">버튼이 열리지 않으면 아래 주소를 브라우저에 복사해 주세요.</p>
    <p style="margin:0;word-break:break-all;font-size:12px;line-height:1.7;"><a href="${verifyUrl}" style="color:${COLORS.brand700};">${verifyUrl}</a></p>
    <p style="margin:24px 0 0;color:${COLORS.muted};font-size:12px;line-height:1.7;">본인이 요청하지 않았다면 이 메일을 무시해 주세요.</p>`,
  );
}
