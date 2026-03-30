/**
 * Paris Restaurant Curation
 *
 * Manually curated restaurants for Paris with signature dishes,
 * local tips, and coordinates.
 *
 * Coverage: 51 establishments
 * - 33 restaurants across neighborhoods (Marais, Bastille, Saint-Germain, Eiffel Tower, etc.)
 * - 12 bakeries (Du Pain et Des Idées, Poilâne, Mamiche, etc.)
 * - 5 patisseries (Cédric Grolet, Angelina, Arnaud Larher, etc.)
 * - 1 fromagerie
 *
 * Structure:
 * - parisSignatureDishes: What each place is famous for
 * - parisLocalTips: Practical advice (reservations, timing, ordering)
 * - parisRestaurantMetadata: Full details (coordinates, ratings, etc.)
 */

import { EnhancedRestaurant } from '../../types';

// ============================================================================
// SIGNATURE DISHES
// ============================================================================

export const parisSignatureDishes: Record<string, {
  name: string;
  price: string;
  description?: string;
}> = {
  // === RESTAURANTS (25) ===
  'paris-1': {
    name: 'Falafel Sandwich',
    price: '€8',
    description: 'Best falafel in Paris with tahini, hummus, and fried eggplant'
  },
  'paris-2': {
    name: 'Steak au Poivre',
    price: '€35',
    description: 'Classic French steak with peppercorn sauce'
  },
  'paris-3': {
    name: 'Tasting Menu',
    price: '€75',
    description: 'Single nightly tasting menu, changes daily'
  },
  'paris-4': {
    name: 'Basque Rice Pudding',
    price: '€45',
    description: 'Famous rice pudding dessert, portions are huge'
  },
  'paris-5': {
    name: 'Seasonal Tasting Menu',
    price: '€95',
    description: 'Market-driven seasonal menu'
  },
  'paris-6': {
    name: 'Pork Terrine',
    price: '€28',
    description: 'House-made terrine with cornichons'
  },
  'paris-7': {
    name: 'Market Tasting Menu',
    price: '€85',
    description: 'Creative market-based tasting menu'
  },
  'paris-8': {
    name: 'Côte de Boeuf',
    price: '€42',
    description: 'Grilled over open fire, served for two'
  },
  'paris-9': {
    name: 'Daily Changing Menu',
    price: '€35',
    description: 'Chef\'s daily menu based on market finds'
  },
  'paris-10': {
    name: 'Buckwheat Galettes',
    price: '€16',
    description: 'Traditional Breton galettes with egg'
  },
  'paris-11': {
    name: 'Galette Complète',
    price: '€14',
    description: 'Authentic Breton crepes with cider pairing'
  },
  'paris-12': {
    name: 'Boeuf Bourguignon',
    price: '€18',
    description: 'Classic French beef stew in iconic 1896 setting'
  },
  'paris-13': {
    name: 'Chocolate Mousse',
    price: '€22',
    description: 'Bottomless chocolate mousse dessert'
  },
  'paris-14': {
    name: 'Basque Pork',
    price: '€38',
    description: 'Complimentary terrine starter included'
  },
  'paris-15': {
    name: 'Egyptian Mezze',
    price: '€25',
    description: 'Modern Egyptian small plates'
  },
  'paris-16': {
    name: 'Entrecôte',
    price: '€32',
    description: 'Ribeye with exceptional wine list'
  },
  'paris-17': {
    name: 'Japanese-French Fusion',
    price: '€35',
    description: 'Husband-wife duo, lunch only'
  },
  'paris-18': {
    name: 'Wood-Fired Veal',
    price: '€65',
    description: 'Garden vegetables from their own farm'
  },
  'paris-19': {
    name: 'Duck Burger',
    price: '€18',
    description: 'Less touristy lunch spot in Marais'
  },
  'paris-20': {
    name: 'Duck Confit',
    price: '€28',
    description: 'Library atmosphere across from Louvre'
  },
  'paris-21': {
    name: 'Hokkaido-French Tasting',
    price: '€78',
    description: 'Japanese chef\'s refined French cuisine'
  },
  'paris-22': {
    name: 'Truffled Linguine',
    price: '€85',
    description: 'Grand Palais terrace views'
  },
  'paris-23': {
    name: 'Pho Soup',
    price: '€12',
    description: 'Only 2 dishes on menu, authentic Vietnamese'
  },
  'paris-24': {
    name: 'Dakjjigae Hotpot',
    price: '€24',
    description: 'Authentic Korean BBQ and hotpot'
  },
  'paris-25': {
    name: 'Seasonal Small Plates',
    price: '€42',
    description: 'Natural wine focus with sharing plates'
  },

  // === WESTERN PARIS RESTAURANTS (8) — 7th, 8th, 15th, 16th arr. ===
  'paris-44': {
    name: 'Filet de Boeuf Rossini',
    price: '€38',
    description: 'Classic bistro steak with foie gras and truffle'
  },
  'paris-45': {
    name: 'Blanquette de Veau',
    price: '€28',
    description: 'Grandmother-style veal stew with cream sauce'
  },
  'paris-46': {
    name: 'Coquilles Saint-Jacques',
    price: '€32',
    description: 'Pan-seared scallops with cauliflower purée'
  },
  'paris-47': {
    name: 'Agneau de 7 Heures',
    price: '€34',
    description: 'Seven-hour slow-roasted lamb shoulder'
  },
  'paris-48': {
    name: 'Sole Meunière',
    price: '€36',
    description: 'Dover sole in brown butter, a French classic'
  },
  'paris-49': {
    name: 'Canard Confit',
    price: '€26',
    description: 'Traditional duck confit with Sarladaise potatoes'
  },
  'paris-50': {
    name: 'Risotto aux Truffes',
    price: '€30',
    description: 'Italian-French fusion truffle risotto'
  },
  'paris-51': {
    name: 'Tartare de Boeuf',
    price: '€22',
    description: 'Hand-cut beef tartare prepared tableside'
  },

  // === BAKERIES (12) ===
  'paris-26': {
    name: 'Baba au Rhum',
    price: '€7',
    description: 'Invented here in 1730, rum-soaked sponge cake'
  },
  'paris-27': {
    name: 'Pain Poilâne Sourdough',
    price: '€11',
    description: 'Iconic wood-fired sourdough since 1932'
  },
  'paris-28': {
    name: 'Croissant',
    price: '€1.50',
    description: 'Best croissant winner'
  },
  'paris-29': {
    name: 'Honey Croissant',
    price: '€2',
    description: 'Organic flours with natural sourdough'
  },
  'paris-30': {
    name: 'Pain des Amis',
    price: '€6',
    description: 'Escargot pistachio-chocolate pastry'
  },
  'paris-31': {
    name: 'Praline Brioche',
    price: '€4',
    description: 'Cream puffs are legendary'
  },
  'paris-32': {
    name: 'Black Sesame Pain au Chocolat',
    price: '€3',
    description: 'Taiwanese-French fusion pastry'
  },
  'paris-33': {
    name: 'Jet Black Sesame Roll',
    price: '€4',
    description: 'Artistic bread designs, tea-infused loaves'
  },
  'paris-34': {
    name: 'Crookie',
    price: '€7',
    description: 'Famous for inventing the crookie'
  },
  'paris-35': {
    name: 'Heirloom Grain Loaf',
    price: '€5',
    description: 'Stone-milled flours in Frenchie\'s food street'
  },
  'paris-36': {
    name: 'Pain au Chocolat Praliné',
    price: '€3.50',
    description: 'Organic ingredients with stunning tarts'
  },
  'paris-37': {
    name: 'New York Roll',
    price: '€4',
    description: 'Ancient flour varieties, unique cruffins'
  },
  'paris-38': {
    name: 'Traditional Baguette',
    price: '€1.30',
    description: '2025 Best Baguette winner'
  },
  'paris-39': {
    name: 'Butter Croissant',
    price: '€1.60',
    description: '2015 Best Croissant winner with Charentes-Poitou butter'
  },

  // === PATISSERIES (5) ===
  'paris-40': {
    name: 'Lemon Tart Flower',
    price: '€11',
    description: 'Instagram-worthy sculptural pastries'
  },
  'paris-41': {
    name: 'Mont-Blanc',
    price: '€10',
    description: 'Historic chestnut dessert since 1903'
  },
  'paris-42': {
    name: 'Tarte au Citron',
    price: '€8',
    description: 'Award-winning pastry chef'
  },
  'paris-43': {
    name: 'Paris-Brest',
    price: '€7',
    description: 'Classic hazelnut praline choux pastry'
  }
};

