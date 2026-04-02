require('dotenv').config();
const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize OpenAI client with 45 second timeout
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 45000, // 45 seconds (OpenAI can be slow for complex requests)
});

// Request logger - log every incoming request
app.use((req, res, next) => {
  const now = new Date().toISOString();
  console.log(`[${now}] ${req.method} ${req.url} from ${req.ip} origin=${req.headers.origin || 'none'}`);
  next();
});

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(cors({
  origin: true,
  methods: ['GET', 'POST'],
  credentials: true,
}));

// ==================== API KEY AUTHENTICATION ====================

const API_KEY = process.env.API_KEY;

function authenticateApiKey(req, res, next) {
  // Skip auth for health check
  if (req.path === '/health') {
    return next();
  }

  const clientApiKey = req.headers['x-api-key'];

  if (!clientApiKey) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'API key is required. Include X-API-Key header.'
    });
  }

  if (clientApiKey !== API_KEY) {
    console.warn('[Auth] Invalid API key attempt from:', req.ip);
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Invalid API key'
    });
  }

  next();
}

// Apply authentication to all routes
app.use(authenticateApiKey);

// Health check endpoint (public, no auth required)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ==================== INPUT VALIDATION ====================

function validateText(text, maxLength = 5000) {
  if (!text || typeof text !== 'string') {
    throw new Error('Invalid input: text must be a non-empty string');
  }

  const trimmed = text.trim();
  if (trimmed.length === 0) {
    throw new Error('Input cannot be empty');
  }

  if (trimmed.length > maxLength) {
    throw new Error(`Input exceeds maximum length of ${maxLength} characters`);
  }

  return trimmed;
}

function validatePlaceId(placeId) {
  if (!placeId || typeof placeId !== 'string') {
    throw new Error('Invalid place_id');
  }
  // Place IDs are alphanumeric with underscores/dashes
  if (!/^[A-Za-z0-9_-]+$/.test(placeId)) {
    throw new Error('Invalid place_id format');
  }
  return placeId;
}

// ==================== OPENAI API ENDPOINTS ====================

// Analyze restaurant review with AI
app.post('/api/ai/analyze-review', async (req, res) => {
  try {
    const { reviewText } = req.body;

    // Validate input
    const validated = validateText(reviewText, 2000);

    console.log(`[AI] Analyzing review (${validated.length} chars)`);

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful restaurant review analyzer. Provide concise analysis of reviews, focusing on food quality, service, ambiance, and value. Keep responses under 200 words.'
        },
        {
          role: 'user',
          content: validated
        }
      ],
      max_tokens: 300,
      temperature: 0.7,
    });

    const analysis = response.choices[0]?.message?.content || '';

    res.json({
      analysis,
      usage: response.usage,
    });

  } catch (error) {
    console.error('[AI] Error:', error.message);
    res.status(error.status || 500).json({
      error: error.message || 'Failed to analyze review',
    });
  }
});

/**
 * Post-process AI-parsed entries: backfill missing `time` fields by scanning the
 * original itinerary text for time patterns on the same line as each entry name.
 * This is a deterministic regex pass — does not rely on the AI.
 */
