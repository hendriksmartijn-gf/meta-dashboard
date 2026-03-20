import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export interface GeoDataPoint {
  country: string;
  countryCode: string;
  impressions: number;
  clicks: number;
  reach: number;
  ctr: number; // clicks / impressions * 100
}

interface MetaGeoRow {
  country: string;
  impressions: string;
  clicks: string;
  reach: string;
}

interface MetaGeoResponse {
  data: MetaGeoRow[];
  paging?: { next?: string };
}

async function fetchAllPages(url: string): Promise<MetaGeoRow[]> {
  const results: MetaGeoRow[] = [];
  let nextUrl: string | undefined = url;

  while (nextUrl) {
    const res = await fetch(nextUrl, { next: { revalidate: 900 } });
    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: { message: res.statusText } }));
      throw new Error(error?.error?.message ?? `Meta API error ${res.status}`);
    }
    const json: MetaGeoResponse = await res.json();
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
      { error: 'Missing META_ACCESS_TOKEN or META_AD_ACCOUNT_ID' },
      { status: 500 }
    );
  }

  const { searchParams } = request.nextUrl;
  const datePreset = searchParams.get('date_preset') ?? 'last_30d';

  const params = new URLSearchParams({
    fields: 'country,impressions,clicks,reach',
    breakdowns: 'country',
    level: 'account',
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
    const rows = await fetchAllPages(url);

    const data: GeoDataPoint[] = rows
      .map((row) => {
        const impressions = parseInt(row.impressions, 10) || 0;
        const clicks = parseInt(row.clicks, 10) || 0;
        const reach = parseInt(row.reach, 10) || 0;
        return {
          country: row.country,
          countryCode: row.country,
          impressions,
          clicks,
          reach,
          ctr: impressions > 0 ? parseFloat(((clicks / impressions) * 100).toFixed(2)) : 0,
        };
      })
      .sort((a, b) => b.impressions - a.impressions);

    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
