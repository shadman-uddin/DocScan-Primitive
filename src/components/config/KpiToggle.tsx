import { useState } from 'react';

interface Props {
  onSaved: () => void;
}

const KPI_ITEMS = [
  { key: 'submissions', label: 'Submissions Over Time', desc: 'Line chart of daily submission volume' },
  { key: 'approval', label: 'Approval Rate', desc: 'Donut chart showing approved vs rejected' },
  { key: 'users', label: 'Submissions by User', desc: 'Horizontal bar chart by submitter' },
  { key: 'confidence', label: 'Confidence Trend', desc: 'Average AI confidence score over time' },
  { key: 'records', label: 'Records Table', desc: 'Full searchable data table' },
  { key: 'requests', label: 'Update Requests Panel', desc: 'List of pending correction requests' },
];

function loadToggles() {
  try {
    const raw = localStorage.getItem('config_kpiToggles');
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export default function KpiToggle({ onSaved }: Props) {
  const [toggles, setToggles] = useState<Record<string, boolean>>(() => {
    const defaults: Record<string, boolean> = {};
    KPI_ITEMS.forEach((k) => { defaults[k.key] = true; });
    return { ...defaults, ...(loadToggles() ?? {}) };
  });

  function handleChange(key: string) {
    const updated = { ...toggles, [key]: !toggles[key] };
    setToggles(updated);
    localStorage.setItem('config_kpiToggles', JSON.stringify(updated));
    onSaved();
  }

  return (
    <div className="space-y-1">
      {KPI_ITEMS.map(({ key, label, desc }) => (
        <div
          key={key}
          className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0"
        >
          <div>
            <p className="text-sm font-medium text-slate-700">{label}</p>
            <p className="text-xs text-slate-400">{desc}</p>
          </div>
          <div
            onClick={() => handleChange(key)}
            className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer flex-shrink-0 ml-4 ${
              toggles[key] ? 'bg-blue-600' : 'bg-slate-200'
            }`}
          >
            <div
              className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                toggles[key] ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
