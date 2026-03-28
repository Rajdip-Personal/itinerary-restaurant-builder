/**
 * Venice Restaurant Curation
 *
 * 15 manually curated restaurants covering:
 * - Bacari (Venetian wine bars with cicchetti)
 * - Seafood restaurants / Osterie
 * - Traditional Venetian trattorias
 * - Gelaterias
 *
 * Neighborhoods: San Polo, Dorsoduro, Castello, Cannaregio, San Marco (selective)
 */

import { EnhancedRestaurant } from '../../types';
import { isRestaurantOpen, WeeklyHours } from '../../utils/hoursChecker';

// Standard hours templates by restaurant type (Venice)
const STANDARD_HOURS: Record<string, WeeklyHours> = {
  bacaro: {
    monday: [{ open: '10:00', close: '14:30' }, { open: '17:30', close: '21:00' }],
    tuesday: [{ open: '10:00', close: '14:30' }, { open: '17:30', close: '21:00' }],
    wednesday: [{ open: '10:00', close: '14:30' }, { open: '17:30', close: '21:00' }],
    thursday: [{ open: '10:00', close: '14:30' }, { open: '17:30', close: '21:00' }],
    friday: [{ open: '10:00', close: '14:30' }, { open: '17:30', close: '21:30' }],
    saturday: [{ open: '10:00', close: '14:30' }, { open: '17:30', close: '21:30' }],
    sunday: [{ open: '10:00', close: '14:30' }],
  },
  osteria: {
    monday: [{ open: '12:00', close: '14:30' }, { open: '19:00', close: '22:30' }],
    tuesday: [{ open: '12:00', close: '14:30' }, { open: '19:00', close: '22:30' }],
    wednesday: [{ open: '12:00', close: '14:30' }, { open: '19:00', close: '22:30' }],
    thursday: [{ open: '12:00', close: '14:30' }, { open: '19:00', close: '22:30' }],
    friday: [{ open: '12:00', close: '14:30' }, { open: '19:00', close: '23:00' }],
    saturday: [{ open: '12:00', close: '14:30' }, { open: '19:00', close: '23:00' }],
    sunday: [{ open: '12:00', close: '14:30' }, { open: '19:00', close: '22:00' }],
  },
  restaurant: {
    monday: [{ open: '12:00', close: '15:00' }, { open: '19:00', close: '22:30' }],
    tuesday: [{ open: '12:00', close: '15:00' }, { open: '19:00', close: '22:30' }],
    wednesday: [{ open: '12:00', close: '15:00' }, { open: '19:00', close: '22:30' }],
    thursday: [{ open: '12:00', close: '15:00' }, { open: '19:00', close: '22:30' }],
    friday: [{ open: '12:00', close: '15:00' }, { open: '19:00', close: '23:00' }],
    saturday: [{ open: '12:00', close: '15:00' }, { open: '19:00', close: '23:00' }],
    sunday: [{ open: '12:00', close: '15:00' }, { open: '19:00', close: '22:00' }],
  },
  trattoria: {
    monday: [{ open: '12:00', close: '14:30' }, { open: '19:00', close: '22:00' }],
    tuesday: [{ open: '12:00', close: '14:30' }, { open: '19:00', close: '22:00' }],
    wednesday: [{ open: '12:00', close: '14:30' }, { open: '19:00', close: '22:00' }],
    thursday: [{ open: '12:00', close: '14:30' }, { open: '19:00', close: '22:00' }],
    friday: [{ open: '12:00', close: '14:30' }, { open: '19:00', close: '22:30' }],
    saturday: [{ open: '12:00', close: '14:30' }, { open: '19:00', close: '22:30' }],
    sunday: [{ open: '12:00', close: '14:30' }],
  },
  gelateria: {
    monday: [{ open: '11:00', close: '22:00' }],
    tuesday: [{ open: '11:00', close: '22:00' }],
    wednesday: [{ open: '11:00', close: '22:00' }],
    thursday: [{ open: '11:00', close: '22:00' }],
    friday: [{ open: '11:00', close: '23:00' }],
    saturday: [{ open: '10:00', close: '23:00' }],
    sunday: [{ open: '10:00', close: '22:00' }],
  },
};

