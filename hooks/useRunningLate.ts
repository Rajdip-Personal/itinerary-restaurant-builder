// hooks/useRunningLate.ts
// React hook wrapping runningLateService

import { useState, useMemo, useCallback } from 'react';
import type { EnhancedRestaurant, UrgencyState } from 'types/index';
import { recalculateForDelay, calculateUrgency } from 'services/runningLateService';

export interface UseRunningLateReturn {
  adjustedRecommendations: EnhancedRestaurant[] | null;
  delayMinutes: number;
  setDelay: (minutes: number) => void;
  urgencyStates: Map<string, UrgencyState>;
}

export function useRunningLate(
  recommendations: EnhancedRestaurant[] | null,
  currentTime: string,
): UseRunningLateReturn {
  const [delayMinutes, setDelayMinutes] = useState(0);

  const setDelay = useCallback((minutes: number) => {
    const clamped = Math.max(0, Math.min(180, minutes));
    console.log(`[Hook:RunningLate] Delay set to ${clamped} minutes`);
    setDelayMinutes(clamped);
  }, []);

  const adjustedRecommendations = useMemo(() => {
    if (!recommendations || recommendations.length === 0) return null;
    if (delayMinutes === 0) return recommendations;

    console.log(`[Hook:RunningLate] Recalculating for ${delayMinutes}min delay`);
    return recalculateForDelay(recommendations, delayMinutes, currentTime);
  }, [recommendations, delayMinutes, currentTime]);

  const urgencyStates = useMemo(() => {
    const states = new Map<string, UrgencyState>();
    const source = adjustedRecommendations ?? recommendations;
    if (!source) return states;

    for (const restaurant of source) {
      states.set(restaurant.id, calculateUrgency(restaurant, currentTime));
    }
    return states;
  }, [adjustedRecommendations, recommendations, currentTime]);

  return { adjustedRecommendations, delayMinutes, setDelay, urgencyStates };
}
