// components/MealSection.tsx
// Display recommendations for a single meal

import React from 'react';
import type { MealType, RecommendationResult } from 'types/index';
import { RestaurantCard } from 'components/RestaurantCard';

export interface MealSectionProps {
  mealType: MealType;
  recommendations: RecommendationResult;
  onRefresh: () => void;
}

const mealLabels: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
};

const sourceBadgeColors: Record<string, { bg: string; fg: string }> = {
  manual: { bg: '#dcfce7', fg: '#166534' },
  cache: { bg: '#dbeafe', fg: '#1e40af' },
  ai: { bg: '#fae8ff', fg: '#86198f' },
  stale_cache: { bg: '#fef3c7', fg: '#92400e' },
};

export function MealSection({ mealType, recommendations, onRefresh }: MealSectionProps): React.ReactElement {
  const colors = sourceBadgeColors[recommendations.source] ?? sourceBadgeColors.manual;

  return (
    <section className="meal-section" style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <h2
          className="meal-header"
          style={{
            margin: 0,
            fontFamily: 'Cormorant Garamond, serif',
            fontSize: 24,
            fontWeight: 600,
            color: 'var(--charcoal, #1a1a2e)',
          }}
        >
          {mealLabels[mealType]}
        </h2>
        <span
          className="source-badge"
          style={{
            padding: '2px 8px',
            borderRadius: 12,
            fontSize: 11,
            fontFamily: 'Outfit, sans-serif',
            fontWeight: 600,
            backgroundColor: colors.bg,
            color: colors.fg,
          }}
        >
          {recommendations.source}
        </span>
        <button
          className="refresh-button"
          onClick={onRefresh}
          aria-label={`Refresh ${mealLabels[mealType]} recommendations`}
          style={{
            marginLeft: 'auto',
            padding: '4px 12px',
            border: '1px solid var(--ochre, #d4a574)',
            borderRadius: 4,
            backgroundColor: 'transparent',
            color: 'var(--ochre, #d4a574)',
            cursor: 'pointer',
            fontFamily: 'Outfit, sans-serif',
            fontSize: 12,
          }}
        >
          Refresh
        </button>
      </div>
      <div className="restaurant-list" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {recommendations.restaurants.length === 0 ? (
          <p style={{ fontFamily: 'Outfit, sans-serif', color: '#666', fontSize: 14 }}>
            No recommendations available for this meal.
          </p>
        ) : (
          recommendations.restaurants.map((r) => (
            <RestaurantCard key={r.id} restaurant={r} />
          ))
        )}
      </div>
    </section>
  );
}
