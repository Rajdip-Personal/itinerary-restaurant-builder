// __tests__/hooks/useRunningLate.test.tsx
// Tests for useRunningLate hook

import { renderHook, act } from '@testing-library/react';
import { useRunningLate } from 'hooks/useRunningLate';
import { MOCK_ENHANCED_LUNCH, MOCK_ENHANCED_LUNCH_2 } from '__tests__/fixtures/components';
import { CLOSING_SOON_RESTAURANT } from '__tests__/fixtures/index';

// Mock the running late service
jest.mock('services/runningLateService', () => ({
  recalculateForDelay: jest.fn(),
  calculateUrgency: jest.fn(),
}));

import { recalculateForDelay, calculateUrgency } from 'services/runningLateService';
const mockRecalculate = recalculateForDelay as jest.MockedFunction<typeof recalculateForDelay>;
const mockCalculateUrgency = calculateUrgency as jest.MockedFunction<typeof calculateUrgency>;

describe('useRunningLate', () => {
  const restaurants = [MOCK_ENHANCED_LUNCH, MOCK_ENHANCED_LUNCH_2];

  beforeEach(() => {
    jest.clearAllMocks();
    mockCalculateUrgency.mockReturnValue('active');
    mockRecalculate.mockImplementation((recs) => [...recs]);
  });

  it('initializes with zero delay and original recommendations', () => {
    const { result } = renderHook(() => useRunningLate(restaurants, '12:30'));

    expect(result.current.delayMinutes).toBe(0);
    expect(result.current.adjustedRecommendations).toEqual(restaurants);
  });

  it('returns null adjustedRecommendations when input is null', () => {
    const { result } = renderHook(() => useRunningLate(null, '12:30'));

    expect(result.current.adjustedRecommendations).toBeNull();
  });

  it('returns null adjustedRecommendations for empty array', () => {
    const { result } = renderHook(() => useRunningLate([], '12:30'));

    expect(result.current.adjustedRecommendations).toBeNull();
  });

  it('calls recalculateForDelay when delay is set', () => {
    mockRecalculate.mockReturnValue([MOCK_ENHANCED_LUNCH]);

    const { result } = renderHook(() => useRunningLate(restaurants, '12:30'));

    act(() => {
      result.current.setDelay(30);
    });

    expect(result.current.delayMinutes).toBe(30);
    expect(mockRecalculate).toHaveBeenCalledWith(restaurants, 30, '12:30');
  });

  it('clamps delay to 0-180 range', () => {
    const { result } = renderHook(() => useRunningLate(restaurants, '12:30'));

    act(() => {
      result.current.setDelay(-10);
    });
    expect(result.current.delayMinutes).toBe(0);

    act(() => {
      result.current.setDelay(300);
    });
    expect(result.current.delayMinutes).toBe(180);
  });

  it('calculates urgency states for all restaurants', () => {
    mockCalculateUrgency
      .mockReturnValueOnce('active')
      .mockReturnValueOnce('closing_soon');

    const { result } = renderHook(() => useRunningLate(restaurants, '14:00'));

    expect(result.current.urgencyStates.size).toBe(2);
    expect(result.current.urgencyStates.get(MOCK_ENHANCED_LUNCH.id)).toBe('active');
    expect(result.current.urgencyStates.get(MOCK_ENHANCED_LUNCH_2.id)).toBe('closing_soon');
  });
});
