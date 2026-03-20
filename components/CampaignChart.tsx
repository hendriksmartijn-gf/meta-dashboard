'use client';

import { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { DailyDataPoint } from '@/types/meta';

interface MetricConfig {
  key: keyof DailyDataPoint;
  label: string;
  color: string;
  formatter: (v: number) => string;
}

const euro = (v: number) =>
  v.toLocaleString('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 });

const METRICS: MetricConfig[] = [
  { key: 'impressions', label: 'Weergaven', color: '#6331F4', formatter: (v) => v.toLocaleString('nl-NL') },
  { key: 'clicks', label: 'Clicks', color: '#A38DFB', formatter: (v) => v.toLocaleString('nl-NL') },
  { key: 'reach', label: 'Bereik', color: '#10b981', formatter: (v) => v.toLocaleString('nl-NL') },
  { key: 'thruplayRate', label: 'ThruPlay %', color: '#f59e0b', formatter: (v) => `${v.toFixed(1)}%` },
  { key: 'spend', label: 'Spend', color: '#ef4444', formatter: euro },
  { key: 'cpm', label: 'CPM', color: '#f97316', formatter: euro },
  { key: 'cpc', label: 'CPC', color: '#ec4899', formatter: euro },
  { key: 'roas', label: 'ROAS', color: '#14b8a6', formatter: (v) => `${v.toFixed(2)}x` },
];

interface CampaignChartProps {
  campaignName: string;
  data: DailyDataPoint[];
}

function formatDate(dateStr: string): string {
  const [, month, day] = dateStr.split('-');
  return `${day}/${month}`;
}

export default function CampaignChart({ campaignName, data }: CampaignChartProps) {
  const [activeMetrics, setActiveMetrics] = useState<Set<string>>(
    new Set(['impressions', 'clicks', 'spend'])
  );

  const toggleMetric = (key: string) => {
    setActiveMetrics((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        if (next.size > 1) next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const chartData = data.map((d) => ({ ...d, date: formatDate(d.date) }));

  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: { name: string; value: number; color: string }[];
    label?: string;
  }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white rounded-[8px] shadow-[0_4px_12px_rgba(0,0,0,0.06)] shadow-lg p-3 text-sm">
        <p className="font-semibold text-[#0f0f0f] mb-2">{label}</p>
        {payload.map((entry) => {
          const metric = METRICS.find((m) => m.label === entry.name);
          return (
            <div key={entry.name} className="flex items-center gap-2">
              <span className="w-2 h-2" style={{ backgroundColor: entry.color }} />
              <span className="text-slate-500">{entry.name}:</span>
              <span className="font-semibold text-[#0f0f0f]">
                {metric ? metric.formatter(entry.value) : entry.value}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-[8px] shadow-[0_4px_12px_rgba(0,0,0,0.06)] p-6">
      <h2 className="font-semibold text-[#22222D] text-base leading-tight mb-3 w-full">{campaignName}</h2>
      <div className="flex flex-wrap gap-1.5 mb-6">
        {METRICS.map((metric) => (
          <button
            key={metric.key as string}
            onClick={() => toggleMetric(metric.key as string)}
            className={`px-3 py-1 text-[11px] font-semibold rounded-full transition-colors ${
              activeMetrics.has(metric.key as string)
                ? 'text-white'
                : 'bg-[#F5F3FF] text-[#6331F4] hover:bg-[#E2DBFF]'
            }`}
            style={
              activeMetrics.has(metric.key as string)
                ? { backgroundColor: metric.color }
                : {}
            }
          >
            {metric.label}
          </button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2DBFF" />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#A38DFB', fontFamily: 'var(--font-inter)' }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#A38DFB', fontFamily: 'var(--font-inter)' }} tickLine={false} axisLine={false} width={40} />
          <Tooltip content={<CustomTooltip />} />
          {METRICS.filter((m) => activeMetrics.has(m.key as string)).map((metric) => (
            <Line
              key={metric.key as string}
              type="monotone"
              dataKey={metric.key as string}
              name={metric.label}
              stroke={metric.color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
