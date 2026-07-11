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
        expect.objectContaining({ to: 'parent@example.com' }),
      );
    });

    it('그룹 확정 이메일을 발송한다', async () => {
      const service = await createService();

      await service.sendGroupConfirmed(
        { childName: '민준', parentName: '김엄마', parentEmail: 'parent@example.com' },
        { label: '월수금 12시반' },
        [{ dayOfWeek: 'MON', startMinute: 720, endMinute: 790 }],
      );

      expect(sendMail).toHaveBeenCalledTimes(1);
      expect(sendMail).toHaveBeenCalledWith(
        expect.objectContaining({ to: 'parent@example.com' }),
      );
    });

    it('그룹 제외 이메일을 발송한다', async () => {
      const service = await createService();

      await service.sendGroupMemberRemoved(
        { childName: '민준', parentName: '김엄마', parentEmail: 'parent@example.com' },
        { label: '월수금 12시반' },
      );

      expect(sendMail).toHaveBeenCalledTimes(1);
      expect(sendMail).toHaveBeenCalledWith(
        expect.objectContaining({ to: 'parent@example.com' }),
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
});