// ============================================================================
// LOCAL TIPS
// ============================================================================

export const parisLocalTips: Record<string, string> = {
  // === RESTAURANTS (25) ===
  'paris-1': 'Queue opens 11:30am weekdays, arrive early or expect 30min wait',
  'paris-2': 'Reserve by phone only, no online bookings, best for lunch walk-ins',
  'paris-3': 'Single nightly tasting menu, arrive at 7pm for bar seats without reservation',
  'paris-4': 'Share the rice pudding dessert, portions are huge, loud atmosphere',
  'paris-5': 'Book exactly 2 weeks ahead at 10am, Wednesday releases are easiest',
  'paris-6': 'No reservations for lunch, queue before noon, dinner requires advance booking',
  'paris-7': 'Book 6 weeks ahead, visit Frenchie Wine Bar next door for walk-ins',
  'paris-8': 'Request cellar seating for AC in summer, meat cooked over open fire',
  'paris-9': 'Cash only, no reservations except groups, locals\' secret spot',
  'paris-10': 'Try the complete galette with egg, ask for organic cider pairing',
  'paris-11': 'Authentic Breton crepes, order cider in bowls like locals do',
  'paris-12': 'Iconic 1896 decor, no reservations, expect queues but turnover is fast',
  'paris-13': 'Order the bottomless chocolate mousse, outdoor terrace is prime seating',
  'paris-14': 'Arrive at 7pm sharp for walk-in bar seats, terrine is complimentary starter',
  'paris-15': 'Order one dish per temperature category, industrial-chic vibe',
  'paris-16': 'Exceptional wine list, sommelier recommendations are stellar, reserve ahead',
  'paris-17': 'Husband-wife duo, only open lunch, book 4 weeks ahead',
  'paris-18': 'Worth the 40min train ride, garden vegetables from their own farm',
  'paris-19': 'No reservations, pleasant lunch spot, less touristy than surroundings',
  'paris-20': 'Library atmosphere across from Louvre, perfect post-museum lunch',
  'paris-21': 'Japanese chef\'s refined French cuisine, stunning presentation',
  'paris-22': 'Grand Palais terrace views, reserve for outdoor seating months ahead',
  'paris-23': 'Only 2 dishes on menu, locals line up daily, closes early afternoon',
  'paris-24': 'Authentic Korean, open continuously Sat-Sun, great for couples',
  'paris-25': 'Natural wine focus, share multiple small plates, reserve online',
  // === WESTERN PARIS (8) ===
  'paris-44': 'Classic 7th arr. bistro near Rue Cler market, reserve for dinner, terrace in summer',
  'paris-45': 'Locals-only spot, no English menu, point at what others are having, cash preferred',
  'paris-46': 'Elegant but not stuffy, great value lunch menu at €22, near Champ de Mars',
  'paris-47': 'Hidden behind Place du Trocadéro, book 3 days ahead, Sunday lamb is legendary',
  'paris-48': 'Old-school Parisian brasserie, open late, seafood platters worth sharing',
  'paris-49': 'Southwest French cuisine near Invalides, generous portions, outdoor courtyard',
  'paris-50': 'Italian-trained French chef, intimate 20-seat room, wine pairing recommended',
  'paris-51': 'Walk from Galeries Lafayette, local lunch crowd, tartare prepared at your table',

  // === BAKERIES (12) ===
  'paris-26': 'Oldest patisserie in Paris since 1730, try the invented-here rum baba',
  'paris-27': 'Ina Garten\'s favorite, wood-fired ovens since 1932, iconic round loaves',
  'paris-28': 'Best croissant winner, line forms early, Place Maubert market nearby',
  'paris-29': 'Organic flours, natural sourdough, stunning ceiling moldings in shop',
  'paris-30': 'Escargot pistachio-chocolate pastry is iconic, arrive before 11am',
  'paris-31': 'Hip bakery, cream puffs are legendary, cozy neighborhood vibe',
  'paris-32': 'Taiwanese-French fusion, artistic bread shaping, closed Monday',
  'paris-33': 'Artistic bread designs, tea-infused loaves, worth the trek',
  'paris-34': 'Famous for inventing the crookie, also a sit-down restaurant',
  'paris-35': 'In Frenchie\'s food street, stone-milled flours, walk to wine bar after',
  'paris-36': '15min walk from Sacré-Coeur, organic ingredients, stunning tarts',
  'paris-37': 'Ancient flour varieties, perfect for park picnic, unique cruffins',
  'paris-38': '2025 Best Baguette winner, multiple locations but this one won',
  'paris-39': '2015 Best Croissant winner, Charentes-Poitou butter, arrive early',

  // === PATISSERIES (5) ===
  'paris-40': 'Reserve tearoom table upstairs to skip 1-hour queue, Instagram-worthy',
  'paris-41': 'Historic tearoom since 1903, famous hot chocolate, make reservations',
  'paris-42': 'Award-winning pastry chef, 20 years in Paris, neighborhood favorite',
  'paris-43': 'Every French classic perfected, chocolate eclair is outstanding'
};