function backfillTimesFromText(parsedJson, rawText) {
  let entries;
  try {
    let raw = parsedJson;
    raw = raw.replace(/^```json?\s*/i, '').replace(/\s*```$/i, '').trim();
    entries = JSON.parse(raw);
  } catch {
    return parsedJson; // Can't parse — return original
  }

  if (!Array.isArray(entries)) return parsedJson;

  // Split raw text into lines for matching
  const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  // Time patterns: "19:00", "7:30 PM", "5 PM", "17:30"
  const timeRegex = /\b(\d{1,2}:\d{2})\s*(AM|PM)?\b/i;
  const time24Regex = /\b(\d{1,2}:\d{2})\b/;

  let changed = 0;

  for (const entry of entries) {
    // Always check raw text — override AI's sequential times with actual itinerary times
    const nameLower = (entry.name || '').toLowerCase().replace(/^hotel:\s*/i, '');
    if (nameLower.length < 3) continue;

    const nameWords = nameLower.split(/\s+/).filter(w => w.length > 2);

    for (const line of lines) {
      const lineLower = line.toLowerCase();

      const nameMatch = lineLower.includes(nameLower) ||
        (nameWords.length >= 2 && nameWords.every(w => lineLower.includes(w)));

      if (!nameMatch) continue;

      const match = line.match(timeRegex);
      if (match) {
        let timeStr = match[1];
        const period = (match[2] || '').toUpperCase();

        if (period) {
          let [h, m] = timeStr.split(':').map(Number);
          if (period === 'PM' && h !== 12) h += 12;
          if (period === 'AM' && h === 12) h = 0;
          timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        } else {
          const [h, m] = timeStr.split(':').map(Number);
          timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        }

        entry.time = timeStr;
        changed++;
        break;
      }
    }
  }

  if (changed > 0) {
    console.log(`[Backfill] ${changed} times enriched from raw itinerary text`);
  }

  return JSON.stringify(entries);
}