function getWeeklyHours(type: string, closedDay?: string): WeeklyHours {
  const base: WeeklyHours = { ...(STANDARD_HOURS[type] || STANDARD_HOURS.restaurant) };
  if (closedDay) {
    base[closedDay] = 'closed';
  }
  return base;
}

// Closed days for Venice restaurants
const veniceClosedDays: Record<string, string> = {
  'venice-1': 'sunday',     // All'Arco
  'venice-3': 'monday',     // Osteria alle Testiere
  'venice-5': 'tuesday',    // Osteria ai 4 Feri
  'venice-8': 'tuesday',    // Dalla Marisa
  'venice-9': 'wednesday',  // Corte Sconta
  'venice-10': 'monday',    // Trattoria Antiche Carampane
  'venice-12': 'monday',    // Osteria al Timon
};

// ============================================================================
// SIGNATURE DISHES
// ============================================================================

export const veniceSignatureDishes: Record<string, {
  name: string;
  price: string;
  description?: string;
}> = {
  // BACARI
  'venice-1': {
    name: 'Cicchetti Platter',
    price: '€12',
    description: 'Venetian small plates with wine — daily-changing selection'
  },
  'venice-2': {
    name: 'Baccalà Mantecato',
    price: '€4',
    description: 'Creamed salt cod on bread — the classic cicchetto'
  },
  'venice-4': {
    name: 'Cicchetti & Ombra',
    price: '€8',
    description: 'Crostini with toppings + glass of house wine'
  },
  'venice-6': {
    name: 'Sarde in Saor',
    price: '€5',
    description: 'Sweet and sour sardines — traditional Venetian recipe since 1462'
  },

  // SEAFOOD / OSTERIE
  'venice-3': {
    name: 'Spaghetti alle Vongole',
    price: '€24',
    description: 'Fresh clam pasta with white wine — only 22 seats'
  },
  'venice-5': {
    name: 'Seppie in Nero',
    price: '€18',
    description: 'Cuttlefish in its own ink with polenta'
  },
  'venice-9': {
    name: 'Fritto Misto',
    price: '€22',
    description: 'Mixed fried seafood — light and perfectly crispy'
  },
  'venice-10': {
    name: 'Risotto di Pesce',
    price: '€20',
    description: 'Seafood risotto with daily catch from Rialto Market'
  },

  // TRADITIONAL VENETIAN
  'venice-7': {
    name: 'Bigoli in Salsa',
    price: '€14',
    description: 'Thick pasta with anchovy and onion sauce'
  },
  'venice-8': {
    name: 'Set Menu (no choice)',
    price: '€18',
    description: 'Home-style Venetian cooking — the cook decides what you eat'
  },
  'venice-11': {
    name: 'Fegato alla Veneziana',
    price: '€16',
    description: 'Venetian-style liver with onions — the classic'
  },
  'venice-12': {
    name: 'Risotto al Nero di Seppia',
    price: '€16',
    description: 'Squid ink risotto along the canal'
  },

  // PIZZA / BAKERY
  'venice-13': {
    name: 'Pizza al Taglio',
    price: '€4',
    description: 'Roman-style pizza by the slice — rare good pizza in Venice'
  },

  // GELATO
  'venice-14': {
    name: 'Pistachio Gelato',
    price: '€3.50',
    description: 'Artisan gelato with natural ingredients — no artificial colors'
  },
  'venice-15': {
    name: 'Gianduiotto',
    price: '€3.50',
    description: 'Hazelnut-chocolate gelato on the Zattere waterfront'
  },
};

// ============================================================================
// LOCAL TIPS
// ============================================================================

