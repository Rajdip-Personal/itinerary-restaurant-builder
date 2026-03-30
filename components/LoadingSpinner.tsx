// components/LoadingSpinner.tsx
// Reusable loading indicator with editorial design aesthetic

import React from 'react';

export interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  label?: string;
}

const sizeMap = { small: 20, medium: 32, large: 48 };

export function LoadingSpinner({ size = 'medium', label }: LoadingSpinnerProps): React.ReactElement {
  const px = sizeMap[size];
  return (
    <div
      className="loading-spinner"
      role="status"
      aria-label={label ?? 'Loading'}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}
    >
      <div
        className="spinner-ring"
        style={{
          width: px,
          height: px,
          border: `2px solid var(--cream, #f5f0eb)`,
          borderTopColor: `var(--terracotta, #c4704b)`,
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      {label && (
        <span
          className="spinner-label"
          style={{ fontFamily: 'Outfit, sans-serif', fontSize: 14, color: 'var(--charcoal, #1a1a2e)' }}
        >
          {label}
        </span>
      )}
    </div>
  );
}
