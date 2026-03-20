'use client';

import { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { GeoDataPoint } from '@/app/api/meta/geo/route';

const COUNTRY_NAMES: Record<string, string> = {
  NL: 'Nederland',
  BE: 'België',
  DE: 'Duitsland',
  FR: 'Frankrijk',
  GB: 'Verenigd Koninkrijk',
  US: 'Verenigde Staten',
  ES: 'Spanje',
  IT: 'Italië',
  PL: 'Polen',
  SE: 'Zweden',
  DK: 'Denemarken',
  NO: 'Noorwegen',
  FI: 'Finland',
  AT: 'Oostenrijk',
  CH: 'Zwitserland',
  PT: 'Portugal',
  TR: 'Turkije',
  AU: 'Australië',
  CA: 'Canada',
  IN: 'India',
};

function countryName(code: string): string {
  return COUNTRY_NAMES[code] ?? code;
}

type Metric = 'impressions' | 'clicks' | 'reach' | 'ctr';

const METRIC_CONFIG: { key: Metric; label: string; color: string; formatter: (v: number) => string }[] = [
  { key: 'impressions', label: 'Weergaven', color: '#3b82f6', formatter: (v) => v.toLocaleString('nl-NL') },
  { key: 'clicks', label: 'Clicks', color: '#10b981', formatter: (v) => v.toLocaleString('nl-NL') },
  { key: 'reach', label: 'Bereik', color: '#f59e0b', formatter: (v) => v.toLocaleString('nl-NL') },
  { key: 'ctr', label: 'CTR %', color: '#8b5cf6', formatter: (v) => `${v.toFixed(2)}%` },
];

interface GeoChartProps {
  data: GeoDataPoint[];
}

export default function GeoChart({ data }: GeoChartProps) {
  const [activeMetric, setActiveMetric] = useState<Metric>('impressions');
  const config = METRIC_CONFIG.find((m) => m.key === activeMetric)!;

  // Top 10 sorted by selected metric
  const chartData = [...data]
    .sort((a, b) => b[activeMetric] - a[activeMetric])
    .slice(0, 10)
    .map((d) => ({ ...d, name: countryName(d.countryCode) }))
    .reverse(); // recharts horizontal: bottom = first, so reverse for top-to-bottom reading

  const CustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: { payload: GeoDataPoint & { name: string } }[];
  }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-3 text-sm">
        <p className="font-semibold text-slate-700 mb-2">{d.name}</p>
        {METRIC_CONFIG.map((m) => (
          <div key={m.key} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: m.color }} />
            <span className="text-slate-500">{m.label}:</span>
            <span className="font-medium text-slate-800">{m.formatter(d[m.key])}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="font-semibold text-slate-800 text-lg">Geografisch overzicht</h2>
          <p className="text-sm text-slate-400 mt-0.5">Top 10 landen</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {METRIC_CONFIG.map((m) => (
            <button
              key={m.key}
              onClick={() => setActiveMetric(m.key)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all border ${
                activeMetric === m.key
                  ? 'border-transparent text-white'
                  : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'
              }`}
              style={activeMetric === m.key ? { backgroundColor: m.color, borderColor: m.color } : {}}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={Math.max(chartData.length * 40, 200)}>
        <BarChart
          layout="vertical"
          data={chartData}
          margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) =>
              activeMetric === 'ctr' ? `${v}%` : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`
            }
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 12, fill: '#475569' }}
            tickLine={false}
            axisLine={false}
            width={90}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
          <Bar dataKey={activeMetric} radius={[0, 4, 4, 0]}>
            {chartData.map((entry, index) => (
              <Cell
                key={entry.countryCode}
                fill={config.color}
                fillOpacity={0.6 + (index / chartData.length) * 0.4}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

