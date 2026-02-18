import { useState, useMemo } from 'react';
import { Search, Download, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import type { DashboardRecord } from '../../stores/useDashboardStore';
import { useAppStore } from '../../stores/useAppStore';

interface Props {
  records: DashboardRecord[];
}

const PAGE_SIZE = 20;

type SortDir = 'asc' | 'desc';

function downloadCSV(records: DashboardRecord[], headers: string[]) {
  const rows = records.map((r) =>
    headers.map((h) => JSON.stringify(r[h] ?? '')).join(',')
  );
  const csv = [headers.map((h) => JSON.stringify(h)).join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `docscan-records-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function RecordsTable({ records }: Props) {
  const { fieldDefinitions } = useAppStore();
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('timestamp');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(1);

  const columns = useMemo(() => [
    { key: 'timestamp', label: 'Timestamp' },
    ...fieldDefinitions.map((f) => ({ key: f.name, label: f.label })),
    { key: 'submittedBy', label: 'Submitted By' },
    { key: 'status', label: 'Status' },
  ], [fieldDefinitions]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return records.filter((r) =>
      !q || columns.some((c) => String(r[c.key] ?? '').toLowerCase().includes(q))
    );
  }, [records, search, columns]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const av = String(a[sortKey] ?? '');
      const bv = String(b[sortKey] ?? '');
      const cmp = av.localeCompare(bv);
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleSort(key: string) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
    setPage(1);
  }

  function handleSearch(v: string) {
    setSearch(v);
    setPage(1);
  }

  function formatTimestamp(ts: string) {
    try {
      return new Date(ts).toLocaleString('en-US', {
        month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    } catch {
      return ts;
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm">
      <div className="flex items-center justify-between p-4 border-b border-slate-100 flex-wrap gap-3">
        <h3 className="text-sm font-semibold text-slate-700">Records</h3>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search records..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg w-44 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <button
            onClick={() => downloadCSV(sorted, columns.map((c) => c.key))}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
          >
            <Download size={13} />
            CSV
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-100">
              {columns.map((col, i) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className={`px-4 py-3 text-left font-semibold text-slate-500 whitespace-nowrap cursor-pointer hover:text-slate-700 select-none ${
                    i === 0 ? 'sticky left-0 bg-white z-10' : ''
                  }`}
                >
                  <span className="flex items-center gap-1">
                    {col.label}
                    {sortKey === col.key ? (
                      sortDir === 'asc' ? <ChevronUp size={11} /> : <ChevronDown size={11} />
                    ) : null}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center text-slate-400">
                  No records found
                </td>
              </tr>
            ) : (
              paginated.map((record, idx) => (
                <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  {columns.map((col, i) => (
                    <td
                      key={col.key}
                      className={`px-4 py-2.5 text-slate-700 ${
                        i === 0 ? 'sticky left-0 bg-white font-medium whitespace-nowrap' : ''
                      }`}
                    >
                      {col.key === 'timestamp' ? (
                        <span className="text-slate-500">{formatTimestamp(record[col.key] ?? '')}</span>
                      ) : col.key === 'status' ? (
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                            String(record[col.key] ?? '').toLowerCase() === 'approved'
                              ? 'bg-green-50 text-green-700'
                              : String(record[col.key] ?? '').toLowerCase() === 'rejected'
                              ? 'bg-red-50 text-red-600'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {record[col.key] ?? '—'}
                        </span>
                      ) : (
                        <span className="max-w-[140px] truncate block" title={record[col.key] ?? ''}>
                          {record[col.key] || '—'}
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {sorted.length > 0 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 text-xs text-slate-500">
          <span>
            Showing {Math.min((page - 1) * PAGE_SIZE + 1, sorted.length)}–{Math.min(page * PAGE_SIZE, sorted.length)} of {sorted.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1 rounded hover:bg-slate-100 disabled:opacity-30 transition-colors"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="px-2">{page} / {pageCount}</span>
            <button
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              disabled={page === pageCount}
              className="p-1 rounded hover:bg-slate-100 disabled:opacity-30 transition-colors"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
