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
  thruplayRate: number; // percentage: (thruplays / impressions) * 100
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
  avgThruplayRate: number; // average thruplay rate across days
}

export interface DashboardData {
  campaigns: CampaignData[];
  totals: {
    totalImpressions: number;
    totalClicks: number;
    avgReachPerDay: number;
    avgThruplayRate: number;
  };
}
