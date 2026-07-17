import { Inject, Injectable, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type MetaDailyInsight = {
  date: string;
  accountId: string;
  campaignId: string;
  campaignName: string;
  adSetId: string;
  adSetName: string;
  adId: string;
  adName: string;
  spendWon: number;
  impressions: number;
  linkClicks: number;
};
type MetaRow = {
  date_start: string;
  account_id: string;
  campaign_id: string;
  campaign_name: string;
  adset_id: string;
  adset_name: string;
  ad_id: string;
  ad_name: string;
  spend?: string;
  impressions?: string;
  inline_link_clicks?: string;
};
export type MetaAdCreativeInfo = {
  adId: string;
  imageUrl: string | null;
  thumbnailUrl: string | null;
};
type MetaAdRow = {
  id: string;
  creative?: { image_url?: string; thumbnail_url?: string };
};
type MetaClientOptions = {
  fetcher?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
};
export const META_CLIENT_OPTIONS = Symbol('META_CLIENT_OPTIONS');

export type MetaApiErrorReason =
  | 'not_configured'
  | 'unauthorized'
  | 'invalid_account'
  | 'network'
  | 'unknown';

export class MetaApiError extends Error {
  constructor(
    public readonly reason: MetaApiErrorReason,
    message: string,
  ) {
    super(message);
    this.name = 'MetaApiError';
  }
}

@Injectable()
export class MetaInsightsClient {
  constructor(
    private readonly config: ConfigService,
    @Optional()
    @Inject(META_CLIENT_OPTIONS)
    private readonly options: MetaClientOptions = {},
  ) {}

  isConfigured() {
    return Boolean(
      this.config.get('META_ACCESS_TOKEN') &&
      this.config.get('META_AD_ACCOUNT_ID'),
    );
  }

  async fetchDaily(from: string, to: string): Promise<MetaDailyInsight[]> {
    const token = this.config.get<string>('META_ACCESS_TOKEN');
    const account = this.config.get<string>('META_AD_ACCOUNT_ID');
    const version = this.config.get<string>('META_API_VERSION', 'v23.0');
    if (!token || !account)
      throw new MetaApiError('not_configured', 'Meta API가 설정되지 않았습니다.');
    const params = new URLSearchParams({
      fields:
        'date_start,account_id,campaign_id,campaign_name,adset_id,adset_name,ad_id,ad_name,spend,impressions,inline_link_clicks',
      level: 'ad',
      time_increment: '1',
      time_range: JSON.stringify({ since: from, until: to }),
      limit: '500',
    });
    let url: string | undefined =
      `https://graph.facebook.com/${version}/act_${account.replace(/^act_/, '')}/insights?${params}`;
    const rows: MetaRow[] = [];
    while (url) {
      const response = await this.request<MetaRow>(url, token);
      rows.push(...response.data);
      url = response.paging?.next;
    }
    return rows.map((row) => ({
      date: row.date_start,
      accountId: row.account_id,
      campaignId: row.campaign_id,
      campaignName: row.campaign_name,
      adSetId: row.adset_id,
      adSetName: row.adset_name,
      adId: row.ad_id,
      adName: row.ad_name,
      spendWon: Math.round(Number(row.spend ?? 0)),
      impressions: Number(row.impressions ?? 0),
      linkClicks: Number(row.inline_link_clicks ?? 0),
    }));
  }

  async fetchCreatives(adIds: string[] = []): Promise<MetaAdCreativeInfo[]> {
    const token = this.config.get<string>('META_ACCESS_TOKEN');
    const account = this.config.get<string>('META_AD_ACCOUNT_ID');
    const version = this.config.get<string>('META_API_VERSION', 'v23.0');
    if (!token || !account)
      throw new MetaApiError('not_configured', 'Meta API가 설정되지 않았습니다.');
    const params = new URLSearchParams({
      fields: 'id,creative{image_url,thumbnail_url}',
      limit: '500',
    });
    if (adIds.length > 0)
      params.set(
        'filtering',
        JSON.stringify([{ field: 'id', operator: 'IN', value: adIds }]),
      );
    let url: string | undefined =
      `https://graph.facebook.com/${version}/act_${account.replace(/^act_/, '')}/ads?${params}`;
    const rows: MetaAdRow[] = [];
    while (url) {
      const response = await this.request<MetaAdRow>(url, token);
      rows.push(...response.data);
      url = response.paging?.next;
    }
    return rows.map((row) => ({
      adId: row.id,
      imageUrl: row.creative?.image_url ?? null,
      thumbnailUrl: row.creative?.thumbnail_url ?? null,
    }));
  }

  private async request<T>(
    url: string,
    token: string,
  ): Promise<{ data: T[]; paging?: { next?: string } }> {
    let lastStatus: number | undefined;
    let networkFailure = false;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      let response: Response;
      try {
        response = await (this.options.fetcher ?? fetch)(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch {
        networkFailure = true;
        if (attempt < 2) {
          await this.backoff(attempt);
          continue;
        }
        break;
      }
      networkFailure = false;
      if (response.ok)
        return response.json() as Promise<{
          data: T[];
          paging?: { next?: string };
        }>;
      lastStatus = response.status;
      if (attempt < 2 && (response.status === 429 || response.status >= 500)) {
        await this.backoff(attempt);
        continue;
      }
      break;
    }
    throw this.toMetaApiError(lastStatus, networkFailure);
  }

  private backoff(attempt: number) {
    return (
      this.options.sleep ??
      ((ms: number) => new Promise((resolve) => setTimeout(resolve, ms)))
    )(250 * 2 ** attempt);
  }

  private toMetaApiError(
    status: number | undefined,
    networkFailure: boolean,
  ): MetaApiError {
    if (networkFailure)
      return new MetaApiError(
        'network',
        'Meta API 네트워크 연결에 실패했습니다.',
      );
    if (status === 401 || status === 403)
      return new MetaApiError(
        'unauthorized',
        'Meta API 권한이 없습니다. 시스템 사용자 토큰의 ads_read 권한을 확인하세요.',
      );
    if (status === 400)
      return new MetaApiError(
        'invalid_account',
        'Meta 광고 계정 ID를 확인하세요.',
      );
    return new MetaApiError('unknown', 'Meta Insights 동기화 실패');
  }
}
