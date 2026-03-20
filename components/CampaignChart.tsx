'use client';

import { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
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
  { key: 'impressions', label: 'Weergaven', color: '#3b82f6', formatter: (v) => v.toLocaleString('nl-NL') },
  { key: 'clicks', label: 'Clicks', color: '#10b981', formatter: (v) => v.toLocaleString('nl-NL') },
  { key: 'reach', label: 'Bereik', color: '#f59e0b', formatter: (v) => v.toLocaleString('nl-NL') },
  { key: 'thruplayRate', label: 'ThruPlay %', color: '#8b5cf6', formatter: (v) => `${v.toFixed(1)}%` },
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
        if (next.size > 1) next.delete(key); // keep at least one active
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const chartData = data.map((d) => ({
    ...d,
    date: formatDate(d.date),
  }));

  // Custom tooltip
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
      <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-3 text-sm">
        <p className="font-semibold text-slate-700 mb-2">{label}</p>
        {payload.map((entry) => {
          const metric = METRICS.find((m) => m.label === entry.name);
          return (
            <div key={entry.name} className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-slate-500">{entry.name}:</span>
              <span className="font-medium text-slate-800">
                {metric ? metric.formatter(entry.value) : entry.value}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h2 className="font-semibold text-slate-800 text-lg leading-tight">{campaignName}</h2>
        <div className="flex flex-wrap gap-2">
          {METRICS.map((metric) => (
            <button
              key={metric.key as string}
              onClick={() => toggleMetric(metric.key as string)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all border ${
                activeMetrics.has(metric.key as string)
                  ? 'border-transparent text-white'
                  : 'bg-white text-slate-400 border-slate-200'
              }`}
              style={
                activeMetrics.has(metric.key as string)
                  ? { backgroundColor: metric.color, borderColor: metric.color }
                  : {}
              }
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: activeMetrics.has(metric.key as string) ? 'white' : metric.color }}
              />
              {metric.label}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            tickLine={false}
            axisLine={false}
            width={40}
          />
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
