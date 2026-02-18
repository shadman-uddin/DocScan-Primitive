import { useState, useEffect } from 'react';
import { ExternalLink, CheckCircle, XCircle, Loader } from 'lucide-react';

interface Props {
  onSaved: () => void;
}

function loadSheetConfig() {
  try {
    const raw = localStorage.getItem('config_sheetTabs');
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export default function SheetConnection({ onSaved }: Props) {
  const [sheetId, setSheetId] = useState(() => localStorage.getItem('config_sheetId') ?? '');
  const [tabs, setTabs] = useState(() => ({
    records: 'Records',
    uploadLog: 'Upload Log',
    updateRequests: 'Update Requests',
    ...(loadSheetConfig() ?? {}),
  }));
  const [testStatus, setTestStatus] = useState<'idle' | 'loading' | 'ok' | 'fail'>('idle');

  useEffect(() => {
    localStorage.setItem('config_sheetId', sheetId);
  }, [sheetId]);

  function handleTabChange(key: string, value: string) {
    const updated = { ...tabs, [key]: value };
    setTabs(updated);
    localStorage.setItem('config_sheetTabs', JSON.stringify(updated));
    onSaved();
  }

  async function testConnection() {
    setTestStatus('loading');
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8787';
      const res = await fetch(`${apiUrl}/api/sheets/records`);
      setTestStatus(res.ok ? 'ok' : 'fail');
    } catch {
      setTestStatus('fail');
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Sheet ID</label>
        <input
          type="text"
          value={sheetId}
          onChange={(e) => { setSheetId(e.target.value); onSaved(); }}
          placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms"
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
        <p className="text-xs text-slate-400 mt-1">
          Find this in the URL: docs.google.com/spreadsheets/d/<strong>THIS_PART</strong>/edit
        </p>
        {sheetId && (
          <a
            href={`https://docs.google.com/spreadsheets/d/${sheetId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 mt-1 font-medium"
          >
            Open Sheet
            <ExternalLink size={11} />
          </a>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { key: 'records', label: 'Records Tab' },
          { key: 'uploadLog', label: 'Upload Log Tab' },
          { key: 'updateRequests', label: 'Update Requests Tab' },
        ].map(({ key, label }) => (
          <div key={key}>
            <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
            <input
              type="text"
              value={tabs[key as keyof typeof tabs]}
              onChange={(e) => handleTabChange(key, e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={testConnection}
          disabled={testStatus === 'loading'}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm rounded-lg font-medium transition-colors disabled:opacity-50"
        >
          {testStatus === 'loading' && <Loader size={13} className="animate-spin" />}
          Test Connection
        </button>
        {testStatus === 'ok' && (
          <span className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
            <CheckCircle size={15} /> Connected
          </span>
        )}
        {testStatus === 'fail' && (
          <span className="flex items-center gap-1.5 text-sm text-red-500 font-medium">
            <XCircle size={15} /> Failed — check Sheet ID and Worker config
          </span>
        )}
      </div>
    </div>
  );
}
