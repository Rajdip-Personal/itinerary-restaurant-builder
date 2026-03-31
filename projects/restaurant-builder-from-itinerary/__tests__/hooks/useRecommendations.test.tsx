// __tests__/hooks/useRecommendations.test.tsx
// Tests for useRecommendations hook

import { renderHook, act, waitFor } from '@testing-library/react';
import { useRecommendations } from 'hooks/useRecommendations';
import {
  MOCK_PARSED_ITINERARY,
  MOCK_LUNCH_RESULT,
  MOCK_DINNER_RESULT,
  MOCK_BREAKFAST_RESULT,
} from '__tests__/fixtures/components';
import type { DailyItinerary, RecommendationResult } from 'types/index';

// Mock the recommendation engine service
jest.mock('services/recommendationEngine', () => ({
  getRecommendations: jest.fn(),
}));

import { getRecommendations } from 'services/recommendationEngine';
const mockGetRecommendations = getRecommendations as jest.MockedFunction<typeof getRecommendations>;

describe('useRecommendations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetRecommendations.mockImplementation(async (params) => {
      if (params.mealType === 'breakfast') return MOCK_BREAKFAST_RESULT;
      if (params.mealType === 'lunch') return MOCK_LUNCH_RESULT;
      return MOCK_DINNER_RESULT;
    });
  });

  it('initializes with null recommendations when itinerary is null', () => {
    const { result } = renderHook(() => useRecommendations(null));

    expect(result.current.recommendations).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.source).toBeNull();
  });

  it('generates recommendations for all meal types when itinerary is provided', async () => {
    const { result } = renderHook(() => useRecommendations(MOCK_PARSED_ITINERARY));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.recommendations).not.toBeNull();
    expect(result.current.recommendations!.size).toBe(3);
    expect(result.current.recommendations!.has('breakfast')).toBe(true);
    expect(result.current.recommendations!.has('lunch')).toBe(true);
    expect(result.current.recommendations!.has('dinner')).toBe(true);
    expect(mockGetRecommendations).toHaveBeenCalledTimes(3);
  });

  it('tracks source from first non-empty result', async () => {
    const { result } = renderHook(() => useRecommendations(MOCK_PARSED_ITINERARY));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.source).toBe('manual');
  });

  it('sets error when no geocoded attractions available', async () => {
    const noCoords: DailyItinerary = {
      ...MOCK_PARSED_ITINERARY,
      attractions: MOCK_PARSED_ITINERARY.attractions.map((a) => ({
        ...a,
        coordinates: undefined,
      })),
    };

    const { result } = renderHook(() => useRecommendations(noCoords));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('No geocoded attractions available');
  });

  it('handles recommendation engine errors', async () => {
    mockGetRecommendations.mockRejectedValue(new Error('Engine failure'));

    const { result } = renderHook(() => useRecommendations(MOCK_PARSED_ITINERARY));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Engine failure');
  });

  it('refreshes a single meal type', async () => {
    const { result } = renderHook(() => useRecommendations(MOCK_PARSED_ITINERARY));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    mockGetRecommendations.mockClear();
    const updatedResult: RecommendationResult = {
      ...MOCK_LUNCH_RESULT,
      source: 'ai',
    };
    mockGetRecommendations.mockResolvedValueOnce(updatedResult);

    await act(async () => {
      await result.current.refresh('lunch');
    });

    expect(mockGetRecommendations).toHaveBeenCalledTimes(1);
    expect(mockGetRecommendations).toHaveBeenCalledWith(
      expect.objectContaining({ mealType: 'lunch', forceRefresh: true }),
    );
  });

  it('refreshes all meal types when no mealType specified', async () => {
    const { result } = renderHook(() => useRecommendations(MOCK_PARSED_ITINERARY));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    mockGetRecommendations.mockClear();
    mockGetRecommendations.mockImplementation(async (params) => {
      if (params.mealType === 'breakfast') return MOCK_BREAKFAST_RESULT;
      if (params.mealType === 'lunch') return MOCK_LUNCH_RESULT;
      return MOCK_DINNER_RESULT;
    });

    await act(async () => {
      await result.current.refresh();
    });

    expect(mockGetRecommendations).toHaveBeenCalledTimes(3);
  });

  it('clears recommendations when itinerary becomes null', async () => {
    const { result, rerender } = renderHook(
      ({ itinerary }) => useRecommendations(itinerary),
      { initialProps: { itinerary: MOCK_PARSED_ITINERARY as DailyItinerary | null } },
    );

    await waitFor(() => {
      expect(result.current.recommendations).not.toBeNull();
    });

    rerender({ itinerary: null });

    expect(result.current.recommendations).toBeNull();
    expect(result.current.source).toBeNull();
  });
});
