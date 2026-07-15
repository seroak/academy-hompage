import { ConfigService } from '@nestjs/config';
import { MetaInsightsClient } from './meta-insights.client.js';
import { Test } from '@nestjs/testing';

describe('MetaInsightsClient', () => {
  it('Nest 모듈에서 테스트 전용 의존성 없이 생성된다', async () => {
    const module = await Test.createTestingModule({
      providers: [
        MetaInsightsClient,
        { provide: ConfigService, useValue: { get: jest.fn() } },
      ],
    }).compile();
    expect(module.get(MetaInsightsClient)).toBeInstanceOf(MetaInsightsClient);
  });
  it('광고 단위 일별 인사이트의 모든 페이지를 읽고 숫자로 변환한다', async () => {
    const fetcher = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            data: [
              {
                date_start: '2026-07-15',
                account_id: '1',
                campaign_id: '10',
                campaign_name: '흥덕',
                adset_id: '20',
                adset_name: '학부모',
                ad_id: '30',
                ad_name: '수업 영상',
                spend: '12000',
                impressions: '3400',
                inline_link_clicks: '41',
              },
            ],
            paging: { next: 'https://graph.facebook.com/next' },
          }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            data: [
              {
                date_start: '2026-07-16',
                account_id: '1',
                campaign_id: '10',
                campaign_name: '흥덕',
                adset_id: '20',
                adset_name: '학부모',
                ad_id: '30',
                ad_name: '수업 영상',
                spend: '8000',
                impressions: '2100',
              },
            ],
          }),
      });
    const config = {
      get: jest.fn(
        (key: string) =>
          ({
            META_ACCESS_TOKEN: 'secret',
            META_AD_ACCOUNT_ID: '1',
            META_API_VERSION: 'v23.0',
          })[key],
      ),
    } as unknown as ConfigService;
    const client = new MetaInsightsClient(config, {
      fetcher: fetcher as typeof fetch,
    });

    await expect(
      client.fetchDaily('2026-07-15', '2026-07-16'),
    ).resolves.toEqual([
      expect.objectContaining({
        date: '2026-07-15',
        adId: '30',
        spendWon: 12000,
        impressions: 3400,
        linkClicks: 41,
      }),
      expect.objectContaining({
        date: '2026-07-16',
        adId: '30',
        spendWon: 8000,
        impressions: 2100,
        linkClicks: 0,
      }),
    ]);
    expect(fetcher).toHaveBeenCalledTimes(2);
    const firstCall = (fetcher.mock.calls as unknown[][])[0];
    expect(String(firstCall?.[0])).not.toContain('secret');
  });

  it('일시 오류는 최대 3회 재시도한다', async () => {
    const fetcher = jest.fn().mockResolvedValue({
      ok: false,
      status: 429,
      json: () => Promise.resolve({ error: { message: 'temporary' } }),
    });
    const config = {
      get: jest.fn(
        (key: string) =>
          ({
            META_ACCESS_TOKEN: 'secret',
            META_AD_ACCOUNT_ID: '1',
            META_API_VERSION: 'v23.0',
          })[key],
      ),
    } as unknown as ConfigService;
    const client = new MetaInsightsClient(config, {
      fetcher: fetcher as typeof fetch,
      sleep: () => Promise.resolve(),
    });
    await expect(client.fetchDaily('2026-07-15', '2026-07-15')).rejects.toThrow(
      'Meta Insights 동기화 실패',
    );
    expect(fetcher).toHaveBeenCalledTimes(3);
  });
});
