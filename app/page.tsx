'use client';

import { useState, useEffect, useCallback } from 'react';
import KpiCard from '@/components/KpiCard';
import CampaignChart from '@/components/CampaignChart';
import DayOfWeekChart from '@/components/DayOfWeekChart';
import CorrelationChart from '@/components/CorrelationChart';
import GeoChart from '@/components/GeoChart';
import DateRangePicker, { DatePreset } from '@/components/DateRangePicker';
import type { DashboardData, DailyDataPoint } from '@/types/meta';
import type { GeoDataPoint } from '@/app/api/meta/geo/route';

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
    <div className="bg-white border border-[#E2DBFF] p-6 animate-pulse">
      <div className="h-3 bg-[#E2DBFF] w-1/2 mb-4" />
      <div className="h-8 bg-[#E2DBFF] w-2/3 mb-2" />
      <div className="h-3 bg-[#E2DBFF] w-1/3" />
    </div>
  );
}

function SkeletonChart() {
  return (
    <div className="bg-white border border-[#E2DBFF] p-6 animate-pulse">
      <div className="h-5 bg-[#E2DBFF] w-1/3 mb-6" />
      <div className="h-[280px] bg-[#F5F3FF]" />
    </div>
  );
}

export default function DashboardPage() {
  const [datePreset, setDatePreset] = useState<DatePreset>('last_30d');
  const [data, setData] = useState<DashboardData | null>(null);
  const [geoData, setGeoData] = useState<GeoDataPoint[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [insightsRes, geoRes] = await Promise.all([
        fetch(`/api/meta/insights?date_preset=${datePreset}`),
        fetch(`/api/meta/geo?date_preset=${datePreset}`),
      ]);

      if (!insightsRes.ok) {
        const json = await insightsRes.json().catch(() => ({}));
        throw new Error(json.error ?? `HTTP ${insightsRes.status}`);
      }

      const json: DashboardData = await insightsRes.json();
      setData(json);

      if (geoRes.ok) {
        const geo: GeoDataPoint[] = await geoRes.json();
        setGeoData(geo);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Onbekende fout');
    } finally {
      setLoading(false);
    }
  }, [datePreset]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return (
    <main className="min-h-screen bg-[#F5F3FF]">
      {/* Top bar */}
      <header className="bg-white border-b-2 border-[#6331F4]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <img
            src="https://cdn.prod.website-files.com/66420f92b8baaeb64149cdba/6642295254ef6ed97ea01273_LogoSVG.svg"
            alt="Goldfizh"
            className="h-7 w-auto"
          />
          {/* Client name */}
          <span className="text-sm font-semibold tracking-widest uppercase text-[#6331F4]">
            Het Allermooiste Feestje
          </span>
        </div>
      </header>

      {/* Sub-bar: date picker */}
      <div className="bg-white border-b border-[#E2DBFF]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-3 flex items-center gap-4">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#A38DFB]">Periode</span>
          <DateRangePicker value={datePreset} onChange={setDatePreset} />
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
          <h2 className="text-xs font-semibold uppercase tracking-widest text-[#A38DFB] mb-4">
            Totaaloverzicht
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-[#E2DBFF]">
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
            ) : data ? (
              <>
                <KpiCard title="Weergaven" value={formatNumber(data.totals.totalImpressions)} subtitle="Totaal impressies" />
                <KpiCard title="Clicks" value={formatNumber(data.totals.totalClicks)} subtitle="Totaal klikken" />
                <KpiCard title="Bereik" value={formatNumber(data.totals.avgReachPerDay)} subtitle="Gemiddeld per dag" />
                <KpiCard title="ThruPlay rate" value={formatPercent(data.totals.avgThruplayRate)} subtitle="Gem. uitkijkpercentage" />
                <KpiCard title="Spend" value={formatEuro(data.totals.totalSpend)} subtitle="Totaal uitgegeven" accent />
                <KpiCard title="CPM" value={formatEuro(data.totals.avgCpm)} subtitle="Kosten per 1.000 weergaven" accent />
                <KpiCard title="CPC" value={formatEuro(data.totals.avgCpc)} subtitle="Kosten per klik" accent />
                <KpiCard
                  title="ROAS"
                  value={data.totals.avgRoas > 0 ? `${data.totals.avgRoas.toFixed(2)}x` : '—'}
                  subtitle={data.totals.avgRoas > 0 ? 'Gemiddeld rendement' : 'Geen conversiedata'}
                  accent
                />
              </>
            ) : null}
          </div>
        </section>

        {/* Campaign charts */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-[#A38DFB] mb-4">
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
                />
              ))}
            </div>
          ) : !error ? (
            <div className="bg-white border border-[#E2DBFF] p-12 text-center">
              <p className="text-slate-400">Geen campagnedata gevonden</p>
            </div>
          ) : null}
        </section>

        {/* Analyse */}
        {!loading && data && data.campaigns.length > 0 && (() => {
          const allData: DailyDataPoint[] = data.campaigns.flatMap((c) => c.dailyData);
          return (
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-[#A38DFB] mb-4">
                Analyse
              </h2>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <DayOfWeekChart allData={allData} />
                <CorrelationChart campaigns={data.campaigns} />
              </div>
            </section>
          );
        })()}

        {/* Geografie */}
        {!loading && geoData && geoData.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-[#A38DFB] mb-4">
              Geografie
            </h2>
            <GeoChart data={geoData} />
          </section>
        )}
      </div>
    </main>
  );
}
