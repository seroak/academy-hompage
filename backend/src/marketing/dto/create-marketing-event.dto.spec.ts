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
});