// Parse itinerary with AI
app.post('/api/ai/parse-itinerary', async (req, res) => {
  try {
    const { itineraryText, cityName } = req.body;

    // Validate inputs
    const validatedItinerary = validateText(itineraryText, 3000);
    const validatedCity = validateText(cityName, 100);

    console.log(`[AI] Parsing itinerary for ${validatedCity}`);
    console.log(`[AI] Text length: ${validatedItinerary.length} characters`);
    console.log(`[AI] Calling OpenAI API...`);
    const startTime = Date.now();

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `You are an itinerary parser. The user's primary city is ${validatedCity}, but the itinerary may span MULTIPLE cities (e.g., morning in Venice, evening in Rome). You MUST detect which city each entry belongs to using your world knowledge.

SUPPORTED CITIES: paris, venice, rome
If an attraction is not in a supported city, use the primary city "${validatedCity}" as fallback.

Parse the user's itinerary and return a JSON array. Each entry MUST have these fields:
- "name": string — the place/venue name (clean, no descriptions or tips)
- "type": one of "attraction", "transit", "meal", "hotel", "skip"
- "cityId": one of "paris", "venice", "rome" — the city this entry is in
- "estimatedDuration": number — minutes (0 for transit/hotel/skip)
- "isHotel": true (ONLY for hotel entries)
- "time": string (OPTIONAL) — "HH:MM" in 24h format. Include ONLY if the user's text contains an explicit time for this entry (e.g., "14:30", "5 PM", "at 7:30"). Do NOT invent times — omit this field if no time is stated.
- "location": string (OPTIONAL) — a specific geocodable place if different from the name. Use this for metro stops, piazzas, viewpoints, or neighborhoods mentioned in the text that are more precise than the attraction name. Omit if the name itself is already a geocodable location.
  Examples:
  "Eiffel Tower Sparkle — Trocadéro" → name: "Eiffel Tower", location: "Trocadéro, Paris"
  "Pantheon Exterior — Piazza della Rotonda" → name: "Pantheon", location: "Piazza della Rotonda, Rome"
  "Louvre Museum" → name: "Louvre Museum" (no location needed, name is geocodable)
  "Sunset at Rialto Bridge" → name: "Rialto Bridge" (no location needed)

TYPE CLASSIFICATION:
- "attraction" — a visitable place: museum, landmark, monument, park, viewpoint, bridge, neighborhood walk, market, piazza
- "transit" — inter-city travel ONLY: flights, trains between cities, long-distance buses. NOT local transport (taxi, metro, walking, water bus)
- "meal" — any food or drink: lunch, dinner, breakfast, gelato, coffee, aperitivo, snack. Include the venue name if mentioned (e.g., "Da Francesco")
- "hotel" — accommodation check-in or hotel mention
- "skip" — everything else: walking directions, tips, logistics, check-out, freshening up, ticket prices, descriptions, section headers, day titles

CITY DETECTION — USE YOUR KNOWLEDGE:
- You know which city landmarks are in. Trevi Fountain = rome, St. Mark's Basilica = venice, Eiffel Tower = paris.
- Day headers often name the city: "Arrive Rome", "Venice Day 2" — use these as context for subsequent entries.
- Transit entries mark city transitions: entries AFTER "Flight to Rome" are in rome.
- When unsure, use the primary city "${validatedCity}".

HOTEL EXTRACTION:
- Look for: "hotel", "staying at", "overnight at", "check in", "accommodation"
- PRESERVE the FULL hotel name: "Hotel Marco Polo" stays "Hotel: Marco Polo"
- Hotel entry MUST be first in the array with "isHotel": true

NAME CLEANING:
- Extract ONLY the place/venue name — strip descriptions, tips, and directions
  "Trevi Fountain at Night — toss a coin for luck!" → name: "Trevi Fountain"
  "Pantheon Exterior — Piazza della Rotonda — Stunning when lit up" → name: "Pantheon"
  "The Grand Walk. Walk up the Champs-Elysees. 30 mins" → name: "Champs-Elysees", duration: 30
- For meals with venue: "Dinner — near Piazza Navona — Da Francesco" → name: "Da Francesco"
- For meals without venue: "Lunch break" → name: "Lunch"

DURATION RULES:
- "(2-3 hours)" → use middle value: 150 minutes
- "30 min" → 30 minutes
- No duration mentioned → estimate based on your world knowledge of the attraction (e.g., Louvre Museum ~180 min, Trevi Fountain ~20 min, neighborhood walk ~60 min, small church ~15 min, major cathedral ~45 min, viewpoint/bridge ~20 min). Use your best judgment for each specific place. 0 for transit/hotel/skip
- Meals: 45 minutes if no duration specified

DO NOT:
- INVENT times — only include "time" if the user wrote an explicit time in their text
- Return single-letter codes (B, L, D, S)
- Merge multiple stops into one entry
- Add entries not in the user's text
- Include descriptions or tips in the name field

EXAMPLE INPUT (no times):
"Check in Hotel Marco Polo, Via Magenta 39.
Trevi Fountain at Night — 15 min walk, magical at night
Pantheon Exterior — Piazza della Rotonda, stunning when lit up
Dinner near Piazza Navona — Da Francesco"

CORRECT OUTPUT:
[
  {"name": "Hotel: Marco Polo", "type": "hotel", "cityId": "rome", "estimatedDuration": 0, "isHotel": true},
  {"name": "Trevi Fountain", "type": "attraction", "cityId": "rome", "estimatedDuration": 45},
  {"name": "Pantheon", "type": "attraction", "cityId": "rome", "estimatedDuration": 30},
  {"name": "Da Francesco", "type": "meal", "cityId": "rome", "estimatedDuration": 45}
]

EXAMPLE INPUT (with explicit times):
"14:30 Taxi to Hotel Atlantis
17:00 Check in Hotel Atlantis
18:00 Galeries Lafayette Rooftop (1 hr)
19:30 Dinner — Le Relais de l'Entrecote
21:00 Eiffel Tower Sparkle from Trocadero"

CORRECT OUTPUT:
[
  {"name": "Taxi to Hotel Atlantis", "type": "skip", "cityId": "paris", "estimatedDuration": 45, "time": "14:30"},
  {"name": "Hotel: Atlantis", "type": "hotel", "cityId": "paris", "estimatedDuration": 0, "isHotel": true, "time": "17:00"},
  {"name": "Galeries Lafayette Rooftop", "type": "attraction", "cityId": "paris", "estimatedDuration": 60, "time": "18:00"},
  {"name": "Le Relais de l'Entrecote", "type": "meal", "cityId": "paris", "estimatedDuration": 45, "time": "19:30"},
  {"name": "Eiffel Tower Sparkle", "type": "attraction", "cityId": "paris", "estimatedDuration": 60, "time": "21:00"}
]

MULTI-CITY EXAMPLE INPUT:
"Morning: Dorsoduro neighborhood walk (1.5 hrs)
Accademia Bridge views (30 min)
Gelato break
Depart for Venice Airport
Flight ITA Airways to Rome
Leonardo Express to Roma Termini
Trevi Fountain at Night
Pantheon Exterior
Dinner near Piazza Navona"

CORRECT OUTPUT:
[
  {"name": "Dorsoduro", "type": "attraction", "cityId": "venice", "estimatedDuration": 90},
  {"name": "Accademia Bridge", "type": "attraction", "cityId": "venice", "estimatedDuration": 30},
  {"name": "Gelato", "type": "meal", "cityId": "venice", "estimatedDuration": 15},
  {"name": "Venice Airport", "type": "transit", "cityId": "venice", "estimatedDuration": 0},
  {"name": "Flight ITA Airways to Rome", "type": "transit", "cityId": "rome", "estimatedDuration": 0},
  {"name": "Leonardo Express to Roma Termini", "type": "transit", "cityId": "rome", "estimatedDuration": 0},
  {"name": "Trevi Fountain", "type": "attraction", "cityId": "rome", "estimatedDuration": 45},
  {"name": "Pantheon", "type": "attraction", "cityId": "rome", "estimatedDuration": 30},
  {"name": "Dinner", "type": "meal", "cityId": "rome", "estimatedDuration": 45}
]

Return ONLY the JSON array, no other text.`
        },
        {
          role: 'user',
          content: validatedItinerary
        }
      ],
      max_tokens: 2500,
      temperature: 0.3,
    });

    const elapsed = Date.now() - startTime;
    console.log(`[AI] OpenAI response received in ${elapsed}ms`);

    const parsed = response.choices[0]?.message?.content || '';
    console.log(`[AI] Parsed length: ${parsed.length} characters`);
    console.log(`[AI] Raw response:`, parsed);

    // Post-process: extract missing times from raw itinerary text (AI sometimes misses them)
    const enrichedParsed = backfillTimesFromText(parsed, validatedItinerary);

    res.json({
      parsed: enrichedParsed,
      usage: response.usage,
    });

  } catch (error) {
    console.error('[AI] Error:', error.message);
    res.status(error.status || 500).json({
      error: error.message || 'Failed to parse itinerary',
    });
  }
});

