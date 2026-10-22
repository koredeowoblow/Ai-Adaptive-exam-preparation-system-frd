export interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number | string;
    stroke?: string;
    fill?: string;
  }>;
  label?: string;
}

export const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          background: 'var(--color-surface-0)',
          padding: '10px 14px',
          border: '1px solid var(--color-border)',
          borderRadius: 10,
          boxShadow: 'var(--shadow-md)',
        }}
      >
        <p
          style={{
            fontSize: '0.8rem',
            fontWeight: 600,
            color: 'var(--color-text-secondary)',
            marginBottom: 4,
          }}
        >
          {label}
        </p>
        {payload.map((p) => (
          <p
            key={p.name}
            style={{
              fontSize: '0.95rem',
              fontWeight: 700,
              color: p.stroke || p.fill || 'var(--color-primary)',
              margin: 0,
            }}
          >
            {p.value}
            {p.name === 'Frequency' ? ' sessions' : '%'}
          </p>
        ))}
      </div>
    );
  }
  return null;
};
