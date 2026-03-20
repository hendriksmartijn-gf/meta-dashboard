'use client';

export type DatePreset = 'last_3d' | 'last_7d' | 'last_14d' | 'last_30d';

const PRESETS: { label: string; value: DatePreset }[] = [
  { label: 'Laatste 3 dagen', value: 'last_3d' },
  { label: 'Laatste 7 dagen', value: 'last_7d' },
  { label: 'Laatste 14 dagen', value: 'last_14d' },
  { label: 'Laatste 30 dagen', value: 'last_30d' },
];

interface DateRangePickerProps {
  value: DatePreset;
  onChange: (preset: DatePreset) => void;
}

export default function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  return (
    <div className="flex gap-2 flex-wrap">
      {PRESETS.map((preset) => (
        <button
          key={preset.value}
          onClick={() => onChange(preset.value)}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            value === preset.value
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white text-slate-600 border border-slate-200 hover:border-blue-300 hover:text-blue-600'
          }`}
        >
          {preset.label}
        </button>
      ))}
    </div>
  );
}
