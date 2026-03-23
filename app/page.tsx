'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import KpiCard from '@/components/KpiCard';
import CampaignChart from '@/components/CampaignChart';
import DayOfWeekChart from '@/components/DayOfWeekChart';
import CorrelationChart from '@/components/CorrelationChart';
import GeoChart from '@/components/GeoChart';
import DateRangePicker, { DateSelection } from '@/components/DateRangePicker';
import type { DashboardData, DailyDataPoint, CampaignData } from '@/types/meta';
import type { GeoDataPoint } from '@/app/api/meta/geo/route';

function computeTotals(campaigns: CampaignData[]) {
  let totalImpressions = 0, totalClicks = 0, totalReach = 0, reachDays = 0;
  let totalThruplayRate = 0, thruplayDays = 0, totalSpend = 0;
  let totalCpm = 0, cpmDays = 0, totalCpc = 0, cpcDays = 0;
  let totalRoas = 0, roasDays = 0;

  for (const c of campaigns) {
    for (const d of c.dailyData) {
      totalImpressions += d.impressions;
      totalClicks += d.clicks;
      totalReach += d.reach;
      totalSpend += d.spend;
      reachDays++;
      if (d.impressions > 0) { totalThruplayRate += d.thruplayRate; thruplayDays++; totalCpm += d.cpm; cpmDays++; }
      if (d.clicks > 0) { totalCpc += d.cpc; cpcDays++; }
      if (d.roas > 0) { totalRoas += d.roas; roasDays++; }
    }
  }

  return {
    totalImpressions,
    totalClicks,
    avgReachPerDay: reachDays > 0 ? Math.round(totalReach / reachDays) : 0,
    avgThruplayRate: thruplayDays > 0 ? totalThruplayRate / thruplayDays : 0,
    totalSpend,
    avgCpm: cpmDays > 0 ? totalCpm / cpmDays : 0,
    avgCpc: cpcDays > 0 ? totalCpc / cpcDays : 0,
    avgRoas: roasDays > 0 ? totalRoas / roasDays : 0,
  };
}

function formatNumber(n: number): string {
  return n.toLocaleString('nl-NL');
}

function formatPercent(n: number): string {
  return `${n.toFixed(1)}%`;
}

function formatEuro(n: number): string {
  return n.toLocaleString('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 });
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-[8px] shadow-[0_4px_12px_rgba(0,0,0,0.06)] p-6 animate-pulse">
      <div className="h-3 bg-[#E2DBFF] w-1/2 mb-4" />
      <div className="h-8 bg-[#E2DBFF] w-2/3 mb-2" />
      <div className="h-3 bg-[#E2DBFF] w-1/3" />
    </div>
  );
}

function SkeletonChart() {
  return (
    <div className="bg-white rounded-[8px] shadow-[0_4px_12px_rgba(0,0,0,0.06)] p-6 animate-pulse">
      <div className="h-5 bg-[#E2DBFF] w-1/3 mb-6" />
      <div className="h-[280px] bg-[#F5F3FF]" />
    </div>
  );
}