// ============================================================================
// RESTAURANT METADATA
// ============================================================================

import { isRestaurantOpen, WeeklyHours } from '../../utils/hoursChecker';

// Standard hours templates by restaurant type (Paris/European)
const STANDARD_HOURS: Record<string, WeeklyHours> = {
  restaurant: {
    monday: [{ open: '12:00', close: '14:30' }, { open: '19:00', close: '22:30' }],
    tuesday: [{ open: '12:00', close: '14:30' }, { open: '19:00', close: '22:30' }],
    wednesday: [{ open: '12:00', close: '14:30' }, { open: '19:00', close: '22:30' }],
    thursday: [{ open: '12:00', close: '14:30' }, { open: '19:00', close: '22:30' }],
    friday: [{ open: '12:00', close: '14:30' }, { open: '19:00', close: '23:00' }],
    saturday: [{ open: '12:00', close: '14:30' }, { open: '19:00', close: '23:00' }],
    sunday: [{ open: '12:00', close: '14:30' }, { open: '19:00', close: '22:00' }],
  },
  bakery: {
    monday: [{ open: '07:00', close: '14:30' }],
    tuesday: [{ open: '07:00', close: '14:30' }],
    wednesday: [{ open: '07:00', close: '14:30' }],
    thursday: [{ open: '07:00', close: '14:30' }],
    friday: [{ open: '07:00', close: '14:30' }],
    saturday: [{ open: '07:30', close: '15:00' }],
    sunday: [{ open: '07:30', close: '13:00' }],
  },
  patisserie: {
    monday: [{ open: '08:00', close: '19:00' }],
    tuesday: [{ open: '08:00', close: '19:00' }],
    wednesday: [{ open: '08:00', close: '19:00' }],
    thursday: [{ open: '08:00', close: '19:00' }],
    friday: [{ open: '08:00', close: '19:00' }],
    saturday: [{ open: '08:00', close: '19:30' }],
    sunday: [{ open: '09:00', close: '18:00' }],
  },
};

function getWeeklyHours(type: string, closedDay?: string): WeeklyHours {
  const base: WeeklyHours = { ...(STANDARD_HOURS[type] || STANDARD_HOURS.restaurant) };
  if (closedDay) {
    base[closedDay] = 'closed';
  }
  return base;
}

