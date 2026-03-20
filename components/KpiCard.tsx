'use client';

interface KpiCardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon?: React.ReactNode;
}

export default function KpiCard({ title, value, subtitle, trend, icon }: KpiCardProps) {
  const trendColor =
    trend === 'up' ? 'text-emerald-500' : trend === 'down' ? 'text-red-500' : 'text-slate-400';

  const trendIcon = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '—';

  return (
    <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-6 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">
          {title}
        </span>
        {icon && <span className="text-slate-300">{icon}</span>}
      </div>
      <div className="text-3xl font-bold text-slate-800 tracking-tight">{value}</div>
      {subtitle && (
        <div className="flex items-center gap-1 text-sm text-slate-500">
          {trend && <span className={`font-semibold ${trendColor}`}>{trendIcon}</span>}
          <span>{subtitle}</span>
        </div>
      )}
    </div>
  );
}
