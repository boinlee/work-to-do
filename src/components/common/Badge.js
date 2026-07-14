'use client';

import { getPriorityColor, getStatusLabel, getStatusColor } from '@/lib/utils';

export default function Badge({ variant = 'priority', value, color }) {
  if (variant === 'priority') {
    const colors = getPriorityColor(value);
    const label = value === 'high' ? '높음' : value === 'medium' ? '중간' : '낮음';
    return (
      <span
        className="badge"
        style={{
          backgroundColor: colors.bg,
          color: colors.text,
          border: `1px solid ${colors.border}`,
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            backgroundColor: colors.text,
            flexShrink: 0,
          }}
        />
        {label}
      </span>
    );
  }

  if (variant === 'label') {
    const c = color || '#6366f1';
    return (
      <span
        className="badge"
        style={{
          backgroundColor: c + '20',
          color: c,
          border: `1px solid ${c}40`,
        }}
      >
        {value}
      </span>
    );
  }

  if (variant === 'status') {
    const colors = getStatusColor(value);
    return (
      <span
        className="badge"
        style={{
          backgroundColor: colors.bg,
          color: colors.text,
        }}
      >
        {getStatusLabel(value)}
      </span>
    );
  }

  return null;
}
