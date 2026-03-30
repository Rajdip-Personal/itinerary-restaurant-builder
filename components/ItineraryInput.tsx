// components/ItineraryInput.tsx
// Textarea for pasting itinerary text with parse button

import React, { useState } from 'react';
import { LoadingSpinner } from 'components/LoadingSpinner';
import { ErrorDisplay } from 'components/ErrorDisplay';
import { detectCity } from 'services/itineraryParser';

export interface ItineraryInputProps {
  onParse: (text: string, cityName?: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export function ItineraryInput({ onParse, isLoading, error }: ItineraryInputProps): React.ReactElement {
  const [text, setText] = useState('');
  const detectedCity = text.trim() ? detectCity(text) : '';

  const handleParse = () => {
    if (text.trim() && !isLoading) {
      onParse(text, detectedCity || undefined);
    }
  };

  return (
    <div
      className="itinerary-input"
      style={{
        backgroundColor: 'var(--cream, #f5f0eb)',
        padding: 24,
        borderRadius: 8,
        fontFamily: 'Outfit, sans-serif',
      }}
    >
      <h2
        style={{
          margin: '0 0 12px 0',
          fontFamily: 'Cormorant Garamond, serif',
          fontSize: 28,
          fontWeight: 600,
          color: 'var(--charcoal, #1a1a2e)',
        }}
      >
        Your Itinerary
      </h2>
      <textarea
        className="itinerary-textarea"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste your itinerary here..."
        rows={8}
        disabled={isLoading}
        aria-label="Itinerary text"
        style={{
          width: '100%',
          padding: 12,
          border: '1px solid var(--ochre, #d4a574)',
          borderRadius: 4,
          fontFamily: 'Outfit, sans-serif',
          fontSize: 14,
          resize: 'vertical',
          backgroundColor: 'white',
          boxSizing: 'border-box',
        }}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
        {detectedCity && (
          <span
            className="city-indicator"
            style={{
              fontSize: 13,
              color: 'var(--sage, #8a9a7b)',
              fontWeight: 500,
            }}
          >
            Detected city: {detectedCity}
          </span>
        )}
        <button
          className="parse-button"
          onClick={handleParse}
          disabled={isLoading || !text.trim()}
          style={{
            marginLeft: 'auto',
            padding: '8px 24px',
            backgroundColor: isLoading ? '#ccc' : 'var(--terracotta, #c4704b)',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            fontFamily: 'Outfit, sans-serif',
            fontSize: 14,
            fontWeight: 600,
            cursor: isLoading || !text.trim() ? 'not-allowed' : 'pointer',
          }}
        >
          {isLoading ? 'Parsing...' : 'Parse Itinerary'}
        </button>
      </div>
      {isLoading && (
        <div style={{ marginTop: 12 }}>
          <LoadingSpinner size="small" label="Parsing your itinerary..." />
        </div>
      )}
      {error && (
        <div style={{ marginTop: 12 }}>
          <ErrorDisplay error={error} />
        </div>
      )}
    </div>
  );
}
