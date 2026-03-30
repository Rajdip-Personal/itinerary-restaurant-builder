// __tests__/services/itineraryParser.test.ts
// Tests for itinerary parser — AI parsing, local fallback, city detection

import {
  parseItinerary,
  parseItineraryLocal,
  detectCity,
} from 'services/itineraryParser';
import {
  MOCK_AI_PARSE_RESPONSE,
  MOCK_TOKEN_USAGE,
  PARIS_ITINERARY_TEXT,
  MULTI_CITY_ITINERARY_TEXT,
  FIXED_TIMESTAMPS,
} from '__tests__/fixtures/index';

// Mock global fetch for backend proxy calls
const mockFetch = jest.fn() as jest.MockedFunction<typeof global.fetch>;
global.fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockReset();
});

describe('detectCity', () => {
  it('detects paris from text', () => {
    expect(detectCity('Day in Paris visiting the Louvre')).toBe('paris');
  });

  it('detects rome from text', () => {
    expect(detectCity('Exploring Rome and the Colosseum')).toBe('rome');
  });

  it('detects venice from text', () => {
    expect(detectCity('A morning in Venice at San Marco')).toBe('venice');
  });

  it('is case-insensitive', () => {
    expect(detectCity('PARIS day trip')).toBe('paris');
    expect(detectCity('Visit ROME')).toBe('rome');
  });

  it('returns first detected city when multiple present', () => {
    const city = detectCity('From Venice to Rome by train');
    expect(['venice', 'rome']).toContain(city);
  });

  it('returns empty string when no city detected', () => {
    expect(detectCity('A lovely day at the museum')).toBe('');
  });
});

describe('parseItineraryLocal', () => {
  it('extracts attractions with times from text', () => {
    const result = parseItineraryLocal(PARIS_ITINERARY_TEXT);
    expect(result.attractions.length).toBeGreaterThan(0);
  });

  it('detects city from itinerary text', () => {
    const result = parseItineraryLocal(PARIS_ITINERARY_TEXT);
    expect(result.cityId).toBe('paris');
  });

  it('parses time values from lines', () => {
    const result = parseItineraryLocal(PARIS_ITINERARY_TEXT);
    const firstAttraction = result.attractions[0];
    expect(firstAttraction.estimatedTime).toBeDefined();
    expect(firstAttraction.estimatedTime.length).toBeGreaterThan(0);
  });

  it('handles empty input', () => {
    const result = parseItineraryLocal('');
    expect(result.attractions).toEqual([]);
  });

  it('generates unique IDs for attractions', () => {
    const result = parseItineraryLocal(PARIS_ITINERARY_TEXT);
    const ids = result.attractions.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('parseItinerary', () => {
  it('returns parsed itinerary from AI on success', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_AI_PARSE_RESPONSE,
    } as any);

    const result = await parseItinerary(PARIS_ITINERARY_TEXT, 'paris');
    expect(result.cityId).toBe('paris');
    expect(result.attractions.length).toBeGreaterThan(0);
  });

  it('falls back to local parsing on API failure', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Server Error',
    } as any);

    const result = await parseItinerary(PARIS_ITINERARY_TEXT, 'paris');
    // Should still return a result via local fallback
    expect(result.cityId).toBe('paris');
    expect(result.attractions.length).toBeGreaterThan(0);
  });

  it('falls back to local parsing on network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const result = await parseItinerary(PARIS_ITINERARY_TEXT);
    expect(result.cityId).toBe('paris');
  });

  it('calls correct backend proxy endpoint', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_AI_PARSE_RESPONSE,
    } as any);

    await parseItinerary(PARIS_ITINERARY_TEXT, 'paris');
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const url = mockFetch.mock.calls[0][0];
    expect(url).toContain('/api/ai/parse-itinerary');
  });

  it('detects city from text when cityName not provided', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Offline'));

    const result = await parseItinerary(PARIS_ITINERARY_TEXT);
    expect(result.cityId).toBe('paris');
  });

  it('handles multi-city itinerary text', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Offline'));

    const result = await parseItinerary(MULTI_CITY_ITINERARY_TEXT);
    expect(result.attractions.length).toBeGreaterThan(0);
  });
});
