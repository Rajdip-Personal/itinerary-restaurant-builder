/**
 * Rome Restaurant Curation
 *
 * Manually curated restaurants for Rome with signature dishes,
 * local tips, and coordinates.
 *
 * Target: 20-40 establishments covering:
 * - Restaurants (traditional Roman, pizza, pasta)
 * - Trattorias
 * - Gelaterias
 * - Bakeries (pizza al taglio)
 *
 * Structure:
 * - romeSignatureDishes: What each place is famous for
 * - romeLocalTips: Practical advice (reservations, timing, ordering)
 * - romeRestaurantMetadata: Full details (coordinates, ratings, etc.)
 */

import { EnhancedRestaurant } from '../../types';
import { isRestaurantOpen, WeeklyHours } from '../../utils/hoursChecker';

// Standard hours templates by restaurant type (Rome)
const STANDARD_HOURS: Record<string, WeeklyHours> = {
  restaurant: {
    monday: [{ open: '12:30', close: '15:00' }, { open: '19:00', close: '23:00' }],
    tuesday: [{ open: '12:30', close: '15:00' }, { open: '19:00', close: '23:00' }],
    wednesday: [{ open: '12:30', close: '15:00' }, { open: '19:00', close: '23:00' }],
    thursday: [{ open: '12:30', close: '15:00' }, { open: '19:00', close: '23:00' }],
    friday: [{ open: '12:30', close: '15:00' }, { open: '19:00', close: '23:30' }],
    saturday: [{ open: '12:30', close: '15:00' }, { open: '19:00', close: '23:30' }],
    sunday: [{ open: '12:30', close: '15:00' }, { open: '19:00', close: '22:30' }],
  },
  trattoria: {
    monday: [{ open: '12:00', close: '15:00' }, { open: '19:00', close: '23:00' }],
    tuesday: [{ open: '12:00', close: '15:00' }, { open: '19:00', close: '23:00' }],
    wednesday: [{ open: '12:00', close: '15:00' }, { open: '19:00', close: '23:00' }],
    thursday: [{ open: '12:00', close: '15:00' }, { open: '19:00', close: '23:00' }],
    friday: [{ open: '12:00', close: '15:00' }, { open: '19:00', close: '23:30' }],
    saturday: [{ open: '12:00', close: '15:00' }, { open: '19:00', close: '23:30' }],
    sunday: [{ open: '12:00', close: '15:00' }],
  },
  pizzeria: {
    monday: [{ open: '12:00', close: '15:00' }, { open: '18:30', close: '23:30' }],
    tuesday: [{ open: '12:00', close: '15:00' }, { open: '18:30', close: '23:30' }],
    wednesday: [{ open: '12:00', close: '15:00' }, { open: '18:30', close: '23:30' }],
    thursday: [{ open: '12:00', close: '15:00' }, { open: '18:30', close: '23:30' }],
    friday: [{ open: '12:00', close: '15:00' }, { open: '18:30', close: '00:00' }],
    saturday: [{ open: '12:00', close: '15:00' }, { open: '18:30', close: '00:00' }],
    sunday: [{ open: '12:00', close: '15:00' }, { open: '18:30', close: '23:00' }],
  },
  gelateria: {
    monday: [{ open: '11:00', close: '23:00' }],
    tuesday: [{ open: '11:00', close: '23:00' }],
    wednesday: [{ open: '11:00', close: '23:00' }],
    thursday: [{ open: '11:00', close: '23:00' }],
    friday: [{ open: '11:00', close: '23:30' }],
    saturday: [{ open: '10:00', close: '00:00' }],
    sunday: [{ open: '10:00', close: '23:00' }],
  },
  bakery: {
    monday: [{ open: '07:00', close: '14:00' }],
    tuesday: [{ open: '07:00', close: '14:00' }],
    wednesday: [{ open: '07:00', close: '14:00' }],
    thursday: [{ open: '07:00', close: '14:00' }],
    friday: [{ open: '07:00', close: '14:00' }],
    saturday: [{ open: '07:30', close: '14:00' }],
    sunday: [{ open: '08:00', close: '13:00' }],
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

// Closed days for Rome restaurants (commonly Sunday or Monday in Rome)
const romeClosedDays: Record<string, string> = {
  'rome-1': 'saturday',    // Armando al Pantheon
  'rome-2': 'sunday',      // Da Enzo al 29
  'rome-3': 'monday',      // Roscioli
  'rome-5': 'monday',      // Flavio al Velavevodetto
  'rome-7': 'sunday',      // La Tavernaccia
  'rome-8': 'sunday',      // Trattoria Da Cesare al Casaletto
  'rome-10': 'monday',     // Ristorante Crispi 19
  'rome-13': 'sunday',     // Salumeria Roscioli (deli)
  'rome-16': 'monday',     // Supplizio
  'rome-19': 'sunday',     // Ristorante Piperno
  'rome-20': 'monday',     // Trattoria Pennestri
};

// ============================================================================
// SIGNATURE DISHES
// ============================================================================

export const romeSignatureDishes: Record<string, {
  name: string;
  price: string;
  description?: string;
}> = {
  // === RESTAURANTS (25) ===
  'rome-1': { name: 'Cacio e Pepe', price: '€35' },
  'rome-2': { name: 'Carbonara', price: '€28' },
  'rome-3': { name: 'Rigatoni con la Pajata', price: '€32' },
  'rome-4': { name: 'Chocolate Mousse with Rosemary', price: '€30' },
  'rome-5': { name: 'Carbonara', price: '€26' },
  'rome-6': { name: 'Cacio e Pepe', price: '€32' },
  'rome-7': { name: 'Gricia with Artichokes', price: '€24' },
  'rome-8': { name: 'Vegetable Tasting Menu', price: '€55' },
  'rome-9': { name: 'Fresh Pasta Made to Order', price: '€22' },
  'rome-10': { name: 'Chicken Giblets Pasta', price: '€28' },
  'rome-11': { name: 'Lasagna', price: '€18' },
  'rome-12': { name: 'Amatriciana', price: '€25' },
  'rome-13': { name: 'Maialino al Forno', price: '€34', description: 'Wood-oven roasted suckling pig' },
  'rome-14': { name: 'Gricia con Carciofi', price: '€30', description: 'Gricia with artichokes' },
  'rome-15': { name: 'Wood-Fired Pizza', price: '€18' },
  'rome-16': { name: 'Cacio e Pepe in Cheese Bowl', price: '€32' },
  'rome-17': { name: 'Amatriciana Flambé', price: '€28', description: 'Flambéed in pecorino bowl' },
  'rome-18': { name: 'Roman Platter', price: '€24' },
  'rome-19': { name: 'Squid Ink Pasta with Pork Cheek', price: '€30' },
  'rome-20': { name: 'Carbonara', price: '€26' },
  'rome-21': { name: 'Pasta Served in Pan', price: '€30' },
  'rome-22': { name: 'Housemade Tortellini', price: '€32' },
  'rome-23': { name: 'Market-Fresh Daily Menu', price: '€28' },
  'rome-24': { name: 'Fettuccine alla Romana', price: '€35' },
  'rome-25': { name: 'Seasonal Pasta Dishes', price: '€16' },

  // === BAKERIES (10) ===
  'rome-26': { name: 'Pizza Bianca', price: '€4' },
  'rome-27': { name: 'Maritozzo', price: '€3', description: 'Sweet bun with whipped cream' },
  'rome-28': { name: 'Crostata Ricotta e Visciole', price: '€6', description: 'Ricotta and sour cherry tart' },
  'rome-29': { name: 'Pizza Rossa', price: '€3' },
  'rome-30': { name: 'Artisan Biscotti', price: '€2' },
  'rome-31': { name: 'Maritozzo with Whipped Cream', price: '€3' },
  'rome-32': { name: 'Pain au Chocolat', price: '€3' },
  'rome-33': { name: 'French Croissants', price: '€3' },
  'rome-34': { name: 'Cornetti Selection', price: '€2.50' },
  'rome-35': { name: 'French-Style Pastries', price: '€4' },

  // === PATISSERIES (5) ===
  'rome-36': { name: 'Mixed Pastry Selection', price: '€5' },
  'rome-37': { name: 'International Pastries', price: '€4' },
  'rome-38': { name: 'Maritozzi Sweet & Savory', price: '€4' },
  'rome-39': { name: 'Pangiallo Romano', price: '€6', description: 'Traditional Roman Christmas cake' },
  'rome-40': { name: 'Maritozzo with Lemon Curd', price: '€5' }
};

// ============================================================================
// LOCAL TIPS
// ============================================================================

export const romeLocalTips: Record<string, string> = {
  // === RESTAURANTS (25) ===
  'rome-1': 'Book weeks ahead, closed Sundays, request half-portions to try multiple dishes',
  'rome-2': 'No reservations, arrive before 7pm or 12pm lunch, expect 30min queue',
  'rome-3': 'Reserve 2+ weeks ahead, try offal dishes, over 800 wines in cantina',
  'rome-4': 'Call ahead for reservations, natural wine selection, innovative Roman classics',
  'rome-5': 'Take tram 8 to the end, family-run since 1950s, locals\' favorite',
  'rome-6': 'Order the tableside cacio e pepe, reserve 1 week ahead, loud atmosphere',
  'rome-7': 'Hidden in ivy-covered palazzo, fried antipasti are spectacular, cash preferred',
  'rome-8': 'Modern creative cuisine, communal tables, book online 2 weeks ahead',
  'rome-9': 'Watch pasta made by hand in window, lunch less crowded, cash only',
  'rome-10': 'Young team, nose-to-tail cooking, try rabbit offal antipasto, natural wines',
  'rome-11': 'Tiny family trattoria, handful of tables, best amatriciana in Rome',
  'rome-12': 'Since 1926, historic dining room, university area, expect lively crowds',
  'rome-13': 'Wood-oven roasted suckling pig, Sunday lasagna special, reserve weekends',
  'rome-14': '5min from Piazza Navona, extensive wine list, calm escape from crowds',
  'rome-15': 'Short walk from Colosseum, budget-friendly, generous portions, family atmosphere',
  'rome-16': 'Famous cheese-bowl presentation, reserve ahead, outdoor courtyard seating',
  'rome-17': 'Since 1936, flambéed in pecorino bowl, fried zucchini flowers, reservations essential',
  'rome-18': 'Historic beer hall since 1906, near Trevi Fountain, order Peroni draft',
  'rome-19': 'Near Campo de\' Fiori, extensive Italian wine list, quality in tourist area',
  'rome-20': 'Built into Monte Testaccio hill, locals\' Sunday lunch spot, huge portions',
  'rome-21': 'Courtyard seating, generous portions, festive atmosphere, reservations recommended',
  'rome-22': 'Never a miss, signature pastas, rich desserts, Saturday lunch only',
  'rome-23': 'Old-fashioned decor, open kitchen, welcoming vibe, changes daily',
  'rome-24': 'Rome\'s oldest restaurant since 1518, near Tiber, history meets modernity',
  'rome-25': 'Steps from Cavour metro, casual lunch spot, local products, student-friendly',

  // === BAKERIES (10) ===
  'rome-26': 'Legendary bakery, arrive before noon for best selection, supply sold out by 3pm',
  'rome-27': 'Since 1916, opens 6:30am, sold out before noon, near Termini station',
  'rome-28': 'Oldest bakery in Rome 1815, kosher, Challah on Fridays, cash only',
  'rome-29': 'Always crowded, excellent olive bread, takeaway only, open all day',
  'rome-30': 'Family-run since 1920s, vintage oven, locals\' cookie shop, no tourists yet',
  'rome-31': 'Open 24/7, near Trastevere station, late-night favorite, best value',
  'rome-32': 'Near Colosseum, Scandi minimalist, daily changing savory pastries, few tables',
  'rome-33': 'French-Italian fusion, authentic European taste, underrated gem, near Porta Portese',
  'rome-34': 'Historic bakery, near Termini, huge bread selection, morning coffee ritual',
  'rome-35': 'Experimental baker Giorgia Proia, better-than-average cornetti, near ruins',

  // === PATISSERIES (5) ===
  'rome-36': 'Historic since 1925, artistic window displays, serves locals and VIPs',
  'rome-37': 'Hidden gem, open workshop, design-focused, jasmine tea chocolates',
  'rome-38': 'Hidden communal table in back, homemade cakes, outdoor morning tables',
  'rome-39': 'Since 1925, handmade chocolates, traditional Roman treats, old-school decor',
  'rome-40': 'Award-winning, lemon curd surprise in whipped cream, multiple locations'
};

// ============================================================================
// RESTAURANT METADATA
// ============================================================================

export const romeRestaurantMetadata: Record<string, {
  name: string;
  address: string;
  coordinates: { latitude: number; longitude: number };
  neighborhood: string;
  type: 'restaurant' | 'trattoria' | 'pizzeria' | 'gelateria' | 'bakery' | 'patisserie';
  cuisineTypes: string[];
  rating: number;
  reviewCount: number;
}> = {
  // === RESTAURANTS (25) ===
  'rome-1': {
    name: 'Armando al Pantheon',
    address: 'Salita dei Crescenzi 31',
    coordinates: { latitude: 41.8986, longitude: 12.4768 },
    neighborhood: 'Centro Storico',
    type: 'restaurant',
    cuisineTypes: ['Roman', 'Italian'],
    rating: 4.2,
    reviewCount: 2400
  },
  'rome-2': {
    name: 'Da Enzo al 29',
    address: 'Via dei Vascellari 29',
    coordinates: { latitude: 41.8886, longitude: 12.4693 },
    neighborhood: 'Trastevere',
    type: 'restaurant',
    cuisineTypes: ['Roman', 'Italian'],
    rating: 4.5,
    reviewCount: 8500
  },
  'rome-3': {
    name: 'Santo Palato',
    address: 'Piazza di Santa Maria Liberatrice 44',
    coordinates: { latitude: 41.8745, longitude: 12.5103 },
    neighborhood: 'San Giovanni',
    type: 'restaurant',
    cuisineTypes: ['Roman', 'Italian'],
    rating: 4.6,
    reviewCount: 1200
  },
  'rome-4': {
    name: 'Trattoria Pennestri',
    address: 'Via Giovanni da Empoli 5',
    coordinates: { latitude: 41.8659, longitude: 12.4801 },
    neighborhood: 'Ostiense',
    type: 'trattoria',
    cuisineTypes: ['Roman', 'Italian'],
    rating: 4.7,
    reviewCount: 850
  },
  'rome-5': {
    name: 'Cesare al Casaletto',
    address: 'Via del Casaletto 45',
    coordinates: { latitude: 41.8693, longitude: 12.4486 },
    neighborhood: 'Monteverde',
    type: 'restaurant',
    cuisineTypes: ['Roman', 'Italian'],
    rating: 4.4,
    reviewCount: 3200
  },
  'rome-6': {
    name: 'Felice a Testaccio',
    address: 'Via Mastro Giorgio 29',
    coordinates: { latitude: 41.8765, longitude: 12.4776 },
    neighborhood: 'Testaccio',
    type: 'restaurant',
    cuisineTypes: ['Roman', 'Italian'],
    rating: 4.3,
    reviewCount: 2800
  },
  'rome-7': {
    name: 'Trattoria Da Teo',
    address: 'Piazza dei Ponziani 7a',
    coordinates: { latitude: 41.8903, longitude: 12.4671 },
    neighborhood: 'Trastevere',
    type: 'trattoria',
    cuisineTypes: ['Roman', 'Italian'],
    rating: 4.4,
    reviewCount: 1650
  },
  'rome-8': {
    name: 'Retrobottega',
    address: 'Via della Stelletta 4',
    coordinates: { latitude: 41.9015, longitude: 12.4731 },
    neighborhood: 'Centro Storico',
    type: 'restaurant',
    cuisineTypes: ['Italian', 'Contemporary'],
    rating: 4.5,
    reviewCount: 680
  },
  'rome-9': {
    name: 'Osteria da Fortunata',
    address: 'Via del Pellegrino 11',
    coordinates: { latitude: 41.8953, longitude: 12.4707 },
    neighborhood: 'Campo de\' Fiori',
    type: 'restaurant',
    cuisineTypes: ['Roman', 'Italian', 'Pasta'],
    rating: 4.4,
    reviewCount: 4200
  },
  'rome-10': {
    name: 'Trecca',
    address: 'Via di Monte Testaccio 39',
    coordinates: { latitude: 41.8765, longitude: 12.4755 },
    neighborhood: 'Testaccio',
    type: 'restaurant',
    cuisineTypes: ['Roman', 'Italian'],
    rating: 4.6,
    reviewCount: 920
  },
  'rome-11': {
    name: 'Alfredo e Ada',
    address: 'Via dei Banchi Nuovi 14',
    coordinates: { latitude: 41.8983, longitude: 12.4678 },
    neighborhood: 'Centro Storico',
    type: 'restaurant',
    cuisineTypes: ['Roman', 'Italian'],
    rating: 4.5,
    reviewCount: 580
  },
  'rome-12': {
    name: 'Pommidoro',
    address: 'Piazza dei Sanniti 44',
    coordinates: { latitude: 41.8977, longitude: 12.5173 },
    neighborhood: 'San Lorenzo',
    type: 'restaurant',
    cuisineTypes: ['Roman', 'Italian'],
    rating: 4.3,
    reviewCount: 1400
  },
  'rome-13': {
    name: 'La Tavernaccia Da Bruno',
    address: 'Via Giovanni da Castel Bolognese 63',
    coordinates: { latitude: 41.8654, longitude: 12.4801 },
    neighborhood: 'Trastevere South',
    type: 'restaurant',
    cuisineTypes: ['Roman', 'Italian'],
    rating: 4.6,
    reviewCount: 1250
  },
  'rome-14': {
    name: 'Giulio Passami L\'Olio',
    address: 'Via di Monte Giordano 28',
    coordinates: { latitude: 41.8993, longitude: 12.4692 },
    neighborhood: 'Centro Storico',
    type: 'restaurant',
    cuisineTypes: ['Roman', 'Italian'],
    rating: 4.4,
    reviewCount: 980
  },
  'rome-15': {
    name: 'Trattoria Luzzi',
    address: 'Via di San Giovanni in Laterano 88',
    coordinates: { latitude: 41.8901, longitude: 12.4963 },
    neighborhood: 'Monti',
    type: 'trattoria',
    cuisineTypes: ['Roman', 'Italian', 'Pizza'],
    rating: 4.1,
    reviewCount: 5600
  },
  'rome-16': {
    name: 'Roma Sparita',
    address: 'Piazza di Santa Cecilia 24',
    coordinates: { latitude: 41.8874, longitude: 12.4764 },
    neighborhood: 'Trastevere',
    type: 'restaurant',
    cuisineTypes: ['Roman', 'Italian'],
    rating: 4.3,
    reviewCount: 2400
  },
  'rome-17': {
    name: 'Trattoria Vecchia Roma',
    address: 'Via Ferruccio 12',
    coordinates: { latitude: 41.8964, longitude: 12.5018 },
    neighborhood: 'Esquilino',
    type: 'trattoria',
    cuisineTypes: ['Roman', 'Italian'],
    rating: 4.4,
    reviewCount: 1800
  },
  'rome-18': {
    name: 'L\'Antica Birreria Peroni',
    address: 'Via di San Marcello 19',
    coordinates: { latitude: 41.8993, longitude: 12.4825 },
    neighborhood: 'Centro Storico',
    type: 'restaurant',
    cuisineTypes: ['Roman', 'Italian', 'Beer Hall'],
    rating: 4.2,
    reviewCount: 3500
  },
  'rome-19': {
    name: 'Ditirambo',
    address: 'Piazza della Cancelleria 74',
    coordinates: { latitude: 41.8956, longitude: 12.4713 },
    neighborhood: 'Centro Storico',
    type: 'restaurant',
    cuisineTypes: ['Roman', 'Italian'],
    rating: 4.5,
    reviewCount: 1650
  },
  'rome-20': {
    name: 'Flavio al Velavevodetto',
    address: 'Via di Monte Testaccio 97',
    coordinates: { latitude: 41.8761, longitude: 12.4761 },
    neighborhood: 'Testaccio',
    type: 'trattoria',
    cuisineTypes: ['Roman', 'Italian'],
    rating: 4.4,
    reviewCount: 2100
  },
  'rome-21': {
    name: 'Taverna Trilussa',
    address: 'Via del Politeama 23',
    coordinates: { latitude: 41.8889, longitude: 12.4681 },
    neighborhood: 'Trastevere',
    type: 'restaurant',
    cuisineTypes: ['Roman', 'Italian'],
    rating: 4.3,
    reviewCount: 3800
  },
  'rome-22': {
    name: 'Mazzo',
    address: 'Via Alessandro Severo 220',
    coordinates: { latitude: 41.8617, longitude: 12.4888 },
    neighborhood: 'Ostiense',
    type: 'restaurant',
    cuisineTypes: ['Roman', 'Italian', 'Pasta'],
    rating: 4.7,
    reviewCount: 640
  },
  'rome-23': {
    name: 'Eufrosino',
    address: 'Via dei Serpenti 91',
    coordinates: { latitude: 41.8954, longitude: 12.4951 },
    neighborhood: 'Monti',
    type: 'restaurant',
    cuisineTypes: ['Roman', 'Italian'],
    rating: 4.5,
    reviewCount: 520
  },
  'rome-24': {
    name: 'La Campana',
    address: 'Vicolo della Campana 18',
    coordinates: { latitude: 41.9013, longitude: 12.4738 },
    neighborhood: 'Centro Storico',
    type: 'restaurant',
    cuisineTypes: ['Roman', 'Italian'],
    rating: 4.3,
    reviewCount: 1200
  },
  'rome-25': {
    name: 'Pasta Urbana',
    address: 'Via Urbana 88',
    coordinates: { latitude: 41.8961, longitude: 12.4953 },
    neighborhood: 'Monti',
    type: 'restaurant',
    cuisineTypes: ['Roman', 'Italian', 'Pasta'],
    rating: 4.4,
    reviewCount: 860
  },

  // === BAKERIES (10) ===
  'rome-26': {
    name: 'Antico Forno Roscioli',
    address: 'Via dei Chiavari 34',
    coordinates: { latitude: 41.8941, longitude: 12.4729 },
    neighborhood: 'Centro Storico',
    type: 'bakery',
    cuisineTypes: ['Bakery', 'Pizza'],
    rating: 4.6,
    reviewCount: 5200
  },
  'rome-27': {
    name: 'Pasticceria Regoli',
    address: 'Via dello Statuto 60',
    coordinates: { latitude: 41.9008, longitude: 12.5046 },
    neighborhood: 'Esquilino',
    type: 'bakery',
    cuisineTypes: ['Bakery', 'Pastry'],
    rating: 4.5,
    reviewCount: 3400
  },
  'rome-28': {
    name: 'Pasticceria Boccione',
    address: 'Via del Portico d\'Ottavia 1',
    coordinates: { latitude: 41.8918, longitude: 12.4777 },
    neighborhood: 'Jewish Ghetto',
    type: 'bakery',
    cuisineTypes: ['Bakery', 'Kosher'],
    rating: 4.3,
    reviewCount: 2800
  },
  'rome-29': {
    name: 'Forno Campo de\' Fiori',
    address: 'Campo de\' Fiori 22',
    coordinates: { latitude: 41.8956, longitude: 12.4722 },
    neighborhood: 'Centro Storico',
    type: 'bakery',
    cuisineTypes: ['Bakery', 'Pizza'],
    rating: 4.4,
    reviewCount: 4600
  },
  'rome-30': {
    name: 'Biscottificio Innocenti',
    address: 'Vicolo del Cinque 21a',
    coordinates: { latitude: 41.8903, longitude: 12.4672 },
    neighborhood: 'Trastevere',
    type: 'bakery',
    cuisineTypes: ['Bakery', 'Cookies'],
    rating: 4.6,
    reviewCount: 980
  },
  'rome-31': {
    name: 'Il Maritozzaro',
    address: 'Via Ettore Rolli 50',
    coordinates: { latitude: 41.8872, longitude: 12.4723 },
    neighborhood: 'Trastevere',
    type: 'bakery',
    cuisineTypes: ['Bakery', 'Pastry'],
    rating: 4.4,
    reviewCount: 1850
  },
  'rome-32': {
    name: 'Forno Conti & Co',
    address: 'Via dei Serpenti 122',
    coordinates: { latitude: 41.8951, longitude: 12.4969 },
    neighborhood: 'Monti',
    type: 'bakery',
    cuisineTypes: ['Bakery', 'Pastry'],
    rating: 4.7,
    reviewCount: 740
  },
  'rome-33': {
    name: 'Le Levain',
    address: 'Via Luigi Santini 22',
    coordinates: { latitude: 41.8834, longitude: 12.4689 },
    neighborhood: 'Trastevere',
    type: 'bakery',
    cuisineTypes: ['Bakery', 'French'],
    rating: 4.6,
    reviewCount: 620
  },
  'rome-34': {
    name: 'Panella',
    address: 'Via Merulana 54',
    coordinates: { latitude: 41.8948, longitude: 12.5028 },
    neighborhood: 'Esquilino',
    type: 'bakery',
    cuisineTypes: ['Bakery', 'Italian'],
    rating: 4.5,
    reviewCount: 2400
  },
  'rome-35': {
    name: 'Casa Manfredi',
    address: 'Via dei Cerchi 77',
    coordinates: { latitude: 41.8852, longitude: 12.4866 },
    neighborhood: 'Circo Massimo',
    type: 'bakery',
    cuisineTypes: ['Bakery', 'Pastry'],
    rating: 4.6,
    reviewCount: 580
  },

  // === PATISSERIES (5) ===
  'rome-36': {
    name: 'Pasticceria Barberini',
    address: 'Via Marmorata 41',
    coordinates: { latitude: 41.8774, longitude: 12.4798 },
    neighborhood: 'Testaccio',
    type: 'patisserie',
    cuisineTypes: ['Pastry', 'Italian'],
    rating: 4.7,
    reviewCount: 1650
  },
  'rome-37': {
    name: 'Pasticceria Bompiani',
    address: 'Largo Benedetto Bompiani 8',
    coordinates: { latitude: 41.8632, longitude: 12.4886 },
    neighborhood: 'Garbatella',
    type: 'patisserie',
    cuisineTypes: ['Pastry', 'International'],
    rating: 4.8,
    reviewCount: 890
  },
  'rome-38': {
    name: 'Roscioli Caffè Pasticceria',
    address: 'Piazza Benedetto Cairoli 16',
    coordinates: { latitude: 41.8934, longitude: 12.4749 },
    neighborhood: 'Centro Storico',
    type: 'patisserie',
    cuisineTypes: ['Pastry', 'Café'],
    rating: 4.6,
    reviewCount: 3200
  },
  'rome-39': {
    name: 'Pasticceria Valzani',
    address: 'Via del Moro 37a',
    coordinates: { latitude: 41.8917, longitude: 12.4689 },
    neighborhood: 'Trastevere',
    type: 'patisserie',
    cuisineTypes: ['Pastry', 'Italian'],
    rating: 4.5,
    reviewCount: 1280
  },
  'rome-40': {
    name: 'Grue',
    address: 'Via di Propaganda 22',
    coordinates: { latitude: 41.9019, longitude: 12.4825 },
    neighborhood: 'Centro Storico',
    type: 'patisserie',
    cuisineTypes: ['Pastry', 'Italian'],
    rating: 4.7,
    reviewCount: 1450
  }
};

// ============================================================================
// ASSEMBLED ENHANCED RESTAURANTS
// ============================================================================

/**
 * Converts manual curation data into EnhancedRestaurant objects
 * This is what the hybrid engine will use when you select Rome
 */
export function getRomeRestaurants(): EnhancedRestaurant[] {
  return Object.keys(romeRestaurantMetadata).map(id => {
    const metadata = romeRestaurantMetadata[id];
    const signatureDish = romeSignatureDishes[id];
    const localTip = romeLocalTips[id];

    const weeklyHours = getWeeklyHours(metadata.type, romeClosedDays[id]);

    return {
      id,
      name: metadata.name,
      coordinates: metadata.coordinates,
      rating: metadata.rating,
      reviewCount: metadata.reviewCount,
      priceLevel: 2,
      cuisineTypes: metadata.cuisineTypes,
      address: metadata.address,
      cityId: 'rome',
      type: metadata.type,
      isOpenNow: isRestaurantOpen(weeklyHours, new Date()),
      famousFor: signatureDish ? [signatureDish.name] : [],
      safeDishes: { vegetarian: [], vegan: [] },
      weeklyHours,

      insights: {
        summary: signatureDish ? `Known for ${signatureDish.name}` : `Curated ${metadata.type} in Rome`,
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

// ============================================================================
// RESEARCH TEMPLATE
// ============================================================================

/**
 * Use this template when researching each restaurant:
 *
 * 1. BASIC INFO
 *    - Name
 *    - Address (get from Google Maps)
 *    - Coordinates (lat/long from Google Maps)
 *    - Neighborhood (Trastevere, Testaccio, Centro Storico, etc.)
 *    - Type (restaurant, trattoria, pizzeria, gelateria, bakery)
 *
 * 2. SIGNATURE DISH
 *    - What are they famous for?
 *    - Price (get from menu or reviews)
 *    - Brief description
 *
 * 3. LOCAL TIP
 *    - Reservation strategy (walk-in ok? book ahead? how far?)
 *    - Best time to visit (lunch vs dinner, avoid crowds)
 *    - Payment method (cash only? cards ok?)
 *    - Portion sizes, sharing recommendations
 *    - Queue/line tips
 *
 * 4. VALIDATION
 *    - Rating: 4.0+ preferred
 *    - Review count: 500+ preferred
 *    - Check Google Maps, TripAdvisor, Reddit r/rome
 *
 * 5. TOURIST TRAP SCORE (manual assessment)
 *    - 0-30: Authentic local spot
 *    - 31-50: Popular but good
 *    - 51-70: Tourist-friendly but acceptable
 *    - 71-100: Avoid (tourist trap)
 */

// ============================================================================
// ROME NEIGHBORHOOD GUIDE
// ============================================================================

/**
 * Key neighborhoods for restaurant research:
 *
 * 1. Trastevere - Traditional trattorias, nightlife
 *    - Da Enzo al 29
 *    - Tonnarello
 *    - Suppli Roma
 *
 * 2. Testaccio - Working-class, authentic Roman food
 *    - Flavio al Velavevodetto
 *    - Trapizzino
 *    - Mordi e Vai (sandwich stand)
 *
 * 3. Centro Storico - Historic center, upscale
 *    - Roscioli
 *    - Armando al Pantheon
 *    - Emma Pizzeria
 *
 * 4. Monti - Trendy, younger crowd
 *    - La Carbonara
 *    - Alle Carrette
 *
 * 5. Jewish Ghetto - Jewish-Roman cuisine
 *    - Ba'Ghetto
 *    - Nonna Betta
 *
 * 6. Prati (Vatican area) - Tourist-heavy but some gems
 *    - Bonci Pizzarium (pizza al taglio)
 *    - Dal Toscano
 */

// ============================================================================
// ROME SPECIALTY FOODS TO COVER
// ============================================================================

/**
 * Try to include variety across these Roman specialties:
 *
 * PASTA (4 classic Roman dishes):
 * - Cacio e Pepe (cheese and pepper)
 * - Carbonara (guanciale, egg, pecorino)
 * - Amatriciana (tomato, guanciale)
 * - Gricia (guanciale, pecorino - no tomato)
 *
 * PIZZA:
 * - Pizza al taglio (by the slice)
 * - Pizza tonda (round, thin crust)
 *
 * FRIED FOODS:
 * - Supplì (fried rice balls)
 * - Fiori di zucca (fried zucchini flowers)
 * - Carciofi alla giudia (Jewish-style artichokes)
 *
 * MEAT:
 * - Saltimbocca alla romana (veal with prosciutto)
 * - Coda alla vaccinara (oxtail stew)
 * - Abbacchio (Roman lamb)
 *
 * GELATO:
 * - Traditional gelaterias (avoid tourist traps with neon colors)
 *
 * PASTRIES:
 * - Maritozzo (sweet bun with whipped cream)
 * - Cornetti (Italian croissant)
 */

// ============================================================================
// FAMOUS ROME RESTAURANTS TO RESEARCH
// ============================================================================

/**
 * Starter list (verify these are good before adding):
 *
 * TRADITIONAL ROMAN:
 * - Flavio al Velavevodetto (Testaccio)
 * - Da Enzo al 29 (Trastevere)
 * - Armando al Pantheon (Centro)
 * - Felice a Testaccio
 * - Checchino dal 1887 (historic)
 *
 * PIZZA:
 * - Bonci Pizzarium (pizza al taglio)
 * - Emma Pizzeria (Centro)
 * - Pizzarium Bonci
 * - Sbanco (Roman-style)
 *
 * DELIS/BAKERIES:
 * - Roscioli (deli + restaurant)
 * - Antico Forno Roscioli (bakery)
 * - Trapizzino (pizza pocket invention)
 *
 * GELATO:
 * - Fatamorgana (artisan)
 * - Giolitti (historic)
 * - Gelateria del Teatro
 * - Il Gelato di San Crispino
 *
 * MARKETS/STREET FOOD:
 * - Mordi e Vai (Testaccio Market)
 * - Mercato Centrale Roma
 * - Supplizio (supplì specialist)
 */
