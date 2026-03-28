// services/multiCityHandler.ts
// Handle itineraries that span multiple cities in one day

import type {
  DailyItinerary,
  ItinerarySegment,
  MealType,
  RecommendationResult,
  Coordinates,
  HotelLocation,
} from 'types/index';
import { insertMealBreaks } from 'services/mealBreakInserter';

// Forward declaration — will be imported dynamically to avoid circular dependency
let _getRecommendations: ((params: {
  cityId: string;
  coordinates: Coordinates;
  mealType: MealType;
  hotelCoordinates?: Coordinates;
  previousCuisines?: string[];
}) => Promise<RecommendationResult>) | null = null;

async function getRecommendationsFn(params: {
  cityId: string;
  coordinates: Coordinates;
  mealType: MealType;
  hotelCoordinates?: Coordinates;
  previousCuisines?: string[];
}): Promise<RecommendationResult> {
  if (!_getRecommendations) {
    const engine = await import('services/recommendationEngine');
    _getRecommendations = engine.getRecommendations;
  }
  return _getRecommendations(params);
}

/**
 * Detect if an itinerary spans multiple cities.
 */
export function detectMultiCity(itinerary: DailyItinerary): boolean {
  if (itinerary.segments && itinerary.segments.length > 1) return true;

  const cities = new Set<string>();
  for (const attr of itinerary.attractions) {
    if (attr.cityId) cities.add(attr.cityId);
  }
  return cities.size > 1;
}

/**
 * Split an itinerary into city segments.
 * If the itinerary already has segments, return them.
 * Otherwise, group attractions by cityId.
 */
export function splitIntoSegments(itinerary: DailyItinerary): ItinerarySegment[] {
  if (itinerary.segments && itinerary.segments.length > 0) {
    return itinerary.segments;
  }

  // Group attractions by cityId, maintaining order
  const segmentMap = new Map<string, ItinerarySegment>();
  const order: string[] = [];

  for (const attr of itinerary.attractions) {
    const city = attr.cityId || itinerary.cityId;
    if (!segmentMap.has(city)) {
      segmentMap.set(city, {
        cityId: city,
        attractions: [],
        hotelLocation: city === itinerary.cityId ? itinerary.hotelLocation : undefined,
      });
      order.push(city);
    }
    segmentMap.get(city)!.attractions.push(attr);
  }

  return order.map((city) => segmentMap.get(city)!);
}

/**
 * Get meal recommendations for a full day itinerary.
 * For single-city: generate breakfast/lunch/dinner based on meal breaks.
 * For multi-city: generate per-segment recommendations.
 */
export async function getRecommendationsForDay(
  itinerary: DailyItinerary,
  routePoints?: { latitude: number; longitude: number }[],
  hotelLocation?: HotelLocation,
): Promise<Map<MealType, RecommendationResult>> {
  const results = new Map<MealType, RecommendationResult>();

  if (itinerary.attractions.length === 0) return results;

  const isMultiCity = detectMultiCity(itinerary);
  const hotel = hotelLocation || itinerary.hotelLocation;

  if (isMultiCity) {
    console.log('[MultiCity] Multi-city itinerary detected, processing per segment');
    const segments = splitIntoSegments(itinerary);

    for (const segment of segments) {
      const mealBreaks = insertMealBreaks(segment.attractions, segment.cityId);
      for (const mb of mealBreaks) {
        if (results.has(mb.mealType)) continue; // First segment gets priority

        const coords = mb.nearCoordinates || segment.attractions[0]?.coordinates;
        if (!coords) continue;

        const rec = await getRecommendationsFn({
          cityId: segment.cityId,
          coordinates: coords,
          mealType: mb.mealType,
          hotelCoordinates: segment.hotelLocation?.coordinates || hotel?.coordinates,
        });
        results.set(mb.mealType, rec);
      }
    }
  } else {
    console.log('[MultiCity] Single-city itinerary, processing meal breaks');
    const mealBreaks = insertMealBreaks(itinerary.attractions, itinerary.cityId);

    for (const mb of mealBreaks) {
      const coords = mb.nearCoordinates || itinerary.attractions[0]?.coordinates;
      if (!coords) continue;

      const rec = await getRecommendationsFn({
        cityId: itinerary.cityId,
        coordinates: coords,
        mealType: mb.mealType,
        hotelCoordinates: hotel?.coordinates,
      });
      results.set(mb.mealType, rec);
    }
  }

  console.log(`[MultiCity] Generated recommendations for ${results.size} meals`);
  return results;
}
