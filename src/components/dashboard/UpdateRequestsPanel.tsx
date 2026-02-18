import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { DashboardUpdateRequest } from '../../stores/useDashboardStore';

interface Props {
  requests: DashboardUpdateRequest[];
}

function timeAgo(ts: string) {
  try {
    const diff = (Date.now() - new Date(ts).getTime()) / 1000;
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  } catch {
    return ts;
  }
}

export default function UpdateRequestsPanel({ requests }: Props) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  function toggle(row: number) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(row) ? next.delete(row) : next.add(row);
      return next;
    });
  }

  return (
    <div className="bg-white rounded-xl shadow-sm">
      <button
        className="w-full flex items-center justify-between p-4 text-left md:cursor-default"
        onClick={() => setOpen((o) => !o)}
      >
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-slate-700">Update Requests</h3>
          {requests.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
              {requests.length}
            </span>
          )}
        </div>
        <span className="md:hidden text-slate-400">
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </button>

      <div className={`${open ? 'block' : 'hidden'} md:block border-t border-slate-100`}>
        {requests.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-slate-400">
            No update requests
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {requests.map((req) => (
              <div key={req.row} className="px-4 py-3">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-slate-400">{timeAgo(req.timestamp)}</span>
                    {req.originalRow && (
                      <span className="text-xs text-slate-400">Row {req.originalRow}</span>
                    )}
                    <span className="text-xs text-slate-500 font-medium">{req.requestedBy}</span>
                  </div>
                  <span
                    className={`flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${
                      req.status?.toLowerCase() === 'pending'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-green-50 text-green-700'
                    }`}
                  >
                    {req.status || 'Pending'}
                  </span>
                </div>
                <p
                  className={`text-xs text-slate-600 cursor-pointer ${
                    expanded.has(req.row) ? '' : 'line-clamp-2'
                  }`}
                  onClick={() => toggle(req.row)}
                >
                  {req.description}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
