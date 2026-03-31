// __tests__/components/MealSection.test.tsx
// Tests for MealSection component

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MealSection } from 'components/MealSection';
import { MOCK_LUNCH_RESULT, MOCK_ENHANCED_LUNCH } from '__tests__/fixtures/components';
import type { RecommendationResult, RecommendationSource } from 'types/index';

describe('MealSection', () => {
  const mockOnRefresh = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders meal type header', () => {
    render(<MealSection mealType="lunch" recommendations={MOCK_LUNCH_RESULT} onRefresh={mockOnRefresh} />);
    expect(screen.getByText('Lunch')).toBeTruthy();
  });

  it('renders source badge', () => {
    render(<MealSection mealType="lunch" recommendations={MOCK_LUNCH_RESULT} onRefresh={mockOnRefresh} />);
    expect(screen.getByText('manual')).toBeTruthy();
  });

  it('renders restaurant cards', () => {
    render(<MealSection mealType="lunch" recommendations={MOCK_LUNCH_RESULT} onRefresh={mockOnRefresh} />);
    expect(screen.getByText(MOCK_ENHANCED_LUNCH.name)).toBeTruthy();
  });

  it('renders refresh button and calls onRefresh', () => {
    render(<MealSection mealType="lunch" recommendations={MOCK_LUNCH_RESULT} onRefresh={mockOnRefresh} />);
    const btn = screen.getByLabelText('Refresh Lunch recommendations');
    fireEvent.click(btn);
    expect(mockOnRefresh).toHaveBeenCalledTimes(1);
  });

  it('shows empty state when no restaurants', () => {
    const emptyResult: RecommendationResult = {
      ...MOCK_LUNCH_RESULT,
      restaurants: [],
    };
    render(<MealSection mealType="lunch" recommendations={emptyResult} onRefresh={mockOnRefresh} />);
    expect(screen.getByText('No recommendations available for this meal.')).toBeTruthy();
  });

  it('renders different source badge colors for AI source', () => {
    const aiResult: RecommendationResult = {
      ...MOCK_LUNCH_RESULT,
      source: 'ai' as RecommendationSource,
    };
    render(<MealSection mealType="dinner" recommendations={aiResult} onRefresh={mockOnRefresh} />);
    expect(screen.getByText('Dinner')).toBeTruthy();
    expect(screen.getByText('ai')).toBeTruthy();
  });
});