// ==================== GOOGLE PLACES API ENDPOINTS ====================

const GOOGLE_API_BASE = 'https://maps.googleapis.com/maps/api';
const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

// Search nearby places
app.post('/api/places/search', async (req, res) => {
  try {
    const { latitude, longitude, radius, type, keyword } = req.body;

    // Validate inputs
    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude and longitude required' });
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ error: 'Invalid coordinates' });
    }

    const searchRadius = Math.min(parseInt(radius) || 1500, 5000); // Max 5km

    console.log(`[Places] Searching near ${lat},${lng}`);

    const params = {
      location: `${lat},${lng}`,
      radius: searchRadius,
      key: GOOGLE_API_KEY,
    };

    if (type) params.type = type;
    if (keyword) params.keyword = validateText(keyword, 100);

    const response = await axios.get(
      `${GOOGLE_API_BASE}/place/nearbysearch/json`,
      { params }
    );

    res.json(response.data);

  } catch (error) {
    console.error('[Places] Search error:', error.message);
    res.status(500).json({
      error: 'Failed to search places',
      details: error.response?.data || error.message,
    });
  }
});

// Get place details
app.get('/api/places/details/:placeId', async (req, res) => {
  try {
    const placeId = validatePlaceId(req.params.placeId);

    console.log(`[Places] Getting details for ${placeId}`);

    const response = await axios.get(
      `${GOOGLE_API_BASE}/place/details/json`,
      {
        params: {
          place_id: placeId,
          fields: 'name,formatted_address,rating,price_level,opening_hours,photos,reviews,website,formatted_phone_number,geometry',
          key: GOOGLE_API_KEY,
        }
      }
    );

    res.json(response.data);

  } catch (error) {
    console.error('[Places] Details error:', error.message);
    res.status(500).json({
      error: 'Failed to get place details',
      details: error.response?.data || error.message,
    });
  }
});

