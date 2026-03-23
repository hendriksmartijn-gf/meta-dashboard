'use client';

export type DatePreset = 'last_3d' | 'last_7d' | 'last_14d' | 'last_30d';

export type DateSelection =
  | { type: 'preset'; preset: DatePreset }
  | { type: 'custom'; since: string; until: string };

const PRESETS: { label: string; value: DatePreset }[] = [
  { label: '3 dagen', value: 'last_3d' },
  { label: '7 dagen', value: 'last_7d' },
  { label: '14 dagen', value: 'last_14d' },
  { label: '30 dagen', value: 'last_30d' },
];

interface DateRangePickerProps {
  value: DateSelection;
  onChange: (selection: DateSelection) => void;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

export default function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const activePreset = value.type === 'preset' ? value.preset : null;
  const since = value.type === 'custom' ? value.since : daysAgo(30);
  const until = value.type === 'custom' ? value.until : today();

  return (
    <div className="flex flex-wrap items-center gap-2">
      {PRESETS.map((preset) => (
        <button
          key={preset.value}
          onClick={() => onChange({ type: 'preset', preset: preset.value })}
          className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-colors ${
            activePreset === preset.value
              ? 'bg-[#6331F4] text-white'
              : 'bg-white text-[#6331F4] border border-[#E2DBFF] hover:bg-[#E2DBFF]'
          }`}
        >
          {preset.label}
        </button>
      ))}

      <div className="flex items-center gap-1.5 ml-2">
        <input
          type="date"
          value={since}
          max={until}
          onChange={(e) =>
            onChange({ type: 'custom', since: e.target.value, until })
          }
          className={`text-xs px-3 py-1.5 rounded-full border transition-colors cursor-pointer ${
            value.type === 'custom'
              ? 'border-[#6331F4] text-[#6331F4] bg-[#F5F3FF]'
              : 'border-[#E2DBFF] text-[#22222D] bg-white hover:bg-[#F5F3FF]'
          }`}
        />
        <span className="text-xs text-[#A38DFB] font-semibold">→</span>
        <input
          type="date"
          value={until}
          min={since}
          max={today()}
          onChange={(e) =>
            onChange({ type: 'custom', since, until: e.target.value })
          }
          className={`text-xs px-3 py-1.5 rounded-full border transition-colors cursor-pointer ${
            value.type === 'custom'
              ? 'border-[#6331F4] text-[#6331F4] bg-[#F5F3FF]'
              : 'border-[#E2DBFF] text-[#22222D] bg-white hover:bg-[#F5F3FF]'
          }`}
        />
      </div>
    </div>
  );
}
