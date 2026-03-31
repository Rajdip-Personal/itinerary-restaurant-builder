// components/RestaurantCard.tsx
// Individual restaurant recommendation card

import React from 'react';
import type { EnhancedRestaurant } from 'types/index';
import { ScoreBreakdown } from 'components/ScoreBreakdown';
import { TouristTrapBadge } from 'components/TouristTrapBadge';

export interface RestaurantCardProps {
  restaurant: EnhancedRestaurant;
}

const priceLevelLabels = ['', '$', '$$', '$$$', '$$$$'];

export function RestaurantCard({ restaurant }: RestaurantCardProps): React.ReactElement {
  return (
    <div
      className="restaurant-card"
      style={{
        backgroundColor: 'white',
        borderRadius: 8,
        padding: 16,
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        fontFamily: 'Outfit, sans-serif',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h3
            className="restaurant-name"
            style={{
              margin: 0,
              fontSize: 18,
              fontFamily: 'Cormorant Garamond, serif',
              fontWeight: 600,
              color: 'var(--charcoal, #1a1a2e)',
            }}
          >
            {restaurant.name}
          </h3>
          <div className="restaurant-meta" style={{ display: 'flex', gap: 8, marginTop: 4, fontSize: 13, color: '#666' }}>
            <span className="restaurant-rating">{restaurant.rating.toFixed(1)} stars</span>
            <span>{priceLevelLabels[restaurant.priceLevel] || ''}</span>
            <span>{restaurant.cuisineTypes.join(', ')}</span>
          </div>
        </div>
        <span
          className="restaurant-score"
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: 'var(--terracotta, #c4704b)',
          }}
        >
          {restaurant.contextScore}
        </span>
      </div>

      {restaurant.insights?.touristTrapScore !== undefined && (
        <div style={{ marginTop: 8 }}>
          <TouristTrapBadge score={restaurant.insights.touristTrapScore} />
        </div>
      )}

      <div className="restaurant-route" style={{ marginTop: 8, fontSize: 13, color: '#666' }}>
        <span className="walk-time">{restaurant.routeContext.walkTime} min walk</span>
        <span> — </span>
        <span className="route-fit">{restaurant.routeContext.routeFit}</span>
      </div>

      {restaurant.reservationUrgency && (
        <div
          className="reservation-urgency"
          style={{
            marginTop: 8,
            fontSize: 12,
            color: restaurant.reservationUrgency.level === 'essential' ? '#dc2626' : '#d97706',
          }}
        >
          {restaurant.reservationUrgency.message}
        </div>
      )}

      {restaurant.timeWarning && (
        <div className="time-warning" style={{ marginTop: 4, fontSize: 12, color: '#dc2626' }}>
          {restaurant.timeWarning}
        </div>
      )}

      {restaurant.scoreBreakdown && (
        <div style={{ marginTop: 12 }}>
          <ScoreBreakdown breakdown={restaurant.scoreBreakdown} />
        </div>
      )}
    </div>
  );
}
