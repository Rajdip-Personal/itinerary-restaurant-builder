// components/TouristTrapBadge.tsx
// Warning badge for tourist traps

import React from 'react';
import { TOURIST_TRAP_THRESHOLD } from 'utils/constants';

export interface TouristTrapBadgeProps {
  score: number;
  threshold?: number;
}

export function TouristTrapBadge({ score, threshold = TOURIST_TRAP_THRESHOLD }: TouristTrapBadgeProps): React.ReactElement | null {
  if (score < threshold) return null;

  return (
    <span
      className="tourist-trap-badge"
      role="img"
      aria-label={`Tourist trap score: ${score}`}
      title={`Tourist trap score: ${score}/100`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '2px 8px',
        borderRadius: 12,
        fontSize: 11,
        fontFamily: 'Outfit, sans-serif',
        fontWeight: 600,
        backgroundColor: score >= 85 ? '#fecaca' : '#fed7aa',
        color: score >= 85 ? '#991b1b' : '#9a3412',
      }}
    >
      Tourist Trap ({score})
    </span>
  );
}
