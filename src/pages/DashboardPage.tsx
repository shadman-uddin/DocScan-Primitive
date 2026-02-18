import { useEffect, useMemo, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useDashboardStore } from '../stores/useDashboardStore';
import { useAppStore } from '../stores/useAppStore';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import DateFilter from '../components/dashboard/DateFilter';
import SummaryCards from '../components/dashboard/SummaryCards';
import SubmissionsChart from '../components/dashboard/SubmissionsChart';
import ApprovalRate from '../components/dashboard/ApprovalRate';
import UserBreakdown from '../components/dashboard/UserBreakdown';
import ConfidenceTrend from '../components/dashboard/ConfidenceTrend';
import RecordsTable from '../components/dashboard/RecordsTable';
import UpdateRequestsPanel from '../components/dashboard/UpdateRequestsPanel';

function loadKpiToggles() {
  try {
    const raw = localStorage.getItem('config_kpiToggles');
    if (raw) return JSON.parse(raw);
  } catch { /* */ }
  return null;
}

const DEFAULT_TOGGLES = {
  submissions: true,
  approval: true,
  users: true,
  confidence: true,
  records: true,
  requests: true,
};

function SecondsAgo({ lastUpdated }: { lastUpdated: Date | null }) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 15000);
    return () => clearInterval(id);
  }, []);
  if (!lastUpdated) return null;
  const diff = Math.round((Date.now() - lastUpdated.getTime()) / 1000);
  if (diff < 10) return <span className="text-xs text-slate-400">Updated just now</span>;
  if (diff < 60) return <span className="text-xs text-slate-400">Updated {diff}s ago</span>;
  return <span className="text-xs text-slate-400">Updated {Math.floor(diff / 60)}m ago</span>;
}

export default function DashboardPage() {
  const { fetchDashboardData, getFilteredRecords, getStats, updateRequests, demoMode, isLoading, lastFetched } =
    useDashboardStore();
  const { theme, confidenceThreshold } = useAppStore();

  const kpiToggles = useMemo(() => ({ ...DEFAULT_TOGGLES, ...(loadKpiToggles() ?? {}) }), []);

  const { isLoading: refreshLoading, lastUpdated, refresh } = useAutoRefresh(
    fetchDashboardData,
    30000
  );

  const records = getFilteredRecords();
  const stats = getStats();

  const loading = isLoading || refreshLoading;

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.backgroundColor }}>
      {demoMode && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs text-amber-700 text-center font-medium">
          Demo Mode — showing sample data. Connect the Cloudflare Worker to see live records.
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-4 space-y-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Dashboard</h1>
            <SecondsAgo lastUpdated={lastUpdated ?? lastFetched} />
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs text-green-600 font-medium">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Live
            </span>
            <button
              onClick={refresh}
              disabled={loading}
              className="p-2 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw size={16} className={`text-slate-500 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <DateFilter />

        <SummaryCards stats={stats} />

        {(kpiToggles.submissions || kpiToggles.approval) && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {kpiToggles.submissions && (
              <div className="md:col-span-3">
                <SubmissionsChart data={stats.submissionsByDay} primaryColor={theme.primaryColor} />
              </div>
            )}
            {kpiToggles.approval && (
              <div className="md:col-span-2">
                <ApprovalRate data={stats.approvalBreakdown} approvalRate={stats.approvalRate} />
              </div>
            )}
          </div>
        )}

        {(kpiToggles.users || kpiToggles.confidence) && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {kpiToggles.users && (
              <div className="md:col-span-2">
                <UserBreakdown data={stats.submissionsByUser} primaryColor={theme.primaryColor} />
              </div>
            )}
            {kpiToggles.confidence && (
              <div className="md:col-span-3">
                <ConfidenceTrend data={stats.confidenceTrend} threshold={confidenceThreshold} />
              </div>
            )}
          </div>
        )}

        {kpiToggles.records && <RecordsTable records={records} />}

        {kpiToggles.requests && (
          <UpdateRequestsPanel requests={updateRequests} />
        )}
      </div>
    </div>
  );
}
