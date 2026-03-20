'use client';

interface KpiCardProps {
  title: string;
  value: string;
  subtitle?: string;
  accent?: boolean;
}

export default function KpiCard({ title, value, subtitle }: KpiCardProps) {
  return (
    <div className="bg-white rounded-[8px] shadow-[0_4px_12px_rgba(0,0,0,0.06)] p-6 flex flex-col gap-2">
      <span className="text-xs font-semibold uppercase tracking-widest text-[#6331F4]">
        {title}
      </span>
      <div className="text-3xl font-bold tracking-tight text-[#22222D]">
        {value}
      </div>
      {subtitle && (
        <div className="text-xs text-slate-400">{subtitle}</div>
      )}
    </div>
  );
}
