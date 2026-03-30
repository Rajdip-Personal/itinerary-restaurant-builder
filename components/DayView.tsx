// components/DayView.tsx
// Main daily view showing timeline + meals

import React from 'react';
import type { DailyItinerary, MealType, RecommendationResult } from 'types/index';
import { MealSection } from 'components/MealSection';

export interface DayViewProps {
  itinerary: DailyItinerary;
  recommendations: Map<MealType, RecommendationResult>;
  onRefreshMeal?: (mealType: MealType) => void;
}

const MEAL_ORDER: MealType[] = ['breakfast', 'lunch', 'dinner'];

export function DayView({ itinerary, recommendations, onRefreshMeal }: DayViewProps): React.ReactElement {
  const nonPlaceholderAttractions = itinerary.attractions.filter((a) => !a.isPlaceholder);

  return (
    <div
      className="day-view"
      style={{ fontFamily: 'Outfit, sans-serif' }}
    >
      <header style={{ marginBottom: 24 }}>
        <h1
          className="day-title"
          style={{
            margin: 0,
            fontFamily: 'Cormorant Garamond, serif',
            fontSize: 32,
            fontWeight: 600,
            color: 'var(--charcoal, #1a1a2e)',
          }}
        >
          {itinerary.cityId.charAt(0).toUpperCase() + itinerary.cityId.slice(1)} — {itinerary.date}
        </h1>
        <p style={{ margin: '4px 0 0', fontSize: 14, color: '#666' }}>
          {nonPlaceholderAttractions.length} attractions planned
        </p>
      </header>

      <section className="attractions-timeline" style={{ marginBottom: 24 }}>
        <h2
          style={{
            fontFamily: 'Cormorant Garamond, serif',
            fontSize: 20,
            fontWeight: 600,
            color: 'var(--charcoal, #1a1a2e)',
            marginBottom: 12,
          }}
        >
          Timeline
        </h2>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {nonPlaceholderAttractions.map((attr) => (
            <li
              key={attr.id}
              className="timeline-item"
              style={{
                display: 'flex',
                gap: 12,
                padding: '8px 0',
                borderBottom: '1px solid #f0f0f0',
                fontSize: 14,
              }}
            >
              <span className="timeline-time" style={{ fontWeight: 600, minWidth: 80, color: 'var(--terracotta, #c4704b)' }}>
                {attr.estimatedTime}
              </span>
              <span className="timeline-name">{attr.name}</span>
              <span style={{ marginLeft: 'auto', color: '#999', fontSize: 12 }}>
                {attr.estimatedDuration} min
              </span>
            </li>
          ))}
        </ul>
      </section>

      {MEAL_ORDER.map((mealType) => {
        const result = recommendations.get(mealType);
        if (!result) return null;
        return (
          <MealSection
            key={mealType}
            mealType={mealType}
            recommendations={result}
            onRefresh={() => onRefreshMeal?.(mealType)}
          />
        );
      })}
    </div>
  );
}
