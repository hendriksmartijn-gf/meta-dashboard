import { NextRequest, NextResponse } from 'next/server';
import type { MetaApiResponse, MetaInsight, CampaignData, DailyDataPoint, DashboardData } from '@/types/meta';

function extractActionValue(
  actions?: { action_type: string; value: string }[],
  type = 'video_view'
): number {
  if (!actions) return 0;
  const action = actions.find((a) => a.action_type === type);
  return action ? parseFloat(action.value) : 0;
}

function groupByCampaign(insights: MetaInsight[]): CampaignData[] {
  const map = new Map<string, CampaignData>();

  for (const insight of insights) {
    const id = insight.campaign_id;

    if (!map.has(id)) {
      map.set(id, {
        campaignId: id,
        campaignName: insight.campaign_name,
        dailyData: [],
      });
    }

    const impressions = parseInt(insight.impressions, 10) || 0;
    const thruplays = extractActionValue(insight.video_thruplay_watched_actions, 'video_view');
    const thruplayRate = impressions > 0 ? (thruplays / impressions) * 100 : 0;
    const roas = extractActionValue(insight.purchase_roas, 'omni_purchase');

    const dataPoint: DailyDataPoint = {
      date: insight.date_start,
      impressions,
      clicks: parseInt(insight.clicks, 10) || 0,
      reach: parseInt(insight.reach, 10) || 0,
      thruplays,
      thruplayRate,
      spend: parseFloat(insight.spend) || 0,
      cpm: parseFloat(insight.cpm) || 0,
      cpc: parseFloat(insight.cpc) || 0,
      roas,
    };

    map.get(id)!.dailyData.push(dataPoint);
  }

  // Sort each campaign's daily data by date
  for (const campaign of map.values()) {
    campaign.dailyData.sort((a, b) => a.date.localeCompare(b.date));
  }

  return Array.from(map.values());
}

async function fetchAllPages(url: string): Promise<MetaInsight[]> {
  const results: MetaInsight[] = [];
  let nextUrl: string | undefined = url;

  while (nextUrl) {
    const res = await fetch(nextUrl, { cache: 'no-store' });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: { message: res.statusText } }));
      throw new Error(error?.error?.message ?? `Meta API error ${res.status}`);
    }

    const json: MetaApiResponse = await res.json();
    results.push(...json.data);
    nextUrl = json.paging?.next;
  }

  return results;
}

export async function GET(request: NextRequest) {
  const accessToken = process.env.META_ACCESS_TOKEN;
  const adAccountId = process.env.META_AD_ACCOUNT_ID;

  if (!accessToken || !adAccountId) {
    return NextResponse.json(
      { error: 'Missing META_ACCESS_TOKEN or META_AD_ACCOUNT_ID environment variables' },
      { status: 500 }
    );
  }

  const { searchParams } = request.nextUrl;
  const datePreset = searchParams.get('date_preset');
  const sinceParam = searchParams.get('since');
  const untilParam = searchParams.get('until');

  const fields = [
    'campaign_name',
    'campaign_id',
    'impressions',
    'clicks',
    'reach',
    'spend',
    'cpm',
    'cpc',
    'purchase_roas',
    'video_thruplay_watched_actions',
  ].join(',');

  const params = new URLSearchParams({
    fields,
    time_increment: '1',
    level: 'campaign',
    access_token: accessToken,
  });

  if (sinceParam && untilParam) {
    params.set('time_range', JSON.stringify({ since: sinceParam, until: untilParam }));
  } else if (datePreset === 'last_3d') {
    const u = new Date();
    const s = new Date();
    s.setDate(u.getDate() - 3);
    params.set('time_range', JSON.stringify({
      since: s.toISOString().slice(0, 10),
      until: u.toISOString().slice(0, 10),
    }));
  } else {
    params.set('date_preset', datePreset ?? 'last_30d');
  }

  const url = `https://graph.facebook.com/v19.0/act_${adAccountId}/insights?${params.toString()}`;

  try {
    const insights = await fetchAllPages(url);
    const campaigns = groupByCampaign(insights);

    // Compute global totals
    let totalImpressions = 0;
    let totalClicks = 0;
    let totalReach = 0;
    let reachDays = 0;
    let totalThruplayRate = 0;
    let thruplayDays = 0;
    let totalSpend = 0;
    let totalCpm = 0;
    let cpmDays = 0;
    let totalCpc = 0;
    let cpcDays = 0;
    let totalRoas = 0;
    let roasDays = 0;

    for (const campaign of campaigns) {
      for (const day of campaign.dailyData) {
        totalImpressions += day.impressions;
        totalClicks += day.clicks;
        totalReach += day.reach;
        totalSpend += day.spend;
        reachDays++;
        if (day.impressions > 0) {
          totalThruplayRate += day.thruplayRate;
          thruplayDays++;
          totalCpm += day.cpm;
          cpmDays++;
        }
        if (day.clicks > 0) {
          totalCpc += day.cpc;
          cpcDays++;
        }
        if (day.roas > 0) {
          totalRoas += day.roas;
          roasDays++;
        }
      }
    }

    const data: DashboardData = {
      campaigns,
      totals: {
        totalImpressions,
        totalClicks,
        avgReachPerDay: reachDays > 0 ? Math.round(totalReach / reachDays) : 0,
        avgThruplayRate: thruplayDays > 0 ? totalThruplayRate / thruplayDays : 0,
        totalSpend,
        avgCpm: cpmDays > 0 ? totalCpm / cpmDays : 0,
        avgCpc: cpcDays > 0 ? totalCpc / cpcDays : 0,
        avgRoas: roasDays > 0 ? totalRoas / roasDays : 0,
      },
    };

    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
