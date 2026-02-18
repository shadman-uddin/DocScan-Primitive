import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import type { ConfidencePoint } from '../../stores/useDashboardStore';

interface Props {
  data: ConfidencePoint[];
  threshold: number;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export default function ConfidenceTrend({ data, threshold }: Props) {
  const thresholdPct = Math.round(threshold * 100);
  const filtered = data.filter((_, i) => i % Math.max(1, Math.floor(data.length / 10)) === 0);

  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <h3 className="text-sm font-semibold text-slate-700 mb-1">Confidence Trend</h3>
      <p className="text-xs text-slate-400 mb-3">Average extraction confidence per day</p>
      <div className="h-48 md:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              ticks={filtered.map((d) => d.date)}
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v}%`}
            />
            <ReferenceLine
              y={thresholdPct}
              stroke="#f87171"
              strokeDasharray="4 4"
              label={{ value: `Threshold ${thresholdPct}%`, position: 'right', fontSize: 9, fill: '#f87171' }}
            />
            <Tooltip
              contentStyle={{
                background: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: 12,
              }}
              labelFormatter={(l) => {
                const d = new Date(l + 'T00:00:00');
                return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              }}
              formatter={(v: number) => [`${v}%`, 'Avg Confidence']}
            />
            <Line
              type="monotone"
              dataKey="avgConfidence"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#f59e0b' }}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