export const parisRestaurantMetadata: Record<string, {
  name: string;
  address: string;
  coordinates: { latitude: number; longitude: number };
  neighborhood: string;
  type: 'restaurant' | 'bakery' | 'patisserie';
  cuisineTypes: string[];
  rating: number;
  reviewCount: number;
  closedDay?: string;
}> = {
  // === RESTAURANTS (25) ===
  'paris-1': {
    name: 'L\'As du Fallafel',
    address: '34 Rue des Rosiers',
    coordinates: { latitude: 48.8574, longitude: 2.3590 },
    neighborhood: 'Marais (4th)',
    type: 'restaurant',
    cuisineTypes: ['Middle Eastern', 'Israeli', 'Vegetarian'],
    rating: 4.3,
    reviewCount: 24000
  },
  'paris-2': {
    name: 'Bistrot Paul Bert',
    address: '18 Rue Paul Bert',
    coordinates: { latitude: 48.8522, longitude: 2.3849 },
    neighborhood: 'Bastille (11th)',
    type: 'restaurant',
    cuisineTypes: ['French', 'Bistro'],
    rating: 4.0,
    reviewCount: 1400
  },
  'paris-3': {
    name: 'Le Châteaubriand',
    address: '129 Avenue Parmentier',
    coordinates: { latitude: 48.8679, longitude: 2.3757 },
    neighborhood: 'Belleville (11th)',
    type: 'restaurant',
    cuisineTypes: ['French', 'Contemporary'],
    rating: 4.4,
    reviewCount: 1200
  },
  'paris-4': {
    name: 'Chez L\'Ami Jean',
    address: '27 Rue Malar',
    coordinates: { latitude: 48.8589, longitude: 2.3059 },
    neighborhood: 'Eiffel Tower (7th)',
    type: 'restaurant',
    cuisineTypes: ['French', 'Basque'],
    rating: 4.5,
    reviewCount: 2800
  },
  'paris-5': {
    name: 'Septime',
    address: '80 Rue de Charonne',
    coordinates: { latitude: 48.8531, longitude: 2.3817 },
    neighborhood: 'Bastille (11th)',
    type: 'restaurant',
    cuisineTypes: ['French', 'Contemporary'],
    rating: 4.6,
    reviewCount: 850
  },
  'paris-6': {
    name: 'Le Comptoir du Relais',
    address: '9 Carrefour de l\'Odéon',
    coordinates: { latitude: 48.8515, longitude: 2.3391 },
    neighborhood: 'Saint-Germain (6th)',
    type: 'restaurant',
    cuisineTypes: ['French', 'Bistro'],
    rating: 4.3,
    reviewCount: 3200
  },
  'paris-7': {
    name: 'Frenchie',
    address: '5 Rue du Nil',
    coordinates: { latitude: 48.8677, longitude: 2.3481 },
    neighborhood: 'Sentier (2nd)',
    type: 'restaurant',
    cuisineTypes: ['French', 'Contemporary'],
    rating: 4.4,
    reviewCount: 980
  },
  'paris-8': {
    name: 'Robert et Louise',
    address: '64 Rue Vieille du Temple',
    coordinates: { latitude: 48.8599, longitude: 2.3624 },
    neighborhood: 'Marais (3rd)',
    type: 'restaurant',
    cuisineTypes: ['French', 'Grill'],
    rating: 4.4,
    reviewCount: 1850
  },
  'paris-9': {
    name: 'Le Baratin',
    address: '3 Rue Jouye-Rouve',
    coordinates: { latitude: 48.8743, longitude: 2.3898 },
    neighborhood: 'Belleville (20th)',
    type: 'restaurant',
    cuisineTypes: ['French', 'Bistro'],
    rating: 4.5,
    reviewCount: 650
  },
  'paris-10': {
    name: 'Breizh Café',
    address: '109 Rue Vieille du Temple',
    coordinates: { latitude: 48.8613, longitude: 2.3632 },
    neighborhood: 'Marais (3rd)',
    type: 'restaurant',
    cuisineTypes: ['French', 'Creperie', 'Breton'],
    rating: 4.4,
    reviewCount: 4500
  },
  'paris-11': {
    name: 'Le Petit Josselin',
    address: '59 Rue du Montparnasse',
    coordinates: { latitude: 48.8440, longitude: 2.3256 },
    neighborhood: 'Montparnasse (14th)',
    type: 'restaurant',
    cuisineTypes: ['French', 'Creperie', 'Breton'],
    rating: 4.5,
    reviewCount: 1200
  },
  'paris-12': {
    name: 'Bouillon Chartier',
    address: '7 Rue du Faubourg Montmartre',
    coordinates: { latitude: 48.8719, longitude: 2.3427 },
    neighborhood: 'Grands Boulevards (9th)',
    type: 'restaurant',
    cuisineTypes: ['French', 'Brasserie'],
    rating: 4.1,
    reviewCount: 12000
  },
  'paris-13': {
    name: 'Chez Janou',
    address: '2 Rue Roger Verlomme',
    coordinates: { latitude: 48.8552, longitude: 2.3665 },
    neighborhood: 'Marais (3rd)',
    type: 'restaurant',
    cuisineTypes: ['French', 'Provençal'],
    rating: 4.3,
    reviewCount: 5200
  },
  'paris-14': {
    name: 'La Régalade Saint-Honoré',
    address: '106 Rue Saint-Honoré',
    coordinates: { latitude: 48.8621, longitude: 2.3410 },
    neighborhood: 'Louvre (1st)',
    type: 'restaurant',
    cuisineTypes: ['French', 'Basque'],
    rating: 4.5,
    reviewCount: 880
  },
  'paris-15': {
    name: 'Elbi',
    address: '54 Rue de Paradis',
    coordinates: { latitude: 48.8753, longitude: 2.3509 },
    neighborhood: 'République (10th)',
    type: 'restaurant',
    cuisineTypes: ['Egyptian', 'Mediterranean'],
    rating: 4.6,
    reviewCount: 420
  },
  'paris-16': {
    name: 'Le Bon Georges',
    address: '45 Rue Saint-Georges',
    coordinates: { latitude: 48.8784, longitude: 2.3382 },
    neighborhood: 'Montmartre (9th)',
    type: 'restaurant',
    cuisineTypes: ['French', 'Bistro'],
    rating: 4.5,
    reviewCount: 920
  },
  'paris-17': {
    name: 'Mokochaya',
    address: '66 Rue de la Roquette',
    coordinates: { latitude: 48.8549, longitude: 2.3737 },
    neighborhood: 'Charonne (11th)',
    type: 'restaurant',
    cuisineTypes: ['Japanese', 'French Fusion'],
    rating: 4.7,
    reviewCount: 380
  },
  'paris-18': {
    name: 'Le Doyenné',
    address: '5 Rue Saint-Antoine',
    coordinates: { latitude: 48.5489, longitude: 2.3311 },
    neighborhood: 'Saint-Vrain (91)',
    type: 'restaurant',
    cuisineTypes: ['French', 'Farm-to-Table'],
    rating: 4.8,
    reviewCount: 240
  },
  'paris-19': {
    name: 'Café Charlotte',
    address: '38 Rue de Bretagne',
    coordinates: { latitude: 48.8629, longitude: 2.3637 },
    neighborhood: 'Marais (3rd)',
    type: 'restaurant',
    cuisineTypes: ['French', 'Café'],
    rating: 4.3,
    reviewCount: 980
  },
  'paris-20': {
    name: 'Le Fumoir',
    address: '6 Rue de l\'Amiral de Coligny',
    coordinates: { latitude: 48.8607, longitude: 2.3406 },
    neighborhood: 'Louvre (1st)',
    type: 'restaurant',
    cuisineTypes: ['French', 'Bar'],
    rating: 4.2,
    reviewCount: 3400
  },
  'paris-21': {
    name: 'Passionné',
    address: '18 Rue Taitbout',
    coordinates: { latitude: 48.8729, longitude: 2.3350 },
    neighborhood: 'Opéra (9th)',
    type: 'restaurant',
    cuisineTypes: ['Japanese', 'French Fusion'],
    rating: 4.6,
    reviewCount: 520
  },
  'paris-22': {
    name: 'Le Grand Café',
    address: '3 Avenue du Général Eisenhower',
    coordinates: { latitude: 48.8661, longitude: 2.3131 },
    neighborhood: 'Champs-Élysées (8th)',
    type: 'restaurant',
    cuisineTypes: ['French', 'Brasserie'],
    rating: 4.2,
    reviewCount: 1650
  },
  'paris-23': {
    name: 'Pho 14',
    address: '3 Rue Volta',
    coordinates: { latitude: 48.8635, longitude: 2.3598 },
    neighborhood: 'Marais (3rd)',
    type: 'restaurant',
    cuisineTypes: ['Vietnamese'],
    rating: 4.4,
    reviewCount: 2100
  },
  'paris-24': {
    name: 'Korean BBQ Gokmaru',
    address: '61 Rue des Gravilliers',
    coordinates: { latitude: 48.8635, longitude: 2.3558 },
    neighborhood: 'Marais (3rd)',
    type: 'restaurant',
    cuisineTypes: ['Korean', 'BBQ'],
    rating: 4.3,
    reviewCount: 650
  },
  'paris-25': {
    name: 'Parcelles',
    address: '62 Rue des Martyrs',
    coordinates: { latitude: 48.8815, longitude: 2.3390 },
    neighborhood: 'Grands Boulevards (10th)',
    type: 'restaurant',
    cuisineTypes: ['French', 'Natural Wine'],
    rating: 4.5,
    reviewCount: 740
  },

  // === BAKERIES (12) ===
  'paris-26': {
    name: 'Stohrer',
    address: '51 Rue Montorgueil',
    coordinates: { latitude: 48.8643, longitude: 2.3465 },
    neighborhood: 'Sentier (2nd)',
    type: 'patisserie',
    cuisineTypes: ['French Pastry'],
    rating: 4.5,
    reviewCount: 8200
  },
  'paris-27': {
    name: 'Poilâne',
    address: '8 Rue du Cherche-Midi',
    coordinates: { latitude: 48.8515, longitude: 2.3269 },
    neighborhood: 'Saint-Germain (6th)',
    type: 'bakery',
    cuisineTypes: ['Bakery', 'Sourdough'],
    rating: 4.6,
    reviewCount: 3500
  },
  'paris-28': {
    name: 'La Maison d\'Isabelle',
    address: '47 Rue de la Montagne Sainte-Geneviève',
    coordinates: { latitude: 48.8476, longitude: 2.3468 },
    neighborhood: 'Latin Quarter (5th)',
    type: 'bakery',
    cuisineTypes: ['Bakery', 'Viennoiserie'],
    rating: 4.6,
    reviewCount: 2400
  },
  'paris-29': {
    name: 'Sain Boulangerie',
    address: '13 Rue Alibert',
    coordinates: { latitude: 48.8692, longitude: 2.3695 },
    neighborhood: 'République (10th)',
    type: 'bakery',
    cuisineTypes: ['Bakery', 'Organic'],
    rating: 4.7,
    reviewCount: 1850
  },
  'paris-30': {
    name: 'Du Pain et Des Idées',
    address: '34 Rue Yves Toudic',
    coordinates: { latitude: 48.8699, longitude: 2.3638 },
    neighborhood: 'Canal St-Martin (10th)',
    type: 'bakery',
    cuisineTypes: ['Bakery', 'Viennoiserie'],
    rating: 4.6,
    reviewCount: 5800
  },
  'paris-31': {
    name: 'Mamiche',
    address: '42 Rue Condorcet',
    coordinates: { latitude: 48.8828, longitude: 2.3445 },
    neighborhood: 'Montmartre (9th)',
    type: 'bakery',
    cuisineTypes: ['Bakery', 'Hip'],
    rating: 4.6,
    reviewCount: 2300
  },
  'paris-32': {
    name: 'Petite Île',
    address: '8 Rue des Filles du Calvaire',
    coordinates: { latitude: 48.8613, longitude: 2.3667 },
    neighborhood: 'Marais (3rd)',
    type: 'bakery',
    cuisineTypes: ['Bakery', 'Taiwanese-French'],
    rating: 4.5,
    reviewCount: 1280
  },
  'paris-33': {
    name: 'Boulangerie Utopie',
    address: '20 Rue Jean-Pierre Timbaud',
    coordinates: { latitude: 48.8650, longitude: 2.3745 },
    neighborhood: 'Oberkampf (11th)',
    type: 'bakery',
    cuisineTypes: ['Bakery', 'Creative'],
    rating: 4.7,
    reviewCount: 920
  },
  'paris-34': {
    name: 'Maison Louvard',
    address: '85 Rue Amelot',
    coordinates: { latitude: 48.8616, longitude: 2.3700 },
    neighborhood: 'République (11th)',
    type: 'bakery',
    cuisineTypes: ['Bakery', 'Innovative'],
    rating: 4.6,
    reviewCount: 1540
  },
  'paris-35': {
    name: 'Terroirs d\'Avenir',
    address: '3 Rue du Nil',
    coordinates: { latitude: 48.8673, longitude: 2.3482 },
    neighborhood: 'Sentier (2nd)',
    type: 'bakery',
    cuisineTypes: ['Bakery', 'Heirloom Grains'],
    rating: 4.5,
    reviewCount: 980
  },
  'paris-36': {
    name: 'Atelier P1',
    address: '157 Rue Marcadet',
    coordinates: { latitude: 48.8920, longitude: 2.3398 },
    neighborhood: 'Montmartre (18th)',
    type: 'bakery',
    cuisineTypes: ['Bakery', 'Organic'],
    rating: 4.8,
    reviewCount: 850
  },
  'paris-37': {
    name: 'Boulangerie Milligramme',
    address: '49 Rue de la Chine',
    coordinates: { latitude: 48.8758, longitude: 2.3996 },
    neighborhood: 'Buttes-Chaumont (20th)',
    type: 'bakery',
    cuisineTypes: ['Bakery', 'Ancient Grains'],
    rating: 4.6,
    reviewCount: 740
  },
  'paris-38': {
    name: 'La Parisienne',
    address: '12 Rue du Faubourg Poissonnière',
    coordinates: { latitude: 48.8740, longitude: 2.3487 },
    neighborhood: 'Faubourg Poissonnière (10th)',
    type: 'bakery',
    cuisineTypes: ['Bakery', 'Award-Winning'],
    rating: 4.5,
    reviewCount: 3200
  },
  'paris-39': {
    name: 'Tout Autour du Pain',
    address: '59 Rue de Bretagne',
    coordinates: { latitude: 48.8633, longitude: 2.3640 },
    neighborhood: 'Marais (3rd)',
    type: 'bakery',
    cuisineTypes: ['Bakery', 'Award-Winning'],
    rating: 4.6,
    reviewCount: 1420
  },

  // === PATISSERIES (5) ===
  'paris-40': {
    name: 'Cédric Grolet Opéra',
    address: '35 Avenue de l\'Opéra',
    coordinates: { latitude: 48.8692, longitude: 2.3335 },
    neighborhood: 'Opéra (2nd)',
    type: 'patisserie',
    cuisineTypes: ['French Pastry', 'High-End'],
    rating: 4.4,
    reviewCount: 6500
  },
  'paris-41': {
    name: 'Angelina',
    address: '226 Rue de Rivoli',
    coordinates: { latitude: 48.8650, longitude: 2.3289 },
    neighborhood: 'Louvre (1st)',
    type: 'patisserie',
    cuisineTypes: ['French Pastry', 'Tearoom'],
    rating: 4.3,
    reviewCount: 15000
  },
  'paris-42': {
    name: 'Arnaud Larher',
    address: '53 Rue Caulaincourt',
    coordinates: { latitude: 48.8875, longitude: 2.3342 },
    neighborhood: 'Bastille (11th)',
    type: 'patisserie',
    cuisineTypes: ['French Pastry', 'Award-Winning'],
    rating: 4.6,
    reviewCount: 1850
  },
  'paris-43': {
    name: 'Boulangerie Bo',
    address: '3 Rue de Turenne',
    coordinates: { latitude: 48.8562, longitude: 2.3640 },
    neighborhood: 'Marais (3rd)',
    type: 'patisserie',
    cuisineTypes: ['French Pastry', 'Classic'],
    rating: 4.5,
    reviewCount: 2100
  },

  // === WESTERN PARIS RESTAURANTS (8) — along Galeries Lafayette → Eiffel Tower corridor ===
  'paris-44': {
    name: 'Café Constant',
    address: '139 Rue Saint-Dominique',
    coordinates: { latitude: 48.8571, longitude: 2.3037 },
    neighborhood: 'Eiffel Tower (7th)',
    type: 'restaurant',
    cuisineTypes: ['French', 'Bistro'],
    rating: 4.4,
    reviewCount: 4200
  },
  'paris-45': {
    name: 'Au Petit Cler',
    address: '29 Rue Cler',
    coordinates: { latitude: 48.8573, longitude: 2.3067 },
    neighborhood: 'Eiffel Tower (7th)',
    type: 'restaurant',
    cuisineTypes: ['French', 'Traditional'],
    rating: 4.3,
    reviewCount: 1800
  },
  'paris-46': {
    name: 'Le Petit Troquet',
    address: '28 Rue de l\'Exposition',
    coordinates: { latitude: 48.8568, longitude: 2.3025 },
    neighborhood: 'Eiffel Tower (7th)',
    type: 'restaurant',
    cuisineTypes: ['French', 'Contemporary'],
    rating: 4.5,
    reviewCount: 1200
  },
  'paris-47': {
    name: 'Les Marches',
    address: '5 Rue de la Manutention',
    coordinates: { latitude: 48.8633, longitude: 2.2937 },
    neighborhood: 'Trocadéro (16th)',
    type: 'restaurant',
    cuisineTypes: ['French', 'Brasserie'],
    rating: 4.3,
    reviewCount: 2100
  },
  'paris-48': {
    name: 'Le Scheffer',
    address: '22 Rue Scheffer',
    coordinates: { latitude: 48.8631, longitude: 2.2862 },
    neighborhood: 'Trocadéro (16th)',
    type: 'restaurant',
    cuisineTypes: ['French', 'Seafood'],
    rating: 4.4,
    reviewCount: 1500
  },
  'paris-49': {
    name: 'Café de l\'Homme',
    address: '17 Place du Trocadéro',
    coordinates: { latitude: 48.8621, longitude: 2.2878 },
    neighborhood: 'Trocadéro (16th)',
    type: 'restaurant',
    cuisineTypes: ['French', 'Modern'],
    rating: 4.2,
    reviewCount: 3500
  },
  'paris-50': {
    name: 'L\'Affable',
    address: '10 Rue de Saint-Simon',
    coordinates: { latitude: 48.8566, longitude: 2.3199 },
    neighborhood: 'Saint-Germain (7th)',
    type: 'restaurant',
    cuisineTypes: ['French', 'Italian'],
    rating: 4.5,
    reviewCount: 980
  },
  'paris-51': {
    name: 'Le Bouquet de Montmartre',
    address: '12 Rue Lafayette',
    coordinates: { latitude: 48.8726, longitude: 2.3355 },
    neighborhood: 'Opéra (9th)',
    type: 'restaurant',
    cuisineTypes: ['French', 'Bistro'],
    rating: 4.3,
    reviewCount: 1600
  }
};