// Get place photo
app.get('/api/places/photo/:photoReference', async (req, res) => {
  try {
    const photoReference = req.params.photoReference;
    const maxWidth = Math.min(parseInt(req.query.maxwidth) || 400, 1600);

    console.log(`[Places] Getting photo ${photoReference}`);

    const photoUrl = `${GOOGLE_API_BASE}/place/photo?maxwidth=${maxWidth}&photo_reference=${photoReference}&key=${GOOGLE_API_KEY}`;

    // Return the photo URL for client to fetch directly
    // Or proxy the image:
    const response = await axios.get(photoUrl, { responseType: 'arraybuffer' });

    res.set('Content-Type', 'image/jpeg');
    res.send(response.data);

  } catch (error) {
    console.error('[Places] Photo error:', error.message);
    res.status(500).json({
      error: 'Failed to get place photo',
    });
  }
});

// Geocoding - convert address to coordinates
app.post('/api/geocoding/lookup', async (req, res) => {
  try {
    const { address } = req.body;

    const validatedAddress = validateText(address, 200);

    console.log(`[Geocoding] Looking up: ${validatedAddress}`);

    const response = await axios.get(
      `${GOOGLE_API_BASE}/geocode/json`,
      {
        params: {
          address: validatedAddress,
          key: GOOGLE_API_KEY,
        }
      }
    );

    res.json(response.data);

  } catch (error) {
    console.error('[Geocoding] Error:', error.message);
    res.status(500).json({
      error: 'Failed to geocode address',
      details: error.response?.data || error.message,
    });
  }
});

// ==================== RECOMMENDATION PIPELINE ====================

// Utility: parse "HH:MM" or "H:MM AM/PM" to minutes since midnight
function parseTimeToMinutes(time) {
  const trimmed = (time || '').trim();
  const match12 = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (match12) {
    let hours = parseInt(match12[1], 10);
    const minutes = parseInt(match12[2], 10);
    const period = match12[3].toUpperCase();
    if (period === 'AM' && hours === 12) hours = 0;
    if (period === 'PM' && hours !== 12) hours += 12;
    return hours * 60 + minutes;
  }
  const match24 = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (match24) {
    return parseInt(match24[1], 10) * 60 + parseInt(match24[2], 10);
  }
  return 720; // default noon if unparseable
}

// Import compiled TS services from dist/ (built with: npm run build)
// NOTE: geocodeAttractions is NOT imported — it makes HTTP self-calls that fail auth.
// Instead, we use pipelineGeocode() below which calls landmarks + Google directly.
const { generateRoutePath } = require('../dist/services/routePathGenerator');
const { insertMealBreaks, insertSmartMealBreaks } = require('../dist/services/mealBreakInserter');
const { getRecommendations } = require('../dist/services/recommendationEngine');
const { recalculateForDelay } = require('../dist/services/runningLateService');

// Import landmark databases for Tier 1 geocoding (direct, no HTTP)
const { PARIS_LANDMARKS, findLandmarkInCity: findParisLandmark } = require('../dist/data/landmarks/paris');
const { ROME_LANDMARKS } = require('../dist/data/landmarks/rome');
const { VENICE_LANDMARKS } = require('../dist/data/landmarks/venice');

const ALL_LANDMARKS = { paris: PARIS_LANDMARKS, rome: ROME_LANDMARKS, venice: VENICE_LANDMARKS };

const CITY_NAMES_GEO = { paris: 'Paris, France', rome: 'Rome, Italy', venice: 'Venice, Italy' };

/**
 * Pipeline-local geocoding: Landmark DB (Tier 1) → Google API direct (Tier 2).
 * Avoids the HTTP self-call auth issue in the compiled TS service.
 */
