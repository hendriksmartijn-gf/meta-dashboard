export interface MetaVideoAction {
  action_type: string;
  value: string;
}

export interface MetaInsight {
  campaign_name: string;
  campaign_id: string;
  date_start: string;
  date_stop: string;
  impressions: string;
  clicks: string;
  reach: string;
  spend: string;
  cpm: string;
  cpc: string;
  purchase_roas?: MetaVideoAction[];
  video_avg_time_watched_actions?: MetaVideoAction[];
  video_thruplay_watched_actions?: MetaVideoAction[];
}

export interface MetaApiResponse {
  data: MetaInsight[];
  paging?: {
    cursors: { before: string; after: string };
    next?: string;
  };
}

export interface DailyDataPoint {
  date: string;
  impressions: number;
  clicks: number;
  reach: number;
  thruplays: number;
  thruplayRate: number;
  spend: number;
  cpm: number;
  cpc: number;
  roas: number;
}

export interface CampaignData {
  campaignId: string;
  campaignName: string;
  dailyData: DailyDataPoint[];
}

export interface CampaignSummary {
  campaignId: string;
  campaignName: string;
  totalImpressions: number;
  totalClicks: number;
  avgReachPerDay: number;
  avgThruplayRate: number;
}

export interface DashboardData {
  campaigns: CampaignData[];
  totals: {
    totalImpressions: number;
    totalClicks: number;
    avgReachPerDay: number;
    avgThruplayRate: number;
    totalSpend: number;
    avgCpm: number;
    avgCpc: number;
    avgRoas: number;
  };
}
