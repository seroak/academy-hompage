import { Test, TestingModule } from '@nestjs/testing';
import * as nodemailer from 'nodemailer';
import { NotificationService } from './notification.service';

jest.mock('nodemailer');

describe('NotificationService', () => {
  const originalEnv = process.env;
  let sendMail: jest.Mock;
  let createTransport: jest.Mock;

  beforeEach(() => {
    sendMail = jest.fn().mockResolvedValue(undefined);
    createTransport = nodemailer.createTransport as jest.Mock;
    createTransport.mockReturnValue({ sendMail });
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.clearAllMocks();
  });

  async function createService(): Promise<NotificationService> {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NotificationService],
    }).compile();

    return module.get<NotificationService>(NotificationService);
  }

  describe('SMTP 미설정', () => {
    beforeEach(() => {
      delete process.env.SMTP_HOST;
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
      process.env.SMTP_HOST = 'smtp.example.com';
      process.env.SMTP_PORT = '587';
      process.env.SMTP_USER = 'user';
      process.env.SMTP_PASS = 'pass';
      process.env.SMTP_FROM = '학원 <no-reply@academy.local>';
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
        { label: '월수금 12시반', dayOfWeek: 'MON', hour: 12 },
      );

      expect(sendMail).toHaveBeenCalledTimes(1);
      expect(sendMail).toHaveBeenCalledWith(
        expect.objectContaining({ to: 'parent@example.com' }),
      );
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
  });
});