async function pipelineGeocode(attractions, cityId) {
  const results = [];
  const { findLandmarkInCity } = require('../dist/data/landmarks/paris');

  for (const attraction of attractions) {
    // Use per-attraction cityId for multi-city itineraries, fallback to global
    const effectiveCityId = attraction.cityId || cityId;
    const landmarks = ALL_LANDMARKS[effectiveCityId] || [];

    // Skip if already has coordinates
    if (attraction.coordinates) {
      results.push({ name: attraction.name, coordinates: attraction.coordinates, source: 'pre_existing' });
      continue;
    }

    // Names to try: location first (more specific), then name
    const namesToTry = [];
    if (attraction.location) namesToTry.push(attraction.location);
    namesToTry.push(attraction.name);

    let found = false;

    for (const tryName of namesToTry) {
      // Tier 1: Landmark DB
      const landmark = findLandmarkInCity(tryName, effectiveCityId, landmarks);
      if (landmark) {
        console.log(`[Geocoding] Tier 1 hit: ${landmark.name} (landmark) for "${tryName}"`);
        results.push({ name: attraction.name, coordinates: landmark.coordinates, source: 'landmark' });
        found = true;
        break;
      }

      // Tier 2: Google Geocoding API (direct call, no HTTP self-reference)
      if (GOOGLE_API_KEY) {
        try {
          const cityName = CITY_NAMES_GEO[effectiveCityId] || effectiveCityId;
          const address = `${tryName}, ${cityName}`;
          console.log(`[Geocoding] Tier 2 Google API for: ${tryName}`);
          const geoResp = await axios.get(`${GOOGLE_API_BASE}/geocode/json`, {
            params: { address, key: GOOGLE_API_KEY },
          });
          if (geoResp.data.status === 'OK' && geoResp.data.results && geoResp.data.results.length > 0) {
            const loc = geoResp.data.results[0].geometry.location;
            console.log(`[Geocoding] Tier 2 hit: ${tryName} (google) → ${loc.lat}, ${loc.lng}`);
            results.push({
              name: attraction.name,
              coordinates: { latitude: loc.lat, longitude: loc.lng },
              source: 'google',
            });
            found = true;
            break;
          }
        } catch (err) {
          console.log(`[Geocoding] Tier 2 error for ${tryName}: ${err.message}`);
        }
      }
    }

    if (!found) {
      console.log(`[Geocoding] All tiers missed for: ${attraction.name}`);
      results.push(null);
    }
  }

  return results;
}

