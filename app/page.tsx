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
    <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-6 animate-pulse">
      <div className="h-3 bg-slate-200 rounded w-1/2 mb-4" />
      <div className="h-8 bg-slate-200 rounded w-2/3 mb-2" />
      <div className="h-3 bg-slate-200 rounded w-1/3" />
    </div>
  );
}

function SkeletonChart() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 animate-pulse">
      <div className="h-5 bg-slate-200 rounded w-1/3 mb-6" />
      <div className="h-[280px] bg-slate-100 rounded-xl" />
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
    <main className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Meta Ads Dashboard</h1>
            <p className="text-sm text-slate-500">Dagelijkse campagne inzichten</p>
          </div>
          <DateRangePicker value={datePreset} onChange={setDatePreset} />
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {error && (
          <div className="rounded-2xl bg-red-50 border border-red-200 p-6 text-center">
            <p className="text-red-700 font-semibold text-lg mb-1">Er is iets misgegaan</p>
            <p className="text-red-500 text-sm">{error}</p>
            <button
              onClick={fetchData}
              className="mt-4 px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors"
            >
              Opnieuw proberen
            </button>
          </div>
        )}

        <section>
          <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-400 mb-4">
            Totaaloverzicht
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
            ) : data ? (
              <>
                <KpiCard title="Weergaven" value={formatNumber(data.totals.totalImpressions)} subtitle="Totaal impressies" />
                <KpiCard title="Clicks" value={formatNumber(data.totals.totalClicks)} subtitle="Totaal klikken" />
                <KpiCard title="Bereik" value={formatNumber(data.totals.avgReachPerDay)} subtitle="Gemiddeld per dag" />
                <KpiCard title="ThruPlay rate" value={formatPercent(data.totals.avgThruplayRate)} subtitle="Gem. uitkijkpercentage" />
                <KpiCard title="Spend" value={formatEuro(data.totals.totalSpend)} subtitle="Totaal uitgegeven" />
                <KpiCard title="CPM" value={formatEuro(data.totals.avgCpm)} subtitle="Kosten per 1.000 weergaven" />
                <KpiCard title="CPC" value={formatEuro(data.totals.avgCpc)} subtitle="Kosten per klik" />
                <KpiCard
                  title="ROAS"
                  value={data.totals.avgRoas > 0 ? `${data.totals.avgRoas.toFixed(2)}x` : '—'}
                  subtitle={data.totals.avgRoas > 0 ? 'Gemiddeld rendement' : 'Geen conversiedata'}
                />
              </>
            ) : null}
          </div>
        </section>

        <section>
          <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-400 mb-4">
            Campagnes per dag
          </h2>

          {loading ? (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <SkeletonChart />
              <SkeletonChart />
            </div>
          ) : data && data.campaigns.length > 0 ? (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {data.campaigns.map((campaign) => (
                <CampaignChart
                  key={campaign.campaignId}
                  campaignName={campaign.campaignName}
                  data={campaign.dailyData}
                />
              ))}
            </div>
          ) : !error ? (
            <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-12 text-center">
              <p className="text-slate-400 text-lg">Geen campagnedata gevonden</p>
              <p className="text-slate-300 text-sm mt-1">
                Controleer je Meta advertentieaccount of selecteer een andere periode.
              </p>
            </div>
          ) : null}
        </section>

        {/* Dag-van-de-week analyse + correlatie */}
        {!loading && data && data.campaigns.length > 0 && (() => {
          const allData: DailyDataPoint[] = data.campaigns.flatMap((c) => c.dailyData);
          return (
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-400 mb-4">
                Analyse
              </h2>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <DayOfWeekChart allData={allData} />
                <CorrelationChart campaigns={data.campaigns} />
              </div>
            </section>
          );
        })()}

        {/* Geografisch overzicht */}
        {!loading && geoData && geoData.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-400 mb-4">
              Geografie
            </h2>
            <GeoChart data={geoData} />
          </section>
        )}
      </div>
    </main>
  );
}
