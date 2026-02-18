import { FileText, Calendar, Clock, Brain } from 'lucide-react';
import { useDashboardStore, type DashboardStats } from '../../stores/useDashboardStore';
import { useUploadStore } from '../../stores/useUploadStore';

interface CardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub: string;
  accent?: string;
}

function Card({ icon, label, value, sub, accent }: CardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-4 min-w-[140px] flex-shrink-0 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</span>
        <span className={`p-1.5 rounded-lg ${accent ?? 'bg-blue-50 text-blue-700'}`}>{icon}</span>
      </div>
      <div className="text-2xl font-bold text-slate-900 leading-none">{value}</div>
      <div className="text-xs text-slate-400">{sub}</div>
    </div>
  );
}

interface Props {
  stats: DashboardStats;
}

export default function SummaryCards({ stats }: Props) {
  const pendingReviews = useUploadStore((s) => s.getPendingReviews().length);
  const { demoMode } = useDashboardStore();

  const confColor =
    stats.totalRecords === 0
      ? 'bg-slate-50 text-slate-400'
      : stats.approvalRate >= 85
      ? 'bg-green-50 text-green-700'
      : stats.approvalRate >= 70
      ? 'bg-amber-50 text-amber-700'
      : 'bg-red-50 text-red-700';

  const avgConf = stats.confidenceTrend.length > 0
    ? Math.round(
        stats.confidenceTrend.reduce((s, p) => s + (p.avgConfidence || 0), 0) /
        (stats.confidenceTrend.filter((p) => p.avgConfidence > 0).length || 1)
      )
    : 0;

  return (
    <div className="flex gap-3 overflow-x-auto pb-1 snap-x snap-mandatory md:grid md:grid-cols-4 md:overflow-visible">
      <div className="snap-start">
        <Card
          icon={<FileText size={14} />}
          label="Total Records"
          value={demoMode ? stats.totalRecords : stats.totalRecords}
          sub="all time"
          accent="bg-blue-50 text-blue-700"
        />
      </div>
      <div className="snap-start">
        <Card
          icon={<Calendar size={14} />}
          label="Today"
          value={stats.todayCount}
          sub={stats.todayCount > 0 ? 'submitted today' : 'none yet'}
          accent={stats.todayCount > 0 ? 'bg-green-50 text-green-700' : 'bg-slate-50 text-slate-400'}
        />
      </div>
      <div className="snap-start">
        <Card
          icon={<Clock size={14} />}
          label="Pending Review"
          value={pendingReviews}
          sub={pendingReviews > 0 ? 'awaiting review' : 'all clear'}
          accent={pendingReviews > 0 ? 'bg-amber-50 text-amber-700' : 'bg-slate-50 text-slate-400'}
        />
      </div>
      <div className="snap-start">
        <Card
          icon={<Brain size={14} />}
          label="Avg Confidence"
          value={`${avgConf}%`}
          sub="extraction accuracy"
          accent={confColor}
        />
      </div>
    </div>
  );
}
