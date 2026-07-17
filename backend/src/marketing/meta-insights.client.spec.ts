import { ConfigService } from '@nestjs/config';
import { MetaApiError, MetaInsightsClient } from './meta-insights.client.js';
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

  it('광고별 크리에이티브 이미지 URL의 모든 페이지를 읽는다', async () => {
    const fetcher = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            data: [
              {
                id: '30',
                creative: {
                  image_url: 'https://example.com/30.jpg',
                  thumbnail_url: 'https://example.com/30-thumb.jpg',
                },
              },
            ],
            paging: { next: 'https://graph.facebook.com/next' },
          }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            data: [{ id: '31', creative: {} }],
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

    await expect(client.fetchCreatives()).resolves.toEqual([
      {
        adId: '30',
        imageUrl: 'https://example.com/30.jpg',
        thumbnailUrl: 'https://example.com/30-thumb.jpg',
      },
      { adId: '31', imageUrl: null, thumbnailUrl: null },
    ]);
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('adId 목록을 넘기면 filtering 파라미터로 조회를 제한한다', async () => {
    const fetcher = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          data: [{ id: '30', creative: { image_url: 'https://example.com/30.jpg' } }],
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

    await client.fetchCreatives(['30', '31']);

    const calledUrl = decodeURIComponent(
      String((fetcher.mock.calls as unknown[][])[0]?.[0]),
    );
    expect(calledUrl).toContain('filtering');
    expect(calledUrl).toContain('"field":"id"');
    expect(calledUrl).toContain('"value":["30","31"]');
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

  it('권한 오류(401)는 재시도 없이 실패하고 unauthorized 사유를 담는다', async () => {
    const fetcher = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ error: { message: 'denied' } }),
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

    const error = await client
      .fetchDaily('2026-07-15', '2026-07-15')
      .catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(MetaApiError);
    expect((error as MetaApiError).reason).toBe('unauthorized');
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('잘못된 계정(400)은 invalid_account 사유를 담는다', async () => {
    const fetcher = jest.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ error: { message: 'bad account' } }),
    });
    const config = {
      get: jest.fn(
        (key: string) =>
          ({
            META_ACCESS_TOKEN: 'secret',
            META_AD_ACCOUNT_ID: 'wrong',
            META_API_VERSION: 'v23.0',
          })[key],
      ),
    } as unknown as ConfigService;
    const client = new MetaInsightsClient(config, {
      fetcher: fetcher as typeof fetch,
      sleep: () => Promise.resolve(),
    });

    const error = await client
      .fetchDaily('2026-07-15', '2026-07-15')
      .catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(MetaApiError);
    expect((error as MetaApiError).reason).toBe('invalid_account');
  });

  it('네트워크 예외는 최대 3회 재시도 후 network 사유로 실패한다', async () => {
    const fetcher = jest.fn().mockRejectedValue(new TypeError('fetch failed'));
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

    const error = await client
      .fetchDaily('2026-07-15', '2026-07-15')
      .catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(MetaApiError);
    expect((error as MetaApiError).reason).toBe('network');
    expect(fetcher).toHaveBeenCalledTimes(3);
  });

  it('토큰이나 계정이 없으면 not_configured 사유를 담는다', async () => {
    const config = {
      get: jest.fn(() => undefined),
    } as unknown as ConfigService;
    const client = new MetaInsightsClient(config);

    const error = await client
      .fetchDaily('2026-07-15', '2026-07-15')
      .catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(MetaApiError);
    expect((error as MetaApiError).reason).toBe('not_configured');
  });
});
