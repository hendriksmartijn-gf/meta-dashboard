'use client';

interface KpiCardProps {
  title: string;
  value: string;
  subtitle?: string;
  accent?: boolean;
}

export default function KpiCard({ title, value, subtitle, accent }: KpiCardProps) {
  return (
    <div className={`p-6 flex flex-col gap-2 ${accent ? 'bg-[#6331F4]' : 'bg-white'}`}>
      <span className={`text-xs font-semibold uppercase tracking-widest ${accent ? 'text-[#A38DFB]' : 'text-[#A38DFB]'}`}>
        {title}
      </span>
      <div className={`text-3xl font-bold tracking-tight ${accent ? 'text-white' : 'text-[#0f0f0f]'}`}>
        {value}
      </div>
      {subtitle && (
        <div className={`text-xs ${accent ? 'text-[#C4B4FD]' : 'text-slate-400'}`}>
          {subtitle}
        </div>
      )}
    </div>
  );
}
