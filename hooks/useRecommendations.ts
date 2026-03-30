// hooks/useRecommendations.ts
// React hook wrapping recommendationEngine service

import { useState, useCallback, useEffect } from 'react';
import type { DailyItinerary, MealType, RecommendationResult, RecommendationSource } from 'types/index';
import { getRecommendations } from 'services/recommendationEngine';

export interface UseRecommendationsReturn {
  recommendations: Map<MealType, RecommendationResult> | null;
  isLoading: boolean;
  error: string | null;
  source: RecommendationSource | null;
  refresh: (mealType?: MealType) => Promise<void>;
}

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner'];

export function useRecommendations(itinerary: DailyItinerary | null): UseRecommendationsReturn {
  const [recommendations, setRecommendations] = useState<Map<MealType, RecommendationResult> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<RecommendationSource | null>(null);

  const generateAll = useCallback(async (itinerary: DailyItinerary) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log(`[Hook:Recommendations] Generating for ${itinerary.cityId}`);
      const results = new Map<MealType, RecommendationResult>();
      const firstAttraction = itinerary.attractions.find((a) => !a.isPlaceholder && a.coordinates);

      if (!firstAttraction?.coordinates) {
        setError('No geocoded attractions available');
        setIsLoading(false);
        return;
      }

      for (const mealType of MEAL_TYPES) {
        const result = await getRecommendations({
          cityId: itinerary.cityId,
          coordinates: firstAttraction.coordinates,
          mealType,
          hotelCoordinates: itinerary.hotelLocation?.coordinates,
        });
        results.set(mealType, result);
      }

      setRecommendations(results);

      // Track primary source from first non-empty result
      for (const result of results.values()) {
        if (result.restaurants.length > 0) {
          setSource(result.source);
          break;
        }
      }

      console.log(`[Hook:Recommendations] Generated ${results.size} meal types`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate recommendations';
      console.log(`[Hook:Recommendations] Error: ${message}`);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (itinerary) {
      generateAll(itinerary);
    } else {
      setRecommendations(null);
      setSource(null);
    }
  }, [itinerary, generateAll]);

  const refresh = useCallback(async (mealType?: MealType) => {
    if (!itinerary) return;

    const firstAttraction = itinerary.attractions.find((a) => !a.isPlaceholder && a.coordinates);
    if (!firstAttraction?.coordinates) return;

    setIsLoading(true);
    setError(null);

    try {
      if (mealType) {
        console.log(`[Hook:Recommendations] Refreshing ${mealType}`);
        const result = await getRecommendations({
          cityId: itinerary.cityId,
          coordinates: firstAttraction.coordinates,
          mealType,
          hotelCoordinates: itinerary.hotelLocation?.coordinates,
          forceRefresh: true,
        });
        setRecommendations((prev) => {
          const updated = new Map(prev ?? []);
          updated.set(mealType, result);
          return updated;
        });
      } else {
        await generateAll(itinerary);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to refresh recommendations';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [itinerary, generateAll]);

  return { recommendations, isLoading, error, source, refresh };
}