// ============================================================================
// CLOSED DAYS (per restaurant — most Paris restaurants close Sunday or Monday)
// ============================================================================

const parisClosedDays: Record<string, string> = {
  // Restaurants — commonly closed Sunday or Monday
  'paris-1': 'saturday',    // L'As du Fallafel (closed Shabbat)
  'paris-2': 'monday',      // Bistrot Paul Bert
  'paris-3': 'sunday',      // Le Châteaubriand
  'paris-4': 'sunday',      // Chez L'Ami Jean
  'paris-5': 'sunday',      // Septime
  'paris-6': 'sunday',      // Le Comptoir du Relais
  'paris-7': 'monday',      // Frenchie
  'paris-8': 'monday',      // Robert et Louise
  'paris-9': 'monday',      // Le Baratin
  'paris-12': 'sunday',     // Bouillon Chartier — actually open daily, remove?
  'paris-14': 'sunday',     // La Régalade Saint-Honoré
  'paris-16': 'monday',     // Le Bon Georges
  'paris-18': 'sunday',     // Le Doyenné
  'paris-20': 'monday',     // Le Fumoir
  'paris-22': 'monday',     // Le Grand Café
  // Bakeries — commonly closed Sunday or Monday
  'paris-26': 'sunday',     // Poilâne
  'paris-28': 'monday',     // Sain Boulangerie
  'paris-30': 'monday',     // Mamiche
  'paris-32': 'monday',     // Boulangerie Utopie
  'paris-34': 'monday',     // Terroirs d'Avenir
  'paris-36': 'monday',     // Boulangerie Milligramme
  // Patisseries
  'paris-39': 'tuesday',    // Arnaud Larher
  // Western Paris
  'paris-44': 'sunday',     // Café Constant
  'paris-46': 'sunday',     // Le Petit Troquet
  'paris-48': 'monday',     // Le Scheffer
  'paris-50': 'sunday',     // L'Affable
};

