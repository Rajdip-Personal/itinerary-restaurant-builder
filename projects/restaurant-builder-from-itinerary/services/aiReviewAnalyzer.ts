// services/aiReviewAnalyzer.ts
// Generate restaurant insights using AI via backend proxy

import type { Restaurant, RestaurantInsights, TokenUsage } from 'types/index';
import { trackTokenUsage } from 'utils/tokenTracker';

const BACKEND_URL = 'http://localhost:3000';

/**
 * Build an analysis prompt for AI review of a restaurant.
 */
export function buildAnalysisPrompt(restaurant: Restaurant): string {
  const cuisines = restaurant.cuisineTypes.join(', ');
  const dishes = restaurant.famousFor.length > 0
    ? restaurant.famousFor.join(', ')
    : 'none listed';

  return [
    `Analyze this restaurant and provide insights:`,
    `Name: ${restaurant.name}`,
    `City: ${restaurant.cityId}`,
    `Cuisine: ${cuisines}`,
    `Rating: ${restaurant.rating}/5 (${restaurant.reviewCount} reviews)`,
    `Price Level: ${restaurant.priceLevel}/4`,
    `Famous For: ${dishes}`,
    `Address: ${restaurant.address}`,
    ``,
    `Provide: a brief summary, atmosphere description, top 3 dishes, a local tip, and tourist trap score (0-100).`,
  ].join('\n');
}

/**
 * Analyze a single restaurant via the backend AI proxy.
 * Returns RestaurantInsights or null on failure.
 */
export async function analyzeRestaurant(
  restaurant: Restaurant,
): Promise<RestaurantInsights | null> {
  try {
    const prompt = buildAnalysisPrompt(restaurant);
    console.log(`[AIAnalyzer] Analyzing ${restaurant.name}`);

    const response = await fetch(`${BACKEND_URL}/api/ai/analyze-review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reviewText: prompt }),
    });

    if (!response.ok) {
      console.log(`[AIAnalyzer] API error: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = (await response.json()) as { analysis: RestaurantInsights; usage?: TokenUsage };

    if (data.usage) {
      trackTokenUsage(data.usage);
    }

    return data.analysis;
  } catch (error) {
    console.log(`[AIAnalyzer] Error analyzing ${restaurant.name}: ${error}`);
    return null;
  }
}

/**
 * Batch analyze multiple restaurants. Returns a map of restaurantId → insights.
 * Processes sequentially to respect rate limits.
 */
export async function generateInsights(
  restaurants: Restaurant[],
): Promise<Map<string, RestaurantInsights>> {
  const insightsMap = new Map<string, RestaurantInsights>();

  for (const restaurant of restaurants) {
    const insights = await analyzeRestaurant(restaurant);
    if (insights) {
      insightsMap.set(restaurant.id, insights);
    }
  }

  console.log(`[AIAnalyzer] Generated insights for ${insightsMap.size}/${restaurants.length} restaurants`);
  return insightsMap;
}
