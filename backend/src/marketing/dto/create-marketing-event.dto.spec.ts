import { ValidationPipe } from '@nestjs/common';
import { CreateMarketingEventDto } from './create-marketing-event.dto.js';

describe('CreateMarketingEventDto', () => {
  const pipe = new ValidationPipe({ transform: true, whitelist: true });
  const metadata = { type: 'body' as const, metatype: CreateMarketingEventDto };

  it('허용되지 않은 이벤트 이름과 잘못된 ID를 거부한다', async () => {
    await expect(
      pipe.transform(
        {
          eventId: 'not-a-uuid',
          sessionId: 'not-a-uuid',
          name: 'guardian_phone',
          occurredAt: 'not-a-date',
        },
        metadata,
      ),
    ).rejects.toMatchObject({ status: 400 });
  });

  it('UTM과 경로 길이 제한을 적용한다', async () => {
    await expect(
      pipe.transform(
        {
          eventId: '5eddf7c8-ea1a-4973-aa67-ff9fa45fe913',
          sessionId: '76a93f01-6007-475a-a939-a481abbdbecc',
          name: 'view_ad_landing',
          utmSource: 'm'.repeat(101),
          landingPath: '/' + 'a'.repeat(1000),
          occurredAt: '2026-07-15T01:00:00.000Z',
        },
        metadata,
      ),
    ).rejects.toMatchObject({ status: 400 });
  });

  it('utmSource가 meta인데 utmCampaign이 이름 기반 값이면 거부한다', async () => {
    await expect(
      pipe.transform(
        {
          eventId: '5eddf7c8-ea1a-4973-aa67-ff9fa45fe913',
          sessionId: '76a93f01-6007-475a-a939-a481abbdbecc',
          name: 'view_ad_landing',
          utmSource: 'meta',
          utmCampaign: 'verification',
          occurredAt: '2026-07-15T01:00:00.000Z',
        },
        metadata,
      ),
    ).rejects.toMatchObject({ status: 400 });
  });

  it('utmSource가 meta인데 utmContent가 이름 기반 값이면 거부한다', async () => {
    await expect(
      pipe.transform(
        {
          eventId: '5eddf7c8-ea1a-4973-aa67-ff9fa45fe913',
          sessionId: '76a93f01-6007-475a-a939-a481abbdbecc',
          name: 'view_ad_landing',
          utmSource: 'meta',
          utmContent: 'test456',
          occurredAt: '2026-07-15T01:00:00.000Z',
        },
        metadata,
      ),
    ).rejects.toMatchObject({ status: 400 });
  });

  it('utmSource가 meta이고 utmCampaign·utmContent가 숫자 ID면 통과한다', async () => {
    await expect(
      pipe.transform(
        {
          eventId: '5eddf7c8-ea1a-4973-aa67-ff9fa45fe913',
          sessionId: '76a93f01-6007-475a-a939-a481abbdbecc',
          name: 'view_ad_landing',
          utmSource: 'meta',
          utmCampaign: '120250749493910343',
          utmContent: '120250749493920343',
          occurredAt: '2026-07-15T01:00:00.000Z',
        },
        metadata,
      ),
    ).resolves.toBeDefined();
  });

  it('utmSource가 meta가 아니면 utmCampaign이 이름 기반 값이어도 통과한다', async () => {
    await expect(
      pipe.transform(
        {
          eventId: '5eddf7c8-ea1a-4973-aa67-ff9fa45fe913',
          sessionId: '76a93f01-6007-475a-a939-a481abbdbecc',
          name: 'view_ad_landing',
          utmSource: 'google',
          utmCampaign: 'brand-search',
          occurredAt: '2026-07-15T01:00:00.000Z',
        },
        metadata,
      ),
    ).resolves.toBeDefined();
  });

  it.each([
    'lead_submit_attempt',
    'lead_submit_blocked',
    'lead_submit_error',
  ])('상담 제출 진단 이벤트 %s를 허용한다', async (name) => {
    await expect(
      pipe.transform(
        {
          eventId: '5eddf7c8-ea1a-4973-aa67-ff9fa45fe913',
          sessionId: '76a93f01-6007-475a-a939-a481abbdbecc',
          name,
          occurredAt: '2026-07-15T01:00:00.000Z',
        },
        metadata,
      ),
    ).resolves.toBeDefined();
  });
});