// ============================================================================
// ASSEMBLED ENHANCED RESTAURANTS
// ============================================================================

/**
 * Converts manual curation data into EnhancedRestaurant objects
 * This is what the hybrid engine will use when you select Paris
 */
/**
 * Determine reservation requirements based on restaurant characteristics
 */
function getReservationInfo(id: string, metadata: typeof parisRestaurantMetadata[string], localTip: string): {
  reservationRequired: 'none' | 'recommended' | 'essential';
  reservationLeadDays?: number;
  reservationNotes?: string;
} {
  // Essential reservations (high-end tasting menus, Michelin-quality)
  const essentialReservations: Record<string, { days: number; notes: string }> = {
    'paris-3': { days: 21, notes: 'Book weeks ahead or arrive 7pm for bar seats' },
    'paris-5': { days: 14, notes: 'Book exactly 2 weeks ahead at 10am, Wednesday releases easiest' },
    'paris-7': { days: 42, notes: 'Book 6 weeks ahead online, or try Frenchie Wine Bar for walk-ins' },
    'paris-17': { days: 28, notes: 'Lunch only, book 4 weeks ahead' },
    'paris-18': { days: 14, notes: 'Worth advance planning, 40min train ride' },
    'paris-22': { days: 60, notes: 'Reserve months ahead for terrace seating at Grand Palais' }
  };

  // Recommended reservations (popular bistros, moderate difficulty)
  const recommendedReservations: Record<string, { days: number; notes: string }> = {
    'paris-2': { days: 3, notes: 'Reserve by phone only, no online. Lunch walk-ins easier' },
    'paris-4': { days: 7, notes: 'Arrive 7pm for bar seats without reservation' },
    'paris-6': { days: 7, notes: 'No reservations lunch, dinner requires advance booking' },
    'paris-8': { days: 5, notes: 'Request cellar seating for AC in summer' },
    'paris-14': { days: 3, notes: 'Arrive 7pm sharp for walk-in bar seats' },
    'paris-15': { days: 7, notes: 'Book online for peak times' },
    'paris-16': { days: 5, notes: 'Reserve ahead for best wine pairings' },
    'paris-21': { days: 14, notes: 'Japanese chef\'s refined French cuisine, book ahead' },
    'paris-25': { days: 7, notes: 'Natural wine bar, reserve online for dinner' }
  };

  // High-end patisseries with tearooms
  const patisserieReservations: Record<string, { days: number; notes: string }> = {
    'paris-40': { days: 3, notes: 'Reserve tearoom table upstairs to skip 1-hour queue' },
    'paris-41': { days: 7, notes: 'Historic tearoom, reservations recommended for peak times' }
  };

  if (essentialReservations[id]) {
    return {
      reservationRequired: 'essential',
      reservationLeadDays: essentialReservations[id].days,
      reservationNotes: essentialReservations[id].notes
    };
  }

  if (recommendedReservations[id]) {
    return {
      reservationRequired: 'recommended',
      reservationLeadDays: recommendedReservations[id].days,
      reservationNotes: recommendedReservations[id].notes
    };
  }

  if (patisserieReservations[id]) {
    return {
      reservationRequired: 'recommended',
      reservationLeadDays: patisserieReservations[id].days,
      reservationNotes: patisserieReservations[id].notes
    };
  }

  // Default: no reservations needed (casual spots, bakeries, queue-based)
  return {
    reservationRequired: 'none'
  };
}

