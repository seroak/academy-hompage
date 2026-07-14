import { ConfigService } from '@nestjs/config';
import { NotificationService } from './notification.service.js';

describe('NotificationService', () => {
  let sendMail: jest.Mock;
  let createTransport: jest.Mock;
  let configValues: Record<string, string | undefined>;

  beforeEach(() => {
    sendMail = jest.fn().mockResolvedValue(undefined);
    createTransport = jest.fn();
    createTransport.mockReturnValue({ sendMail });
    configValues = {};
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  async function createService(): Promise<NotificationService> {
    return new NotificationService(
      {
        get: jest.fn(
          (key: string, defaultValue?: string | number) =>
            configValues[key] ?? defaultValue,
        ),
      } as unknown as ConfigService,
      createTransport,
    );
  }

  describe('SMTP transporter 생성', () => {
    it('연결이 응답 없이 걸리지 않도록 연결/소켓/인사 타임아웃을 설정한다', async () => {
      configValues.SMTP_HOST = 'smtp.example.com';

      await createService();

      expect(createTransport).toHaveBeenCalledWith(
        expect.objectContaining({
          connectionTimeout: expect.any(Number),
          socketTimeout: expect.any(Number),
          greetingTimeout: expect.any(Number),
        }),
      );
    });
  });

  describe('SMTP 미설정', () => {
    beforeEach(() => {
      delete configValues.SMTP_HOST;
    });

    it('메일을 발송하지 않고 예외도 던지지 않는다', async () => {
      const service = await createService();

      await expect(
        service.sendReservationReceived({
          childName: '민준',
          parentName: '김엄마',
          parentEmail: 'parent@example.com',
        }),
      ).resolves.not.toThrow();

      expect(sendMail).not.toHaveBeenCalled();
    });
  });

  describe('SMTP 설정됨', () => {
    beforeEach(() => {
      configValues.SMTP_HOST = 'smtp.example.com';
      configValues.SMTP_PORT = '587';
      configValues.SMTP_USER = 'user';
      configValues.SMTP_PASS = 'pass';
      configValues.SMTP_FROM = '학원 <no-reply@academy.local>';
    });

    it('접수 이메일을 발송한다', async () => {
      const service = await createService();

      await service.sendReservationReceived({
        childName: '민준',
        parentName: '김엄마',
        parentEmail: 'parent@example.com',
      });

      expect(sendMail).toHaveBeenCalledTimes(1);
      expect(sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'parent@example.com',
          text: expect.stringContaining('민준'),
          html: expect.stringContaining('수업 신청이 잘 접수되었어요'),
        }),
      );
    });

    it('그룹 확정 이메일을 발송한다', async () => {
      const service = await createService();

      await service.sendGroupConfirmed(
        {
          childName: '민준',
          parentName: '김엄마',
          parentEmail: 'parent@example.com',
        },
        { label: '월수금 12시반' },
        [{ dayOfWeek: 'MON', startMinute: 720, endMinute: 790 }],
      );

      expect(sendMail).toHaveBeenCalledTimes(1);
      expect(sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'parent@example.com',
          text: expect.stringContaining('월 12:00~13:10'),
          html: expect.stringMatching(/월수금 12시반[\s\S]*월 12:00~13:10/),
        }),
      );
    });

    it('그룹 제외 이메일을 발송한다', async () => {
      const service = await createService();

      await service.sendGroupMemberRemoved(
        {
          childName: '민준',
          parentName: '김엄마',
          parentEmail: 'parent@example.com',
        },
        { label: '월수금 12시반' },
      );

      expect(sendMail).toHaveBeenCalledTimes(1);
      expect(sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'parent@example.com',
          text: expect.stringContaining('다시 대기 상태로 변경되었습니다'),
          html: expect.stringMatching(
            /그룹 편성이 변경되었어요[\s\S]*대기 상태/,
          ),
        }),
      );
    });

    it('수신 이메일이 빈 문자열이면 발송을 시도하지 않는다', async () => {
      const service = await createService();

      await expect(
        service.sendGroupConfirmed(
          { childName: '민준', parentName: '김엄마', parentEmail: '' },
          { label: '월수금 12시반' },
          [{ dayOfWeek: 'MON', startMinute: 720, endMinute: 790 }],
        ),
      ).resolves.not.toThrow();

      expect(sendMail).not.toHaveBeenCalled();
    });

    it('발송 실패 시 예외를 삼키고 요청 흐름을 막지 않는다', async () => {
      sendMail.mockRejectedValue(new Error('SMTP down'));
      const service = await createService();

      await expect(
        service.sendReservationReceived({
          childName: '민준',
          parentName: '김엄마',
          parentEmail: 'parent@example.com',
        }),
      ).resolves.not.toThrow();
    });

    it('이메일 인증 메일을 발송하고 본문에 인증 링크를 포함한다', async () => {
      const service = await createService();

      await service.sendParentEmailVerification(
        'parent@example.com',
        '김엄마',
        'http://localhost:3001/auth/verify-email?token=abc123',
      );

      expect(sendMail).toHaveBeenCalledTimes(1);
      expect(sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'parent@example.com',
          text: expect.stringContaining(
            'http://localhost:3001/auth/verify-email?token=abc123',
          ),
          html: expect.stringMatching(/이메일 인증하기[\s\S]*token=abc123/),
        }),
      );
    });

    it('ADMIN_NOTIFICATION_EMAIL이 설정되어 있으면 관리자에게 신규 신청 알림 메일을 보낸다', async () => {
      configValues.ADMIN_NOTIFICATION_EMAIL = 'admin@academy.com';
      const service = await createService();

      await service.sendAdminReservationReceived({
        childName: '민준',
        childAge: 5,
        parentName: '김엄마',
        parentEmail: 'parent@example.com',
        parentPhone: '010-1234-5678',
        preferredSlots: [{ dayOfWeek: 'MON', startMinute: 720, endMinute: 790 }],
      });

      expect(sendMail).toHaveBeenCalledTimes(1);
      expect(sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'admin@academy.com',
          text: expect.stringContaining('민준'),
          html: expect.stringMatching(/새 수업 신청이 접수되었어요[\s\S]*민준/),
        }),
      );
    });

    it('ADMIN_NOTIFICATION_EMAIL이 콤마로 구분된 여러 주소면 모두에게 보낸다', async () => {
      configValues.ADMIN_NOTIFICATION_EMAIL = 'admin1@academy.com,admin2@academy.com';
      const service = await createService();

      await service.sendAdminReservationReceived({
        childName: '민준',
        childAge: 5,
        parentName: '김엄마',
        parentEmail: 'parent@example.com',
        preferredSlots: [],
      });

      expect(sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'admin1@academy.com,admin2@academy.com',
        }),
      );
    });
  });

  describe('SMTP 미설정 - 인증 메일', () => {
    beforeEach(() => {
      delete configValues.SMTP_HOST;
    });

    it('인증 메일도 발송하지 않고 예외를 던지지 않는다', async () => {
      const service = await createService();

      await expect(
        service.sendParentEmailVerification(
          'parent@example.com',
          '김엄마',
          'http://localhost:3001/auth/verify-email?token=abc123',
        ),
      ).resolves.not.toThrow();

      expect(sendMail).not.toHaveBeenCalled();
    });
  });

  describe('ADMIN_NOTIFICATION_EMAIL 미설정', () => {
    beforeEach(() => {
      configValues.SMTP_HOST = 'smtp.example.com';
      delete configValues.ADMIN_NOTIFICATION_EMAIL;
    });

    it('관리자 알림 메일을 시도하지 않고 예외를 던지지 않는다', async () => {
      const service = await createService();

      await expect(
        service.sendAdminReservationReceived({
          childName: '민준',
          childAge: 5,
          parentName: '김엄마',
          parentEmail: 'parent@example.com',
          preferredSlots: [],
        }),
      ).resolves.not.toThrow();

      expect(sendMail).not.toHaveBeenCalled();
    });
  });
});