export const veniceLocalTips: Record<string, string> = {
  'venice-1': 'Standing room only. Arrive 10:30am when Rialto Market vendors stop for breakfast. Closed Sunday.',
  'venice-2': 'Cash only. Order at bar, eat standing. The baccalà mantecato is the best in Venice.',
  'venice-3': 'Only 22 seats — book 1-2 months ahead for April. Two seatings: 12:15 and 19:00. Worth the effort.',
  'venice-4': 'Hidden down a narrow alley in Dorsoduro. Ask for the daily specials on the board. Cash preferred.',
  'venice-5': 'Popular with locals in Dorsoduro. No reservations — arrive at noon sharp for lunch.',
  'venice-6': 'The oldest bacaro in Venice (1462). Cash only, standing room. Try the sarde in saor.',
  'venice-7': 'Simple, honest Venetian cooking. No frills, just good food. Popular with gondoliers for lunch.',
  'venice-8': 'No menu — Marisa cooks what she bought at the market. Lunch only on most days. Cash only.',
  'venice-9': 'Hidden courtyard in Castello. Book 1-2 weeks ahead. The fritto misto is legendary.',
  'venice-10': 'Near Rialto but not touristy — locals know to come here. Book for dinner, lunch walk-in ok.',
  'venice-11': 'Canal-side tables available. Try the liver if you\'re adventurous — it\'s their specialty.',
  'venice-12': 'Canalside bar in Cannaregio. The squid ink risotto is excellent. Lively evening atmosphere.',
  'venice-13': 'Rare good pizza option in Venice. Quick, cheap, and near Rialto. Great for a fast lunch.',
  'venice-14': 'Near Campo Santo Stefano. Natural ingredients only — look for the covered metal containers (a sign of quality).',
  'venice-15': 'On the Zattere waterfront with views of Giudecca. The gianduiotto is legendary.',
};

// ============================================================================
// RESTAURANT METADATA
// ============================================================================

