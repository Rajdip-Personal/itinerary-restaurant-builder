// components/ErrorDisplay.tsx
// Reusable error message display

import React from 'react';

export interface ErrorDisplayProps {
  error: string;
  onRetry?: () => void;
}

export function ErrorDisplay({ error, onRetry }: ErrorDisplayProps): React.ReactElement {
  return (
    <div
      className="error-display"
      role="alert"
      style={{
        padding: '12px 16px',
        borderLeft: '3px solid var(--terracotta, #c4704b)',
        backgroundColor: '#fef2f0',
        fontFamily: 'Outfit, sans-serif',
        fontSize: 14,
        color: 'var(--charcoal, #1a1a2e)',
      }}
    >
      <p className="error-message" style={{ margin: 0 }}>{error}</p>
      {onRetry && (
        <button
          className="error-retry-button"
          onClick={onRetry}
          style={{
            marginTop: 8,
            padding: '4px 12px',
            border: '1px solid var(--terracotta, #c4704b)',
            borderRadius: 4,
            backgroundColor: 'transparent',
            color: 'var(--terracotta, #c4704b)',
            cursor: 'pointer',
            fontFamily: 'Outfit, sans-serif',
            fontSize: 13,
          }}
        >
          Retry
        </button>
      )}
    </div>
  );
}
