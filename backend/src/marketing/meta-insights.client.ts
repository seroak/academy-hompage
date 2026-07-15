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
type MetaClientOptions = {
  fetcher?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
};
export const META_CLIENT_OPTIONS = Symbol('META_CLIENT_OPTIONS');

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
    if (!token || !account) throw new Error('Meta API가 설정되지 않았습니다.');
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
      const response = await this.request(url, token);
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

  private async request(
    url: string,
    token: string,
  ): Promise<{ data: MetaRow[]; paging?: { next?: string } }> {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const response = await (this.options.fetcher ?? fetch)(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok)
        return response.json() as Promise<{
          data: MetaRow[];
          paging?: { next?: string };
        }>;
      if (attempt < 2 && (response.status === 429 || response.status >= 500)) {
        await (
          this.options.sleep ??
          ((ms) => new Promise((resolve) => setTimeout(resolve, ms)))
        )(250 * 2 ** attempt);
        continue;
      }
      break;
    }
    throw new Error('Meta Insights 동기화 실패');
  }
}
