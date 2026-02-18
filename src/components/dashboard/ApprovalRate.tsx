import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface Props {
  data: { name: string; value: number }[];
  approvalRate: number;
}

const COLORS = ['#16a34a', '#f87171'];

export default function ApprovalRate({ data, approvalRate }: Props) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const hasData = total > 0;

  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <h3 className="text-sm font-semibold text-slate-700 mb-1">Approval Rate</h3>
      <p className="text-xs text-slate-400 mb-3">Approved vs rejected</p>
      <div className="h-48 md:h-64 relative">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="45%"
                innerRadius="45%"
                outerRadius="65%"
                paddingAngle={3}
                dataKey="value"
                startAngle={90}
                endAngle={-270}
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: 12,
                }}
                formatter={(v: number) => [v, '']}
              />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 11, paddingTop: 4 }}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-sm text-slate-400">
            No data
          </div>
        )}
        {hasData && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" style={{ top: '-12px' }}>
            <span className="text-2xl font-bold text-slate-900">{approvalRate}%</span>
            <span className="text-xs text-slate-400">approved</span>
          </div>
        )}
      </div>
    </div>
  );
}