// Generate restaurant recommendations for an itinerary
app.post('/api/recommendations/generate', async (req, res) => {
  try {
    const { entries, startTime, date } = req.body;

    if (!entries || !Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({ error: 'entries array is required and must not be empty' });
    }

    console.log(`[Pipeline] Generating recommendations for ${entries.length} entries`);

    // 1. Separate attractions and hotel from entries
    const attractions = entries.filter(e => e.type === 'attraction');
    const hotelEntry = entries.find(e => e.isHotel === true);
    const cityId = entries[0].cityId || 'paris';

    if (attractions.length === 0) {
      return res.status(400).json({ error: 'No attractions found in entries' });
    }

    // 2. Build ItineraryAttraction format for geocoding and meal breaks
    const itineraryAttractions = attractions.map((a, i) => ({
      id: `attr-${i}`,
      name: a.name,
      estimatedTime: a.calculatedTime || a.time || startTime || '09:00',
      estimatedDuration: a.estimatedDuration || 60,
      isPlaceholder: false,
      cityId: a.cityId || cityId,
      coordinates: a.coordinates || undefined,
    }));

    // 3. Geocode attractions (using pipeline-local function, not HTTP self-call)
    console.log(`[Pipeline] Geocoding ${itineraryAttractions.length} attractions`);
    const geocoded = await pipelineGeocode(itineraryAttractions, cityId);
    let geocodedCount = 0;

    // Merge geocoded coordinates back into attractions
    for (let i = 0; i < itineraryAttractions.length; i++) {
      if (geocoded[i] && geocoded[i].coordinates) {
        itineraryAttractions[i].coordinates = geocoded[i].coordinates;
        geocodedCount++;
      }
    }

    console.log(`[Pipeline] Geocoded ${geocodedCount}/${itineraryAttractions.length} attractions`);

    // 4. Geocode hotel if present
    let hotelCoordinates = undefined;
    if (hotelEntry) {
      const hotelName = hotelEntry.name.replace(/^Hotel:\s*/i, '');
      const hotelGeo = await pipelineGeocode(
        [{ id: 'hotel', name: hotelName, estimatedTime: '00:00', estimatedDuration: 0, isPlaceholder: false, cityId }],
        hotelEntry.cityId || cityId,
      );
      if (hotelGeo[0] && hotelGeo[0].coordinates) {
        hotelCoordinates = hotelGeo[0].coordinates;
      }
    }

    // 5. Generate route path from geocoded locations
    const locationsWithCoords = itineraryAttractions
      .filter(a => a.coordinates)
      .map(a => a.coordinates);

    let routePoints = [];
    if (locationsWithCoords.length >= 2) {
      console.log(`[Pipeline] Generating route for ${locationsWithCoords.length} locations`);
      routePoints = await generateRoutePath(locationsWithCoords);
    }

    // 6. Detect existing user meals to skip those windows
    // Skip snack-like entries (gelato, coffee, ice cream) — they aren't real meals
    // Only count meals with explicit times (not defaulted to 12:00)
    const SNACK_KEYWORDS = ['gelato', 'snack', 'coffee', 'ice cream', 'pastry', 'croissant', 'espresso', 'aperitivo'];
    const existingMealTypes = [];
    const mealEntries = entries.filter(e => e.type === 'meal');
    for (const meal of mealEntries) {
      const nameLower = (meal.name || '').toLowerCase();
      const isSnack = SNACK_KEYWORDS.some(kw => nameLower.includes(kw));
      if (isSnack) {
        console.log(`[Pipeline] Treating "${meal.name}" as snack, not a full meal`);
        continue;
      }
      if (!meal.time) {
        console.log(`[Pipeline] Skipping "${meal.name}" — no explicit time, can't determine meal window`);
        continue;
      }
      const mealTime = parseTimeToMinutes(meal.time);
      if (mealTime >= 420 && mealTime <= 630) existingMealTypes.push('breakfast');   // 07:00-10:30
      else if (mealTime >= 720 && mealTime <= 870) existingMealTypes.push('lunch');  // 12:00-14:30
      else if (mealTime >= 1140 && mealTime <= 1320) existingMealTypes.push('dinner'); // 19:00-22:00
    }
    if (existingMealTypes.length > 0) {
      console.log(`[Pipeline] User already has meals: ${existingMealTypes.join(', ')}`);
    }

    // DEBUG: Log what the mealBreakInserter will see
    console.log(`[Pipeline] Attractions for meal placement:`);
    for (const a of itineraryAttractions) {
      console.log(`  - ${a.name} | time: ${a.estimatedTime} | duration: ${a.estimatedDuration}min | city: ${a.cityId} | coords: ${a.coordinates ? 'yes' : 'no'}`);
    }

    // 7. Smart meal break placement — multi-candidate per meal
    const smartMealBreaks = insertSmartMealBreaks(itineraryAttractions, cityId, {
      hotelCoordinates,
      existingMealTypes,
    });
    const activeMeals = smartMealBreaks.filter(sm => !sm.skipReason && sm.candidates.length > 0);
    console.log(`[Pipeline] ${activeMeals.length} meal breaks identified (${smartMealBreaks.length - activeMeals.length} skipped)`);

    // 8. Get recommendations — iterate candidates until restaurants found
    const meals = {};
    const usedRestaurantIds = new Set();

    for (const smartBreak of activeMeals) {
      let foundRestaurants = false;

      for (let ci = 0; ci < smartBreak.candidates.length; ci++) {
        const candidate = smartBreak.candidates[ci];
        console.log(`[Pipeline] ${smartBreak.mealType} candidate ${ci + 1}/${smartBreak.candidates.length}: ${candidate.reason} (city: ${candidate.cityId || cityId})`);

        const candidateCityId = candidate.cityId || cityId;
        const result = await getRecommendations({
          cityId: candidateCityId,
          coordinates: candidate.coordinates,
          mealType: smartBreak.mealType,
          routePoints,
          hotelCoordinates,
          previousCuisines: [],
        });

        // Cross-meal deduplication
        const deduped = result.restaurants.filter(r => !usedRestaurantIds.has(r.id));

        if (deduped.length > 0) {
          deduped.forEach(r => usedRestaurantIds.add(r.id));
          meals[smartBreak.mealType] = {
            restaurants: deduped,
            source: result.source,
            mealType: smartBreak.mealType,
            candidateUsed: candidate.reason,
          };
          console.log(`[Pipeline] ${smartBreak.mealType}: ${deduped.length} restaurants (source: ${result.source}, candidate: ${candidate.reason})`);
          foundRestaurants = true;
          break;
        }

        console.log(`[Pipeline] ${smartBreak.mealType} candidate ${ci + 1} — 0 restaurants, trying next`);
      }

      if (!foundRestaurants) {
        console.log(`[Pipeline] ${smartBreak.mealType}: all ${smartBreak.candidates.length} candidates exhausted — 0 restaurants`);
        meals[smartBreak.mealType] = {
          restaurants: [],
          source: 'manual',
          mealType: smartBreak.mealType,
          candidateUsed: 'none — all exhausted',
        };
      }
    }

    const totalRestaurants = Object.values(meals).reduce(
      (sum, m) => sum + m.restaurants.length, 0
    );

    res.json({
      meals,
      meta: {
        totalRestaurants,
        geocodedCount,
        routePoints: routePoints.length,
        mealBreaks: activeMeals.map(mb => mb.mealType),
        skippedMeals: smartMealBreaks.filter(sm => sm.skipReason).map(sm => ({ type: sm.mealType, reason: sm.skipReason })),
        cityId,
      },
    });

    console.log(`[Pipeline] Done: ${totalRestaurants} restaurants across ${Object.keys(meals).length} meals`);

  } catch (error) {
    console.error('[Pipeline] Error:', error.message);
    res.status(500).json({
      error: error.message || 'Failed to generate recommendations',
    });
  }
});

