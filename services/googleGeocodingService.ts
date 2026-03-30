// services/googleGeocodingService.ts
// Tier 3: Google Geocoding API via backend proxy

const BACKEND_URL = 'http://localhost:3000';
const API_KEY = process.env.CULTURE_GUIDE_API_KEY || 'dev-key';

interface GoogleGeocodingResult {
  latitude: number;
  longitude: number;
  formattedAddress: string;
}

const CITY_NAMES: Record<string, string> = {
  paris: 'Paris, France',
  rome: 'Rome, Italy',
  venice: 'Venice, Italy',
};

/**
 * Geocode an attraction using the Google Geocoding API via backend proxy.
 * POST /api/geocoding/lookup with { address }
 */
export async function geocodeWithGoogle(
  attractionName: string,
  cityId: string,
): Promise<GoogleGeocodingResult | null> {
  const cityName = CITY_NAMES[cityId] || cityId;
  const address = `${attractionName}, ${cityName}`;

  try {
    console.log(`[Geocoding] Calling Google API for: ${attractionName}`);

    const response = await fetch(`${BACKEND_URL}/api/geocoding/lookup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY,
      },
      body: JSON.stringify({ address }),
    });

    if (!response.ok) {
      console.log(`[Geocoding] Google API error: ${response.statusText}`);
      return null;
    }

    const data = await response.json() as {
      status: string;
      results?: Array<{
        geometry: { location: { lat: number; lng: number } };
        formatted_address?: string;
      }>;
    };

    if (data.status === 'OK' && data.results && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      return {
        latitude: location.lat,
        longitude: location.lng,
        formattedAddress: data.results[0].formatted_address || address,
      };
    }

    console.log(`[Geocoding] Google API returned no results: ${data.status}`);
    return null;
  } catch (error) {
    console.log(`[Geocoding] Google API error: ${error}`);
    return null;
  }
}
