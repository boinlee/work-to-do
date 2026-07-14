'use client';

import { getInitials } from '@/lib/utils';

const sizeMap = {
  sm: { width: 28, height: 28, fontSize: 11 },
  md: { width: 36, height: 36, fontSize: 13 },
  lg: { width: 48, height: 48, fontSize: 16 },
};

export default function Avatar({ name, color, size = 'md' }) {
  const dims = sizeMap[size] || sizeMap.md;

  return (
    <div
      style={{
        width: dims.width,
        height: dims.height,
        borderRadius: '50%',
        backgroundColor: color || '#6366f1',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 600,
        fontSize: dims.fontSize,
        flexShrink: 0,
        letterSpacing: '0.02em',
      }}
    >
      {getInitials(name || '?')}
    </div>
  );
}