// Running Late — re-rank recommendations based on time delay
app.post('/api/recommendations/running-late', (req, res) => {
  try {
    const { recommendations, delayMinutes, currentTime } = req.body;

    if (!recommendations || typeof recommendations !== 'object') {
      return res.status(400).json({ error: 'recommendations object is required' });
    }
    if (typeof delayMinutes !== 'number' || delayMinutes < 0) {
      return res.status(400).json({ error: 'delayMinutes must be a non-negative number' });
    }
    if (!currentTime || typeof currentTime !== 'string') {
      return res.status(400).json({ error: 'currentTime string (HH:MM) is required' });
    }

    console.log(`[Pipeline] Running Late: ${delayMinutes}min delay at ${currentTime}`);

    const reranked = {};
    for (const [mealType, mealData] of Object.entries(recommendations)) {
      if (!mealData || !Array.isArray(mealData.restaurants)) continue;

      const adjusted = recalculateForDelay(mealData.restaurants, delayMinutes, currentTime);
      reranked[mealType] = {
        ...mealData,
        restaurants: adjusted,
      };

      console.log(`[Pipeline] ${mealType}: ${mealData.restaurants.length} → ${adjusted.length} after delay filter`);
    }

    res.json({ meals: reranked });

  } catch (error) {
    console.error('[Pipeline] Running Late Error:', error.message);
    res.status(500).json({
      error: error.message || 'Failed to recalculate for delay',
    });
  }
});

// ==================== ERROR HANDLING ====================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.path,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[Server] Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

// ==================== START SERVER ====================

// Listen on all network interfaces (0.0.0.0) so phone can connect
app.listen(PORT, '0.0.0.0', () => {
  console.log('========================================');
  console.log(`🚀 CultureGuide Backend Server Running`);
  console.log(`========================================`);
  console.log(`Port: ${PORT}`);
  console.log(`Host: 0.0.0.0 (accessible from local network)`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`From phone: http://192.168.68.69:${PORT}/health`);
  console.log('========================================');
  console.log('');
  console.log('Available endpoints:');
  console.log('  POST /api/ai/analyze-review');
  console.log('  POST /api/ai/parse-itinerary');
  console.log('  POST /api/places/search');
  console.log('  GET  /api/places/details/:placeId');
  console.log('  GET  /api/places/photo/:photoReference');
  console.log('  POST /api/geocoding/lookup');
  console.log('  POST /api/recommendations/generate');
  console.log('  POST /api/recommendations/running-late');
  console.log('========================================');
});
