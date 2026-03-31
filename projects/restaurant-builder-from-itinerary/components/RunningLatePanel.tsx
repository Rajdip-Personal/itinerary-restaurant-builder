// components/RunningLatePanel.tsx
// Delay input and adjusted recommendations panel

import React from 'react';

export interface RunningLatePanelProps {
  onDelayChange: (minutes: number) => void;
  delay: number;
}

export function RunningLatePanel({ onDelayChange, delay }: RunningLatePanelProps): React.ReactElement {
  return (
    <div
      className="running-late-panel"
      style={{
        padding: 16,
        backgroundColor: '#fffbeb',
        borderRadius: 8,
        border: '1px solid var(--ochre, #d4a574)',
        fontFamily: 'Outfit, sans-serif',
      }}
    >
      <h3
        style={{
          margin: '0 0 8px 0',
          fontFamily: 'Cormorant Garamond, serif',
          fontSize: 20,
          color: 'var(--charcoal, #1a1a2e)',
        }}
      >
        Running Late?
      </h3>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <input
          type="range"
          className="delay-slider"
          min={0}
          max={180}
          step={5}
          value={delay}
          onChange={(e) => onDelayChange(Number(e.target.value))}
          aria-label="Delay in minutes"
          style={{ flex: 1 }}
        />
        <span
          className="delay-display"
          style={{ minWidth: 60, textAlign: 'center', fontWeight: 600, fontSize: 14 }}
        >
          {delay} min
        </span>
      </div>
      {delay > 0 && (
        <p className="delay-message" style={{ margin: '8px 0 0', fontSize: 13, color: '#92400e' }}>
          Recommendations adjusted for {delay}-minute delay.
        </p>
      )}
    </div>
  );
}
