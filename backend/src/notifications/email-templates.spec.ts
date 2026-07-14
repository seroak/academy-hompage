import {
  groupConfirmedEmail,
  groupMemberRemovedEmail,
  parentEmailVerificationEmail,
  reservationReceivedAdminEmail,
  reservationReceivedEmail,
} from './email-templates.js';

describe('email templates', () => {
  it('신청 접수 메일에 브랜드와 개인화 정보를 포함한다', () => {
    const html = reservationReceivedEmail({
      parentName: '김엄마',
      childName: '민준',
    });

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
      parentName: '김엄마',
      childName: '민준',
      groupLabel: '월수금반',
    });

    expect(html).toContain('수업 그룹 편성이 변경되었어요');
    expect(html).toContain('월수금반');
    expect(html).toContain('대기 상태');
  });

  it('인증 메일에 안전한 CTA와 원문 URL을 포함한다', () => {
    const html = parentEmailVerificationEmail({
      name: '김엄마',
      verifyUrl:
        'https://academy.example/auth/verify-email?token=a&next=<home>',
    });

    expect(html).toContain('이메일 인증을 완료해 주세요');
    expect(html).toContain('이메일 인증하기');
    expect(html).toContain(
      'https://academy.example/auth/verify-email?token=a&amp;next=&lt;home&gt;',
    );
    expect(html).not.toContain('next=<home>');
  });

  it('관리자용 신청 접수 메일에 아이·보호자·희망 시간 정보를 포함한다', () => {
    const html = reservationReceivedAdminEmail({
      parentName: '김엄마',
      childName: '민준',
      childAge: 5,
      parentPhone: '010-1234-5678',
      scheduleText: '월 12:00~13:10, 수 15:00~16:10',
    });

    expect(html).toContain('새 수업 신청이 접수되었어요');
    expect(html).toContain('민준');
    expect(html).toContain('김엄마');
    expect(html).toContain('010-1234-5678');
    expect(html).toContain('월 12:00~13:10, 수 15:00~16:10');
  });
});
