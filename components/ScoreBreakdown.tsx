// components/ScoreBreakdown.tsx
// Visual breakdown of restaurant score

import React from 'react';
import type { ScoreBreakdown as ScoreBreakdownType } from 'types/index';

export interface ScoreBreakdownProps {
  breakdown: ScoreBreakdownType;
}

interface ScoreSegment {
  label: string;
  value: number;
  max: number;
  color: string;
}

export function ScoreBreakdown({ breakdown }: ScoreBreakdownProps): React.ReactElement {
  const segments: ScoreSegment[] = [
    { label: 'Quality', value: breakdown.quality, max: 25, color: '#3b82f6' },
    { label: 'Authenticity', value: breakdown.authenticity, max: 20, color: '#22c55e' },
    { label: 'Convenience', value: breakdown.convenience, max: 43, color: '#f97316' },
    { label: 'Timing', value: breakdown.timing, max: 15, color: '#eab308' },
    { label: 'Curation', value: breakdown.curation, max: 5, color: '#a855f7' },
  ];

  return (
    <div
      className="score-breakdown"
      style={{ fontFamily: 'Outfit, sans-serif', fontSize: 12 }}
    >
      <div
        className="score-total"
        style={{
          fontWeight: 600,
          fontSize: 14,
          marginBottom: 8,
          color: 'var(--charcoal, #1a1a2e)',
        }}
      >
        Score: {breakdown.total}/110
      </div>
      {segments.map((seg) => (
        <div
          key={seg.label}
          className="score-segment"
          style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}
        >
          <span style={{ width: 80, color: '#666' }}>{seg.label}</span>
          <div
            className="score-bar-bg"
            style={{
              flex: 1,
              height: 6,
              backgroundColor: '#e5e7eb',
              borderRadius: 3,
              overflow: 'hidden',
            }}
          >
            <div
              className="score-bar-fill"
              data-testid={`bar-${seg.label.toLowerCase()}`}
              style={{
                width: `${(seg.value / seg.max) * 100}%`,
                height: '100%',
                backgroundColor: seg.color,
                borderRadius: 3,
              }}
            />
          </div>
          <span style={{ width: 40, textAlign: 'right', color: '#666' }}>
            {seg.value}/{seg.max}
          </span>
        </div>
      ))}
    </div>
  );
}
