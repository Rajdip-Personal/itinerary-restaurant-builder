// hooks/useItinerary.ts
// React hook wrapping itineraryParser service

import { useState, useCallback } from 'react';
import type { DailyItinerary } from 'types/index';
import { parseItinerary } from 'services/itineraryParser';

export interface UseItineraryReturn {
  itinerary: DailyItinerary | null;
  isLoading: boolean;
  error: string | null;
  parseItineraryText: (text: string, cityName?: string) => Promise<void>;
  clearItinerary: () => void;
}

export function useItinerary(): UseItineraryReturn {
  const [itinerary, setItinerary] = useState<DailyItinerary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parseItineraryText = useCallback(async (text: string, cityName?: string) => {
    if (!text.trim()) {
      setError('Itinerary text cannot be empty');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('[Hook:Itinerary] Parsing itinerary text');
      const result = await parseItinerary(text, cityName);
      setItinerary(result);
      console.log(`[Hook:Itinerary] Parsed ${result.attractions.length} attractions`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to parse itinerary';
      console.log(`[Hook:Itinerary] Error: ${message}`);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearItinerary = useCallback(() => {
    setItinerary(null);
    setError(null);
    setIsLoading(false);
    console.log('[Hook:Itinerary] Cleared');
  }, []);

  return { itinerary, isLoading, error, parseItineraryText, clearItinerary };
}
