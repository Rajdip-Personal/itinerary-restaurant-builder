// __tests__/services/aiReviewAnalyzer.test.ts
// Tests for AI review analysis service — mock backend proxy

import {
  analyzeRestaurant,
  generateInsights,
  buildAnalysisPrompt,
} from 'services/aiReviewAnalyzer';
import {
  PARIS_RESTAURANTS,
  ROME_RESTAURANTS,
  MOCK_AI_INSIGHTS_RESPONSE,
  MOCK_TOKEN_USAGE,
} from '__tests__/fixtures/index';

// Mock global fetch for backend proxy calls
const mockFetch = jest.fn() as jest.MockedFunction<typeof global.fetch>;
global.fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockReset();
});

describe('buildAnalysisPrompt', () => {
  it('includes restaurant name in prompt', () => {
    const prompt = buildAnalysisPrompt(PARIS_RESTAURANTS[0]);
    expect(prompt).toContain(PARIS_RESTAURANTS[0].name);
  });

  it('includes cuisine types in prompt', () => {
    const prompt = buildAnalysisPrompt(PARIS_RESTAURANTS[0]);
    for (const cuisine of PARIS_RESTAURANTS[0].cuisineTypes) {
      expect(prompt).toContain(cuisine);
    }
  });

  it('includes rating in prompt', () => {
    const prompt = buildAnalysisPrompt(PARIS_RESTAURANTS[0]);
    expect(prompt).toContain(String(PARIS_RESTAURANTS[0].rating));
  });

  it('includes famous dishes when available', () => {
    const prompt = buildAnalysisPrompt(PARIS_RESTAURANTS[0]);
    for (const dish of PARIS_RESTAURANTS[0].famousFor) {
      expect(prompt).toContain(dish);
    }
  });
});

describe('analyzeRestaurant', () => {
  it('returns RestaurantInsights on successful API call', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        analysis: MOCK_AI_INSIGHTS_RESPONSE,
        usage: MOCK_TOKEN_USAGE,
      }),
    } as any);

    const result = await analyzeRestaurant(PARIS_RESTAURANTS[0]);
    expect(result).not.toBeNull();
    expect(result!.summary).toBe(MOCK_AI_INSIGHTS_RESPONSE.summary);
    expect(result!.bestDishes).toEqual(MOCK_AI_INSIGHTS_RESPONSE.bestDishes);
  });

  it('returns null on API failure', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    } as any);

    const result = await analyzeRestaurant(PARIS_RESTAURANTS[0]);
    expect(result).toBeNull();
  });

  it('returns null on network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const result = await analyzeRestaurant(PARIS_RESTAURANTS[0]);
    expect(result).toBeNull();
  });

  it('calls the correct backend proxy endpoint', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        analysis: MOCK_AI_INSIGHTS_RESPONSE,
        usage: MOCK_TOKEN_USAGE,
      }),
    } as any);

    await analyzeRestaurant(PARIS_RESTAURANTS[0]);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const url = mockFetch.mock.calls[0][0];
    expect(url).toContain('/api/ai/analyze-review');
  });
});

describe('generateInsights', () => {
  it('returns a map of restaurant ID to insights', async () => {
    const restaurants = PARIS_RESTAURANTS.slice(0, 2);
    for (const _r of restaurants) {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          analysis: MOCK_AI_INSIGHTS_RESPONSE,
          usage: MOCK_TOKEN_USAGE,
        }),
      } as any);
    }

    const insightsMap = await generateInsights(restaurants);
    expect(insightsMap.size).toBe(2);
    expect(insightsMap.has(restaurants[0].id)).toBe(true);
    expect(insightsMap.has(restaurants[1].id)).toBe(true);
  });

  it('handles partial failures gracefully', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          analysis: MOCK_AI_INSIGHTS_RESPONSE,
          usage: MOCK_TOKEN_USAGE,
        }),
      } as any)
      .mockRejectedValueOnce(new Error('API error'));

    const insightsMap = await generateInsights(PARIS_RESTAURANTS.slice(0, 2));
    // First succeeded, second failed — map should have 1 entry
    expect(insightsMap.size).toBe(1);
  });

  it('returns empty map for empty input', async () => {
    const insightsMap = await generateInsights([]);
    expect(insightsMap.size).toBe(0);
  });
});
