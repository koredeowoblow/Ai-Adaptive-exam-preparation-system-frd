import * as React from 'react';

interface StatTileProps {
  value: string | number;
  label: string;
  sub?: string;
}

/**
 * StatTile - compact tertiary metric display.
 * Used in Dashboard and Analytics.
 * No border, no background - relies on surrounding whitespace for hierarchy.
 */
export const StatTile: React.FC<StatTileProps> = React.memo(({ value, label, sub }) => (
  <div className="stat-card">
    <div className="stat-number">{value}</div>
    <div className="stat-label">{label}</div>
    {sub && (
      <div style={{ fontSize: 'var(--font-size-12)', color: 'var(--color-text-muted)', marginTop: 'var(--space-8)' }}>
        {sub}
      </div>
    )}
  </div>
));
