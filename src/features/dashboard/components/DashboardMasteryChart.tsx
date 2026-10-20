import { AreaChart, Area, ResponsiveContainer, CartesianGrid, YAxis, Tooltip } from 'recharts';

export interface DashboardMasteryChartProps {
  data: Array<{ name?: number; day?: string; score: number; topic?: string }>;
}

export default function DashboardMasteryChart({ data }: DashboardMasteryChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 5, right: 0, left: -24, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
        <YAxis
          dataKey="score"
          domain={[0, 100]}
          ticks={[0, 50, 100]}
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
        />
        <Tooltip
          contentStyle={{
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-surface-raised)',
            boxShadow: 'var(--shadow-md)',
          }}
          labelStyle={{ color: 'var(--color-text-muted)', fontSize: 12, marginBottom: 4 }}
          itemStyle={{ color: 'var(--color-text-primary)', fontSize: 14, fontWeight: 600 }}
          formatter={(val: any) => [`${val}%`, 'Score']}
          labelFormatter={(_, payload) => payload?.[0]?.payload?.topic || 'Session'}
        />
        <Area
          type="monotone"
          dataKey="score"
          stroke="var(--color-primary)"
          strokeWidth={2}
          fillOpacity={0.12}
          fill="var(--color-primary)"
          dot={{ r: 3, fill: 'var(--color-surface-0)', stroke: 'var(--color-primary)', strokeWidth: 2 }}
          activeDot={{ r: 5 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
