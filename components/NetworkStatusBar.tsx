// components/NetworkStatusBar.tsx
// Connectivity indicator bar

import React from 'react';

export interface NetworkStatusBarProps {
  isOnline: boolean;
}

export function NetworkStatusBar({ isOnline }: NetworkStatusBarProps): React.ReactElement {
  return (
    <div
      className="network-status-bar"
      role="status"
      aria-label={isOnline ? 'Online' : 'Offline'}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 12px',
        fontSize: 12,
        fontFamily: 'Outfit, sans-serif',
        backgroundColor: isOnline ? 'var(--sage, #8a9a7b)' : 'var(--terracotta, #c4704b)',
        color: 'white',
      }}
    >
      <span
        className="status-dot"
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          backgroundColor: isOnline ? '#4ade80' : '#ef4444',
        }}
      />
      <span className="status-text">{isOnline ? 'Online' : 'Offline'}</span>
    </div>
  );
}
