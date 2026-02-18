import { useDashboardStore } from '../../stores/useDashboardStore';

const PRESETS = [
  { label: 'Today', days: 0 },
  { label: '7 Days', days: 7 },
  { label: '30 Days', days: 30 },
  { label: 'All Time', days: -1 },
];

function getPresetDates(days: number): { start: string | null; end: string | null } {
  if (days === -1) return { start: null, end: null };
  const end = new Date();
  const start = new Date();
  if (days === 0) {
    start.setHours(0, 0, 0, 0);
  } else {
    start.setDate(start.getDate() - days);
    start.setHours(0, 0, 0, 0);
  }
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  };
}

export default function DateFilter() {
  const { dateRange, setDateRange } = useDashboardStore();

  const activePreset = PRESETS.find((p) => {
    const { start, end } = getPresetDates(p.days);
    return start === dateRange.start && end === dateRange.end;
  })?.label ?? null;

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
      <div className="flex gap-1.5 flex-wrap">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            onClick={() => {
              const { start, end } = getPresetDates(p.days);
              setDateRange(start, end);
            }}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              activePreset === p.label
                ? 'bg-blue-800 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <input
          type="date"
          value={dateRange.start ?? ''}
          onChange={(e) => setDateRange(e.target.value || null, dateRange.end)}
          className="border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-700 bg-white"
        />
        <span>–</span>
        <input
          type="date"
          value={dateRange.end ?? ''}
          onChange={(e) => setDateRange(dateRange.start, e.target.value || null)}
          className="border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-700 bg-white"
        />
      </div>
    </div>
  );
}
