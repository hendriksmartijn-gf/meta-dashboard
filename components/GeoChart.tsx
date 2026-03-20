'use client';

import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { GeoDataPoint } from '@/app/api/meta/geo/route';

const COUNTRY_NAMES: Record<string, string> = {
  NL: 'Nederland', BE: 'België', DE: 'Duitsland', FR: 'Frankrijk',
  GB: 'Ver. Koninkrijk', US: 'Verenigde Staten', ES: 'Spanje', IT: 'Italië',
  PL: 'Polen', SE: 'Zweden', DK: 'Denemarken', NO: 'Noorwegen',
  FI: 'Finland', AT: 'Oostenrijk', CH: 'Zwitserland', PT: 'Portugal',
  TR: 'Turkije', AU: 'Australië', CA: 'Canada', IN: 'India',
};

function countryName(code: string): string {
  return COUNTRY_NAMES[code] ?? code;
}

type Metric = 'impressions' | 'clicks' | 'reach' | 'ctr';

const METRIC_CONFIG: { key: Metric; label: string; formatter: (v: number) => string }[] = [
  { key: 'impressions', label: 'Weergaven', formatter: (v) => v.toLocaleString('nl-NL') },
  { key: 'clicks', label: 'Clicks', formatter: (v) => v.toLocaleString('nl-NL') },
  { key: 'reach', label: 'Bereik', formatter: (v) => v.toLocaleString('nl-NL') },
  { key: 'ctr', label: 'CTR %', formatter: (v) => `${v.toFixed(2)}%` },
];

interface GeoChartProps {
  data: GeoDataPoint[];
}

export default function GeoChart({ data }: GeoChartProps) {
  const [activeMetric, setActiveMetric] = useState<Metric>('impressions');
  const config = METRIC_CONFIG.find((m) => m.key === activeMetric)!;

  const chartData = [...data]
    .sort((a, b) => b[activeMetric] - a[activeMetric])
    .slice(0, 10)
    .map((d) => ({ ...d, name: countryName(d.countryCode) }))
    .reverse();

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { payload: GeoDataPoint & { name: string } }[] }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div className="bg-white rounded-[8px] shadow-[0_4px_12px_rgba(0,0,0,0.06)] shadow p-3 text-sm">
        <p className="font-semibold text-[#0f0f0f] mb-2">{d.name}</p>
        {METRIC_CONFIG.map((m) => (
          <p key={m.key} className="flex gap-2">
            <span className="text-slate-500">{m.label}:</span>
            <span className="font-semibold">{m.formatter(d[m.key])}</span>
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-[8px] shadow-[0_4px_12px_rgba(0,0,0,0.06)] p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="font-semibold text-[#0f0f0f] text-base">Geografisch overzicht</h2>
          <p className="text-xs text-[#A38DFB] uppercase tracking-widest mt-0.5">Top 10 landen</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {METRIC_CONFIG.map((m, i) => (
            <button
              key={m.key}
              onClick={() => setActiveMetric(m.key)}
              className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-colors ${
                activeMetric === m.key
                  ? 'bg-[#6331F4] text-white'
                  : 'bg-white text-[#6331F4] border border-[#E2DBFF] hover:bg-[#E2DBFF]'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={Math.max(chartData.length * 40, 200)}>
        <BarChart layout="vertical" data={chartData} margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2DBFF" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fontSize: 11, fill: '#A38DFB' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => activeMetric === 'ctr' ? `${v}%` : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`}
          />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: '#0f0f0f' }} tickLine={false} axisLine={false} width={110} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F5F3FF' }} />
          <Bar dataKey={activeMetric} radius={0}>
            {chartData.map((_, index) => (
              <Cell
                key={index}
                fill="#6331F4"
                fillOpacity={0.4 + (index / chartData.length) * 0.6}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
