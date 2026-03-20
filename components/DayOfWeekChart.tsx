'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { DailyDataPoint } from '@/types/meta';

const DAYS = ['Zo', 'Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za'];

interface DayStats {
  day: string;
  clicks: number;
  impressions: number;
  thruplayRate: number;
  count: number;
}

function buildDayData(allData: DailyDataPoint[]): DayStats[] {
  const buckets: DayStats[] = DAYS.map((day) => ({
    day,
    clicks: 0,
    impressions: 0,
    thruplayRate: 0,
    count: 0,
  }));

  for (const point of allData) {
    const dow = new Date(point.date).getDay(); // 0 = Sunday
    buckets[dow].clicks += point.clicks;
    buckets[dow].impressions += point.impressions;
    buckets[dow].thruplayRate += point.thruplayRate;
    buckets[dow].count += 1;
  }

  return buckets.map((b) => ({
    ...b,
    clicks: b.count > 0 ? Math.round(b.clicks / b.count) : 0,
    impressions: b.count > 0 ? Math.round(b.impressions / b.count) : 0,
    thruplayRate: b.count > 0 ? parseFloat((b.thruplayRate / b.count).toFixed(1)) : 0,
  }));
}

interface DayOfWeekChartProps {
  allData: DailyDataPoint[];
}

export default function DayOfWeekChart({ allData }: DayOfWeekChartProps) {
  const data = buildDayData(allData);

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
        {payload.map((entry) => (
          <div key={entry.name} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-slate-500">{entry.name}:</span>
            <span className="font-medium text-slate-800">
              {entry.name === 'ThruPlay %'
                ? `${entry.value}%`
                : entry.value.toLocaleString('nl-NL')}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
      <div className="mb-1">
        <h2 className="font-semibold text-slate-800 text-lg">Prestaties per weekdag</h2>
        <p className="text-sm text-slate-400 mt-0.5">Gemiddelde per dag over de geselecteerde periode</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {/* Clicks per weekdag */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">Gem. clicks</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} width={35} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="clicks" name="Clicks" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* ThruPlay per weekdag */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">Gem. ThruPlay %</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} width={35} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="thruplayRate" name="ThruPlay %" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
