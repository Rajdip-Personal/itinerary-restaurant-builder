// services/itineraryParser.ts
// Parse raw itinerary text into structured DailyItinerary

import type { DailyItinerary, ItineraryAttraction, TokenUsage } from 'types/index';
import { SUPPORTED_CITIES } from 'utils/constants';
import { trackTokenUsage } from 'utils/tokenTracker';

const BACKEND_URL = 'http://localhost:3000';

/**
 * Detect city name from itinerary text (case-insensitive).
 * Returns the first supported city found, or '' if none detected.
 */
export function detectCity(text: string): string {
  const lower = text.toLowerCase();
  for (const city of SUPPORTED_CITIES) {
    if (lower.includes(city)) {
      return city;
    }
  }
  return '';
}

/**
 * Parse itinerary text locally using regex (no AI needed).
 * Used as fallback when AI parsing fails.
 */
export function parseItineraryLocal(text: string): DailyItinerary {
  const cityId = detectCity(text);
  const attractions: ItineraryAttraction[] = [];
  const lines = text.split('\n').filter((l) => l.trim().length > 0);

  // Match patterns like "9:00 AM - Louvre Museum (3 hours)" or "14:30 - Pantheon"
  const timePattern = /(\d{1,2}:\d{2}\s*(?:AM|PM)?)\s*[-–—]\s*(.+)/i;

  let idx = 0;
  for (const line of lines) {
    const match = line.trim().match(timePattern);
    if (!match) continue;

    const timeStr = match[1].trim();
    let name = match[2].trim();

    // Extract duration if present: "(3 hours)" or "(1.5 hours)" or "(90 min)"
    let duration = 60; // default 60 minutes
    const durationMatch = name.match(/\((\d+(?:\.\d+)?)\s*(?:hours?|hrs?)\)/i);
    const durationMinMatch = name.match(/\((\d+)\s*(?:min(?:utes?)?)\)/i);
    if (durationMatch) {
      duration = Math.round(parseFloat(durationMatch[1]) * 60);
      name = name.replace(durationMatch[0], '').trim();
    } else if (durationMinMatch) {
      duration = parseInt(durationMinMatch[1], 10);
      name = name.replace(durationMinMatch[0], '').trim();
    }

    // Detect city for this attraction
    const attractionCity = detectCity(name) || detectCity(line) || cityId;

    // Check if this is a meal break placeholder
    const isPlaceholder = /\b(lunch|dinner|breakfast|meal|snack)\b/i.test(name);

    attractions.push({
      id: `${cityId || 'unknown'}-parsed-${idx}`,
      name,
      estimatedTime: timeStr,
      estimatedDuration: duration,
      isPlaceholder,
      cityId: attractionCity || undefined,
    });
    idx++;
  }

  const now = Date.now();
  return {
    id: `${cityId || 'unknown'}-${new Date().toISOString().split('T')[0]}`,
    date: new Date().toISOString().split('T')[0],
    cityId,
    attractions,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Parse itinerary text using AI via backend proxy, with local fallback.
 */
export async function parseItinerary(
  text: string,
  cityName?: string,
): Promise<DailyItinerary> {
  const detectedCity = cityName || detectCity(text);

  try {
    console.log(`[Parser] Parsing itinerary via AI (city: ${detectedCity || 'auto-detect'})`);

    const response = await fetch(`${BACKEND_URL}/api/ai/parse-itinerary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itineraryText: text, cityName: detectedCity }),
    });

    if (!response.ok) {
      console.log(`[Parser] AI parse failed: ${response.status}, falling back to local`);
      return parseItineraryLocal(text);
    }

    const data = (await response.json()) as {
      parsed: DailyItinerary;
      usage?: TokenUsage;
    };

    if (data.usage) {
      trackTokenUsage(data.usage);
    }

    console.log(`[Parser] AI parsed ${data.parsed.attractions.length} attractions`);
    return data.parsed;
  } catch (error) {
    console.log(`[Parser] AI parse error: ${error}, falling back to local`);
    return parseItineraryLocal(text);
  }
}