export const veniceRestaurantMetadata: Record<string, {
  name: string;
  address: string;
  coordinates: { latitude: number; longitude: number };
  neighborhood: string;
  type: 'bacaro' | 'restaurant' | 'trattoria' | 'gelateria' | 'osteria';
  cuisineTypes: string[];
  rating: number;
  reviewCount: number;
  priceLevel: number;
  reservationRequired?: 'none' | 'recommended' | 'essential';
  reservationLeadDays?: number;
  reservationNotes?: string;
}> = {
  // === BACARI (Wine bars with cicchetti) ===
  'venice-1': {
    name: "All'Arco",
    address: 'San Polo, 436, 30125 Venezia',
    coordinates: { latitude: 45.4380, longitude: 12.3358 },
    neighborhood: 'San Polo',
    type: 'bacaro',
    cuisineTypes: ['Venetian', 'Wine Bar', 'Cicchetti'],
    rating: 4.6,
    reviewCount: 2100,
    priceLevel: 1,
    reservationRequired: 'none'
  },
  'venice-2': {
    name: 'Cantina Do Spade',
    address: 'San Polo, 860, 30125 Venezia',
    coordinates: { latitude: 45.4382, longitude: 12.3345 },
    neighborhood: 'San Polo',
    type: 'bacaro',
    cuisineTypes: ['Venetian', 'Wine Bar', 'Cicchetti'],
    rating: 4.3,
    reviewCount: 3800,
    priceLevel: 1,
    reservationRequired: 'none'
  },
  'venice-4': {
    name: 'Cantinone Già Schiavi',
    address: 'Dorsoduro, 992, 30123 Venezia',
    coordinates: { latitude: 45.4316, longitude: 12.3273 },
    neighborhood: 'Dorsoduro',
    type: 'bacaro',
    cuisineTypes: ['Venetian', 'Wine Bar', 'Cicchetti'],
    rating: 4.5,
    reviewCount: 1600,
    priceLevel: 1,
    reservationRequired: 'none'
  },
  'venice-6': {
    name: 'Cantina Do Mori',
    address: 'San Polo, 429, 30125 Venezia',
    coordinates: { latitude: 45.4381, longitude: 12.3355 },
    neighborhood: 'San Polo',
    type: 'bacaro',
    cuisineTypes: ['Venetian', 'Wine Bar', 'Cicchetti'],
    rating: 4.2,
    reviewCount: 4200,
    priceLevel: 1,
    reservationRequired: 'none'
  },

  // === SEAFOOD / OSTERIE ===
  'venice-3': {
    name: 'Osteria alle Testiere',
    address: 'Calle del Mondo Novo, 5801, 30122 Venezia',
    coordinates: { latitude: 45.4359, longitude: 12.3448 },
    neighborhood: 'Castello',
    type: 'osteria',
    cuisineTypes: ['Venetian', 'Seafood'],
    rating: 4.7,
    reviewCount: 1900,
    priceLevel: 3,
    reservationRequired: 'essential',
    reservationLeadDays: 30,
    reservationNotes: 'Book 1-2 months ahead for April. Only 22 seats.'
  },
  'venice-5': {
    name: 'Osteria ai 4 Feri',
    address: 'Calle Lunga San Barnaba, 2754/A, 30123 Venezia',
    coordinates: { latitude: 45.4320, longitude: 12.3270 },
    neighborhood: 'Dorsoduro',
    type: 'osteria',
    cuisineTypes: ['Venetian', 'Seafood'],
    rating: 4.5,
    reviewCount: 1200,
    priceLevel: 2,
    reservationRequired: 'recommended'
  },
  'venice-9': {
    name: 'Corte Sconta',
    address: 'Calle del Pestrin, 3886, 30122 Venezia',
    coordinates: { latitude: 45.4345, longitude: 12.3470 },
    neighborhood: 'Castello',
    type: 'osteria',
    cuisineTypes: ['Venetian', 'Seafood'],
    rating: 4.5,
    reviewCount: 1500,
    priceLevel: 3,
    reservationRequired: 'essential',
    reservationLeadDays: 14,
    reservationNotes: 'Book 2 weeks ahead. Hidden courtyard — ask for directions.'
  },
  'venice-10': {
    name: 'Trattoria Antiche Carampane',
    address: 'Rio Terà de le Carampane, 1911, 30125 Venezia',
    coordinates: { latitude: 45.4390, longitude: 12.3330 },
    neighborhood: 'San Polo',
    type: 'trattoria',
    cuisineTypes: ['Venetian', 'Seafood'],
    rating: 4.4,
    reviewCount: 2800,
    priceLevel: 3,
    reservationRequired: 'recommended',
    reservationLeadDays: 7,
    reservationNotes: 'Book 1 week ahead for dinner. Lunch walk-in usually ok.'
  },

  // === TRADITIONAL VENETIAN ===
  'venice-7': {
    name: 'Al Vecio Marangon',
    address: 'Calle de la Chiesa, 210, 30123 Venezia',
    coordinates: { latitude: 45.4310, longitude: 12.3290 },
    neighborhood: 'Dorsoduro',
    type: 'trattoria',
    cuisineTypes: ['Venetian', 'Traditional'],
    rating: 4.3,
    reviewCount: 800,
    priceLevel: 2,
    reservationRequired: 'none'
  },
  'venice-8': {
    name: 'Dalla Marisa',
    address: 'Fondamenta di San Giobbe, 652/B, 30121 Venezia',
    coordinates: { latitude: 45.4445, longitude: 12.3240 },
    neighborhood: 'Cannaregio',
    type: 'trattoria',
    cuisineTypes: ['Venetian', 'Home Cooking'],
    rating: 4.4,
    reviewCount: 600,
    priceLevel: 2,
    reservationRequired: 'essential',
    reservationLeadDays: 3,
    reservationNotes: 'No menu — Marisa cooks what she bought. Cash only. Call to reserve.'
  },
  'venice-11': {
    name: 'Osteria al Ponte del Diavolo',
    address: 'Fondamenta Borgo, 10/B, 30142 Torcello',
    coordinates: { latitude: 45.4973, longitude: 12.4178 },
    neighborhood: 'Torcello',
    type: 'restaurant',
    cuisineTypes: ['Venetian', 'Seafood', 'Traditional'],
    rating: 4.3,
    reviewCount: 700,
    priceLevel: 3,
    reservationRequired: 'recommended',
    reservationLeadDays: 7
  },
  'venice-12': {
    name: 'Osteria al Timon',
    address: 'Fondamenta degli Ormesini, 2754, 30121 Venezia',
    coordinates: { latitude: 45.4440, longitude: 12.3275 },
    neighborhood: 'Cannaregio',
    type: 'osteria',
    cuisineTypes: ['Venetian', 'Wine Bar'],
    rating: 4.2,
    reviewCount: 1800,
    priceLevel: 2,
    reservationRequired: 'none'
  },

  // === PIZZA / BAKERY ===
  'venice-13': {
    name: 'Antico Forno',
    address: 'Ruga Rialto, 970, 30125 Venezia',
    coordinates: { latitude: 45.4378, longitude: 12.3350 },
    neighborhood: 'San Polo',
    type: 'bacaro',
    cuisineTypes: ['Pizza', 'Bakery'],
    rating: 4.1,
    reviewCount: 3200,
    priceLevel: 1,
    reservationRequired: 'none'
  },

  // === GELATO ===
  'venice-14': {
    name: 'SuSo Gelatoteca',
    address: 'Calle de la Bissa, 5453, 30124 Venezia',
    coordinates: { latitude: 45.4355, longitude: 12.3380 },
    neighborhood: 'San Marco',
    type: 'gelateria',
    cuisineTypes: ['Gelato', 'Dessert'],
    rating: 4.5,
    reviewCount: 5200,
    priceLevel: 1,
    reservationRequired: 'none'
  },
  'venice-15': {
    name: 'Gelateria Nico',
    address: 'Dorsoduro, 922, 30123 Venezia',
    coordinates: { latitude: 45.4298, longitude: 12.3268 },
    neighborhood: 'Dorsoduro',
    type: 'gelateria',
    cuisineTypes: ['Gelato', 'Dessert'],
    rating: 4.3,
    reviewCount: 2400,
    priceLevel: 1,
    reservationRequired: 'none'
  },
};

