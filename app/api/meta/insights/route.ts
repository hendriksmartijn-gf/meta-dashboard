import { NextRequest, NextResponse } from 'next/server';
import type { MetaApiResponse, MetaInsight, CampaignData, DailyDataPoint, DashboardData } from '@/types/meta';

export const runtime = 'edge';

function extractThruplayValue(actions?: { action_type: string; value: string }[]): number {
  if (!actions) return 0;
  const action = actions.find((a) => a.action_type === 'video_view');
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
    const thruplays = extractThruplayValue(insight.video_thruplay_watched_actions);
    const thruplayRate = impressions > 0 ? (thruplays / impressions) * 100 : 0;

    const dataPoint: DailyDataPoint = {
      date: insight.date_start,
      impressions,
      clicks: parseInt(insight.clicks, 10) || 0,
      reach: parseInt(insight.reach, 10) || 0,
      thruplays,
      thruplayRate,
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
    const res = await fetch(nextUrl, {
      next: { revalidate: 300 }, // cache 5 minutes
    });

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
  const datePreset = searchParams.get('date_preset') ?? 'last_30d';

  const fields = [
    'campaign_name',
    'campaign_id',
    'impressions',
    'clicks',
    'reach',
    'video_thruplay_watched_actions',
  ].join(',');

  const params = new URLSearchParams({
    fields,
    time_increment: '1',
    level: 'campaign',
    access_token: accessToken,
  });

  if (datePreset === 'last_3d') {
    const until = new Date();
    const since = new Date();
    since.setDate(until.getDate() - 3);
    params.set('time_range', JSON.stringify({
      since: since.toISOString().slice(0, 10),
      until: until.toISOString().slice(0, 10),
    }));
  } else {
    params.set('date_preset', datePreset);
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

    for (const campaign of campaigns) {
      for (const day of campaign.dailyData) {
        totalImpressions += day.impressions;
        totalClicks += day.clicks;
        totalReach += day.reach;
        reachDays++;
        if (day.impressions > 0) {
          totalThruplayRate += day.thruplayRate;
          thruplayDays++;
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
      },
    };

    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
