'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
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
  const buckets: DayStats[] = DAYS.map((day) => ({ day, clicks: 0, impressions: 0, thruplayRate: 0, count: 0 }));
  for (const point of allData) {
    const dow = new Date(point.date).getDay();
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

  const TooltipClicks = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white border border-[#E2DBFF] shadow p-3 text-sm">
        <p className="font-semibold mb-1">{label}</p>
        <p className="text-[#6331F4] font-semibold">{payload[0].value.toLocaleString('nl-NL')} clicks</p>
      </div>
    );
  };

  const TooltipThru = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white border border-[#E2DBFF] shadow p-3 text-sm">
        <p className="font-semibold mb-1">{label}</p>
        <p className="text-[#A38DFB] font-semibold">{payload[0].value}% ThruPlay</p>
      </div>
    );
  };

  return (
    <div className="bg-white border border-[#E2DBFF] p-6">
      <h2 className="font-semibold text-[#0f0f0f] text-base mb-1">Prestaties per weekdag</h2>
      <p className="text-xs text-[#A38DFB] uppercase tracking-widest mb-6">Gemiddelde over de geselecteerde periode</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#A38DFB] mb-3">Gem. clicks</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2DBFF" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#A38DFB' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#A38DFB' }} tickLine={false} axisLine={false} width={35} />
              <Tooltip content={<TooltipClicks />} />
              <Bar dataKey="clicks" name="Clicks" fill="#6331F4" radius={0} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#A38DFB] mb-3">Gem. ThruPlay %</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2DBFF" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#A38DFB' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#A38DFB' }} tickLine={false} axisLine={false} width={35} />
              <Tooltip content={<TooltipThru />} />
              <Bar dataKey="thruplayRate" name="ThruPlay %" fill="#A38DFB" radius={0} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
