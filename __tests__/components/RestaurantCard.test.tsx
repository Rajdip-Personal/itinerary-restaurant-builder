// __tests__/components/RestaurantCard.test.tsx
// Tests for RestaurantCard component

import React from 'react';
import { render, screen } from '@testing-library/react';
import { RestaurantCard } from 'components/RestaurantCard';
import {
  MOCK_ENHANCED_LUNCH,
  MOCK_TOURIST_TRAP_ENHANCED,
} from '__tests__/fixtures/components';
import type { EnhancedRestaurant } from 'types/index';

describe('RestaurantCard', () => {
  it('renders restaurant name', () => {
    render(<RestaurantCard restaurant={MOCK_ENHANCED_LUNCH} />);
    expect(screen.getByText(MOCK_ENHANCED_LUNCH.name)).toBeTruthy();
  });

  it('renders rating with one decimal place', () => {
    render(<RestaurantCard restaurant={MOCK_ENHANCED_LUNCH} />);
    expect(screen.getByText(`${MOCK_ENHANCED_LUNCH.rating.toFixed(1)} stars`)).toBeTruthy();
  });

  it('renders context score', () => {
    render(<RestaurantCard restaurant={MOCK_ENHANCED_LUNCH} />);
    expect(screen.getByText(String(MOCK_ENHANCED_LUNCH.contextScore))).toBeTruthy();
  });

  it('renders cuisine types', () => {
    render(<RestaurantCard restaurant={MOCK_ENHANCED_LUNCH} />);
    expect(screen.getByText(MOCK_ENHANCED_LUNCH.cuisineTypes.join(', '))).toBeTruthy();
  });

  it('renders walking time from route context', () => {
    render(<RestaurantCard restaurant={MOCK_ENHANCED_LUNCH} />);
    expect(screen.getByText(`${MOCK_ENHANCED_LUNCH.routeContext.walkTime} min walk`)).toBeTruthy();
  });

  it('renders route fit description', () => {
    render(<RestaurantCard restaurant={MOCK_ENHANCED_LUNCH} />);
    expect(screen.getByText(MOCK_ENHANCED_LUNCH.routeContext.routeFit)).toBeTruthy();
  });

  it('shows tourist trap badge when score exceeds threshold', () => {
    render(<RestaurantCard restaurant={MOCK_TOURIST_TRAP_ENHANCED} />);
    expect(screen.getByText(/Tourist Trap/)).toBeTruthy();
  });

  it('does not show tourist trap badge for low-score restaurants', () => {
    render(<RestaurantCard restaurant={MOCK_ENHANCED_LUNCH} />);
    expect(screen.queryByText(/Tourist Trap/)).toBeNull();
  });

  it('renders reservation urgency when present', () => {
    const withUrgency: EnhancedRestaurant = {
      ...MOCK_ENHANCED_LUNCH,
      reservationUrgency: {
        level: 'essential',
        leadDays: 3,
        message: 'Book 3 days ahead',
      },
    };
    render(<RestaurantCard restaurant={withUrgency} />);
    expect(screen.getByText('Book 3 days ahead')).toBeTruthy();
  });

  it('renders time warning when present', () => {
    const withWarning: EnhancedRestaurant = {
      ...MOCK_ENHANCED_LUNCH,
      timeWarning: 'Closes in 20 minutes',
    };
    render(<RestaurantCard restaurant={withWarning} />);
    expect(screen.getByText('Closes in 20 minutes')).toBeTruthy();
  });

  it('renders score breakdown when available', () => {
    render(<RestaurantCard restaurant={MOCK_ENHANCED_LUNCH} />);
    expect(screen.getByText(/Score:/)).toBeTruthy();
  });
});
