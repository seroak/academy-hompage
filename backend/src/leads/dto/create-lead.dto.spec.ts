import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateLeadDto } from './create-lead.dto.js';

const validPayload = {
  guardianName: '김보호',
  phone: '010-1234-5678',
  childAge: 7,
  contactWindow: 'H15_18',
  privacyConsent: true,
  privacyConsentVersion: '2026-07-15',
  turnstileToken: 'verified-token',
  landingPath: '/lp/heungdeok-math',
  analyticsConsent: true,
  marketingConsent: true,
};

describe('CreateLeadDto', () => {
  it('유효한 상담 신청을 허용한다', async () => {
    const errors = await validate(plainToInstance(CreateLeadDto, validPayload));
    expect(errors).toHaveLength(0);
  });

  it.each([3, 11])('자녀 나이 %i를 거부한다', async (childAge) => {
    const errors = await validate(
      plainToInstance(CreateLeadDto, { ...validPayload, childAge }),
    );
    expect(errors.some((error) => error.property === 'childAge')).toBe(true);
  });

  it('개인정보 동의가 true가 아니면 거부한다', async () => {
    const errors = await validate(
      plainToInstance(CreateLeadDto, {
        ...validPayload,
        privacyConsent: false,
      }),
    );
    expect(errors.some((error) => error.property === 'privacyConsent')).toBe(
      true,
    );
  });

  it('정의되지 않은 enum과 전화번호를 거부한다', async () => {
    const errors = await validate(
      plainToInstance(CreateLeadDto, {
        ...validPayload,
        phone: 'not-a-phone',
        contactWindow: 'MORNING',
      }),
    );
    expect(errors.map((error) => error.property)).toEqual(
      expect.arrayContaining(['phone', 'contactWindow']),
    );
  });
});
