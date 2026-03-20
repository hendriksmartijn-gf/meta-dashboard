'use client';

import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { DailyDataPoint, CampaignData } from '@/types/meta';

const COLORS = ['#6331F4', '#A38DFB', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

interface ScatterPoint {
  x: number;
  y: number;
  date: string;
  campaign: string;
}

function calcAverage(arr: number[]): number {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function calcCorrelation(data: DailyDataPoint[]): number {
  const n = data.length;
  if (n < 2) return 0;
  const xs = data.map((d) => d.thruplayRate);
  const ys = data.map((d) => d.clicks);
  const mx = calcAverage(xs);
  const my = calcAverage(ys);
  const num = xs.reduce((sum, x, i) => sum + (x - mx) * (ys[i] - my), 0);
  const den = Math.sqrt(
    xs.reduce((s, x) => s + (x - mx) ** 2, 0) *
    ys.reduce((s, y) => s + (y - my) ** 2, 0)
  );
  return den === 0 ? 0 : num / den;
}

function correlationLabel(r: number): { text: string; color: string } {
  const abs = Math.abs(r);
  if (abs >= 0.7) return { text: r > 0 ? 'Sterke positieve correlatie' : 'Sterke negatieve correlatie', color: 'text-emerald-600' };
  if (abs >= 0.4) return { text: r > 0 ? 'Matige positieve correlatie' : 'Matige negatieve correlatie', color: 'text-amber-600' };
  return { text: 'Geen duidelijke correlatie', color: 'text-slate-400' };
}

interface CorrelationChartProps {
  campaigns: CampaignData[];
}

export default function CorrelationChart({ campaigns }: CorrelationChartProps) {
  const allDailyData = campaigns.flatMap((c) => c.dailyData);
  const r = calcCorrelation(allDailyData);
  const { text: corrText, color: corrColor } = correlationLabel(r);

  const seriesPerCampaign = campaigns.map((c, i) => ({
    name: c.campaignName,
    color: COLORS[i % COLORS.length],
    points: c.dailyData
      .filter((d) => d.impressions > 0)
      .map((d) => ({
        x: parseFloat(d.thruplayRate.toFixed(2)),
        y: d.clicks,
        date: d.date,
        campaign: c.campaignName,
      })),
  }));

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { payload: ScatterPoint }[] }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div className="bg-white rounded-[8px] shadow-[0_4px_12px_rgba(0,0,0,0.06)] shadow p-3 text-sm">
        <p className="font-semibold text-[#0f0f0f] mb-1">{d.date}</p>
        <p className="text-[#A38DFB] text-xs mb-2 truncate max-w-[180px]">{d.campaign}</p>
        <p><span className="text-slate-500">ThruPlay:</span> <span className="font-semibold">{d.x}%</span></p>
        <p><span className="text-slate-500">Clicks:</span> <span className="font-semibold">{d.y.toLocaleString('nl-NL')}</span></p>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-[8px] shadow-[0_4px_12px_rgba(0,0,0,0.06)] p-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-6">
        <div>
          <h2 className="font-semibold text-[#0f0f0f] text-base">Uitkijkers vs Clicks</h2>
          <p className="text-xs text-[#A38DFB] uppercase tracking-widest mt-0.5">
            Elke punt = één dag
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xs text-[#A38DFB] uppercase tracking-widest">Pearson r</p>
          <p className="text-2xl font-bold text-[#6331F4]">{r.toFixed(2)}</p>
          <p className={`text-xs font-semibold ${corrColor}`}>{corrText}</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <ScatterChart margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2DBFF" />
          <XAxis
            dataKey="x"
            name="ThruPlay %"
            type="number"
            label={{ value: 'ThruPlay %', position: 'insideBottom', offset: -2, fontSize: 11, fill: '#A38DFB' }}
            tick={{ fontSize: 11, fill: '#A38DFB' }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            dataKey="y"
            name="Clicks"
            type="number"
            tick={{ fontSize: 11, fill: '#A38DFB' }}
            tickLine={false}
            axisLine={false}
            width={40}
          />
          <Tooltip content={<CustomTooltip />} />
          {seriesPerCampaign.map((series) => (
            <Scatter key={series.name} name={series.name} data={series.points} fill={series.color} fillOpacity={0.75} />
          ))}
        </ScatterChart>
      </ResponsiveContainer>

      <div className="flex flex-wrap gap-3 mt-4">
        {seriesPerCampaign.map((series) => (
          <div key={series.name} className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="w-2.5 h-2.5 shrink-0" style={{ backgroundColor: series.color }} />
            <span className="truncate max-w-[200px]">{series.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
