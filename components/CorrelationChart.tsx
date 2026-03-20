'use client';

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import type { DailyDataPoint, CampaignData } from '@/types/meta';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#ec4899'];

interface ScatterPoint {
  x: number; // thruplayRate
  y: number; // clicks
  date: string;
  campaign: string;
}

interface CorrelationChartProps {
  campaigns: CampaignData[];
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

export default function CorrelationChart({ campaigns }: CorrelationChartProps) {
  // Flatten all data points with campaign label
  const allPoints: ScatterPoint[] = campaigns.flatMap((c) =>
    c.dailyData
      .filter((d) => d.impressions > 0)
      .map((d) => ({
        x: parseFloat(d.thruplayRate.toFixed(2)),
        y: d.clicks,
        date: d.date,
        campaign: c.campaignName,
      }))
  );

  const allDailyData = campaigns.flatMap((c) => c.dailyData);
  const r = calcCorrelation(allDailyData);
  const { text: corrText, color: corrColor } = correlationLabel(r);

  const CustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: { payload: ScatterPoint }[];
  }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-3 text-sm">
        <p className="font-semibold text-slate-700 mb-1">{d.date}</p>
        <p className="text-slate-400 text-xs mb-2 truncate max-w-[180px]">{d.campaign}</p>
        <div className="flex items-center gap-2">
          <span className="text-slate-500">ThruPlay:</span>
          <span className="font-medium">{d.x}%</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-500">Clicks:</span>
          <span className="font-medium">{d.y.toLocaleString('nl-NL')}</span>
        </div>
      </div>
    );
  };

  // Group points per campaign for separate scatter series
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

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-6">
        <div>
          <h2 className="font-semibold text-slate-800 text-lg">Uitkijkers vs Clicks</h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Elke punt = één dag. Zit er verband tussen ThruPlay % en klikken?
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xs text-slate-400">Pearson r</p>
          <p className="text-2xl font-bold text-slate-800">{r.toFixed(2)}</p>
          <p className={`text-xs font-medium ${corrColor}`}>{corrText}</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <ScatterChart margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis
            dataKey="x"
            name="ThruPlay %"
            type="number"
            label={{ value: 'ThruPlay %', position: 'insideBottom', offset: -2, fontSize: 11, fill: '#94a3b8' }}
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            dataKey="y"
            name="Clicks"
            type="number"
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            tickLine={false}
            axisLine={false}
            width={40}
          />
          <Tooltip content={<CustomTooltip />} />
          {seriesPerCampaign.map((series) => (
            <Scatter
              key={series.name}
              name={series.name}
              data={series.points}
              fill={series.color}
              fillOpacity={0.7}
            />
          ))}
        </ScatterChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-4">
        {seriesPerCampaign.map((series) => (
          <div key={series.name} className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: series.color }} />
            <span className="truncate max-w-[200px]">{series.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