export default function DashboardPage() {
  const REFRESH_INTERVAL = 5 * 60; // seconds
  const [dateSelection, setDateSelection] = useState<DateSelection>({ type: 'preset', preset: 'last_30d' });
  const [data, setData] = useState<DashboardData | null>(null);
  const [geoData, setGeoData] = useState<GeoDataPoint[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const resetCountdown = useCallback(() => {
    setCountdown(REFRESH_INTERVAL);
    if (countdownRef.current) clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      setCountdown((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
  }, [REFRESH_INTERVAL]);

  const dateParams =
    dateSelection.type === 'preset'
      ? `date_preset=${dateSelection.preset}`
      : `since=${dateSelection.since}&until=${dateSelection.until}`;

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    resetCountdown();
    try {
      const [insightsRes, geoRes] = await Promise.all([
        fetch(`/api/meta/insights?${dateParams}`),
        fetch(`/api/meta/geo?${dateParams}`),
      ]);

      if (!insightsRes.ok) {
        const json = await insightsRes.json().catch(() => ({}));
        throw new Error(json.error ?? `HTTP ${insightsRes.status}`);
      }

      const json: DashboardData = await insightsRes.json();
      setData(json);
      setSelectedIds(new Set(json.campaigns.map((c) => c.campaignId)));

      if (geoRes.ok) {
        const geo: GeoDataPoint[] = await geoRes.json();
        setGeoData(geo);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Onbekende fout');
    } finally {
      setLoading(false);
    }
  }, [dateParams]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, REFRESH_INTERVAL * 1000);
    return () => {
      clearInterval(interval);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [fetchData, REFRESH_INTERVAL]);

  // Refetch when date selection changes
  useEffect(() => {
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateParams]);

  const filteredCampaigns = data ? data.campaigns.filter((c) => selectedIds.has(c.campaignId)) : [];
  const filteredTotals = computeTotals(filteredCampaigns);

  function toggleCampaign(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  }

  return (
    <main className="min-h-screen bg-[#FCFCFF]">
      {/* Top bar */}
      <header className="bg-white border-b-2 border-[#6331F4]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <img
            src="https://cdn.prod.website-files.com/66420f92b8baaeb64149cdba/6642295254ef6ed97ea01273_LogoSVG.svg"
            alt="Goldfizh"
            className="h-7 w-auto"
          />
          {/* Countdown */}
          <span className="font-mono text-xs tabular-nums text-[#A38DFB] tracking-widest" title="Volgende refresh">
            {String(Math.floor(countdown / 60)).padStart(2, '0')}:{String(countdown % 60).padStart(2, '0')}
          </span>
          {/* Client name */}
          <span className="text-sm font-semibold tracking-widest uppercase text-[#22222D]">
            Het Allermooiste Feestje
          </span>
        </div>
      </header>

      {/* Sub-bar: date picker */}
      <div className="bg-white border-b border-[#E2DBFF]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-3 flex items-center gap-4">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#22222D]">Periode</span>
          <DateRangePicker value={dateSelection} onChange={setDateSelection} />
        </div>
      </div>


      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8 space-y-10">
        {/* Error */}
        {error && (
          <div className="bg-white border-l-4 border-[#6331F4] p-6">
            <p className="font-semibold text-[#6331F4] text-lg mb-1">Er is iets misgegaan</p>
            <p className="text-sm text-slate-500">{error}</p>
            <button
              onClick={fetchData}
              className="mt-4 px-5 py-2 bg-[#6331F4] text-white text-sm font-semibold uppercase tracking-widest hover:bg-[#4f25c4] transition-colors"
            >
              Opnieuw
            </button>
          </div>
        )}

        {/* KPI cards */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-[#22222D] mb-4">
            Totaaloverzicht
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
            ) : data ? (
              <>
                <KpiCard title="Weergaven" value={formatNumber(filteredTotals.totalImpressions)} subtitle="Totaal impressies" />
                <KpiCard title="Clicks" value={formatNumber(filteredTotals.totalClicks)} subtitle="Totaal klikken" />
                <KpiCard title="Bereik" value={formatNumber(filteredTotals.avgReachPerDay)} subtitle="Gemiddeld per dag" />
                <KpiCard title="ThruPlay rate" value={formatPercent(filteredTotals.avgThruplayRate)} subtitle="Gem. uitkijkpercentage" />
                <KpiCard title="Spend" value={formatEuro(filteredTotals.totalSpend)} subtitle="Totaal uitgegeven" />
                <KpiCard title="CPM" value={formatEuro(filteredTotals.avgCpm)} subtitle="Kosten per 1.000 weergaven" />
                <KpiCard title="CPC" value={formatEuro(filteredTotals.avgCpc)} subtitle="Kosten per klik" />
                <KpiCard
                  title="ROAS"
                  value={filteredTotals.avgRoas > 0 ? `${filteredTotals.avgRoas.toFixed(2)}x` : '—'}
                  subtitle={filteredTotals.avgRoas > 0 ? 'Gemiddeld rendement' : 'Geen conversiedata'}
                  accent
                />
              </>
            ) : null}
          </div>
        </section>

        {/* Campaign charts */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-[#22222D] mb-4">
            Campagnes per dag
          </h2>
          {loading ? (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <SkeletonChart />
              <SkeletonChart />
            </div>
          ) : data && data.campaigns.length > 0 ? (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {data.campaigns.map((campaign) => (
                <CampaignChart
                  key={campaign.campaignId}
                  campaignName={campaign.campaignName}
                  data={campaign.dailyData}
                  isSelected={selectedIds.has(campaign.campaignId)}
                  onToggle={() => toggleCampaign(campaign.campaignId)}
                />
              ))}
            </div>
          ) : !error ? (
            <div className="bg-white rounded-[8px] shadow-[0_4px_12px_rgba(0,0,0,0.06)] p-12 text-center">
              <p className="text-slate-400">Geen campagnedata gevonden</p>
            </div>
          ) : null}
        </section>

        {/* Analyse */}
        {!loading && filteredCampaigns.length > 0 && (() => {
          const allData: DailyDataPoint[] = filteredCampaigns.flatMap((c) => c.dailyData);
          return (
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-[#22222D] mb-4">
                Analyse
              </h2>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <DayOfWeekChart allData={allData} />
                <CorrelationChart campaigns={filteredCampaigns} />
              </div>
            </section>
          );
        })()}

        {/* Geografie */}
        {!loading && geoData && geoData.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-[#22222D] mb-4">
              Geografie
            </h2>
            <GeoChart data={geoData} />
          </section>
        )}
      </div>
    </main>
  );
}
