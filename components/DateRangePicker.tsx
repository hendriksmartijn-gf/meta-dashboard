'use client';

export type DatePreset = 'last_3d' | 'last_7d' | 'last_14d' | 'last_30d';

const PRESETS: { label: string; value: DatePreset }[] = [
  { label: '3 dagen', value: 'last_3d' },
  { label: '7 dagen', value: 'last_7d' },
  { label: '14 dagen', value: 'last_14d' },
  { label: '30 dagen', value: 'last_30d' },
];

interface DateRangePickerProps {
  value: DatePreset;
  onChange: (preset: DatePreset) => void;
}

export default function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  return (
    <div className="flex gap-0 border border-[#E2DBFF]">
      {PRESETS.map((preset, i) => (
        <button
          key={preset.value}
          onClick={() => onChange(preset.value)}
          className={`px-4 py-2 text-xs font-semibold uppercase tracking-widest transition-colors ${
            i < PRESETS.length - 1 ? 'border-r border-[#E2DBFF]' : ''
          } ${
            value === preset.value
              ? 'bg-[#6331F4] text-white'
              : 'bg-white text-[#6331F4] hover:bg-[#E2DBFF]'
          }`}
        >
          {preset.label}
        </button>
      ))}
    </div>
  );
}