// ============================================================================
// ASSEMBLED ENHANCED RESTAURANTS
// ============================================================================

export function getVeniceRestaurants(): EnhancedRestaurant[] {
  return Object.keys(veniceRestaurantMetadata).map(id => {
    const metadata = veniceRestaurantMetadata[id];
    const signatureDish = veniceSignatureDishes[id];
    const localTip = veniceLocalTips[id];

    const weeklyHours = getWeeklyHours(metadata.type, veniceClosedDays[id]);

    return {
      id,
      name: metadata.name,
      coordinates: metadata.coordinates,
      rating: metadata.rating,
      reviewCount: metadata.reviewCount,
      priceLevel: metadata.priceLevel,
      cuisineTypes: metadata.cuisineTypes,
      address: metadata.address,
      cityId: 'venice',
      type: metadata.type,
      isOpenNow: isRestaurantOpen(weeklyHours, new Date()),
      famousFor: signatureDish ? [signatureDish.name] : [],
      safeDishes: { vegetarian: [], vegan: [] },
      weeklyHours,
      reservationRequired: metadata.reservationRequired,
      reservationLeadDays: metadata.reservationLeadDays,

      insights: {
        summary: signatureDish ? `Known for ${signatureDish.name}` : `Curated ${metadata.type} in Venice`,
        atmosphere: `${metadata.neighborhood} ${metadata.type}`,
        bestDishes: signatureDish ? [signatureDish.name] : [],
        localTip: localTip || '',
        touristTrapScore: 20,
      },

      contextScore: 0,
      mealType: 'lunch' as const,
      routeContext: {
        position: 'between' as const,
        nearbyAttraction: '',
        walkTime: 0,
        routeFit: '',
      },
    };
  });
}