export function getParisRestaurants(): EnhancedRestaurant[] {
  return Object.keys(parisRestaurantMetadata).map(id => {
    const metadata = parisRestaurantMetadata[id];
    const signatureDish = parisSignatureDishes[id];
    const localTip = parisLocalTips[id];
    const reservationInfo = getReservationInfo(id, metadata, localTip);

    const weeklyHours = getWeeklyHours(metadata.type, parisClosedDays[id]);

    return {
      id,
      name: metadata.name,
      coordinates: metadata.coordinates,
      rating: metadata.rating,
      reviewCount: metadata.reviewCount,
      priceLevel: 2,
      cuisineTypes: metadata.cuisineTypes,
      address: metadata.address,
      cityId: 'paris',
      type: metadata.type,
      isOpenNow: isRestaurantOpen(weeklyHours, new Date()),
      famousFor: signatureDish ? [signatureDish.name] : [],
      safeDishes: { vegetarian: [], vegan: [] },
      weeklyHours,
      reservationRequired: reservationInfo.reservationRequired,
      reservationLeadDays: reservationInfo.reservationLeadDays,

      // Insights mapped to RestaurantInsights shape
      insights: {
        summary: signatureDish ? `Known for ${signatureDish.name}` : `Curated ${metadata.type} in Paris`,
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
