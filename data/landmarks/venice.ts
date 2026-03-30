// data/landmarks/venice.ts
// Venice landmark database for Tier 1 geocoding

import type { Landmark } from './paris';

export const VENICE_LANDMARKS: Landmark[] = [
  {
    id: 'st-marks-square',
    name: "St. Mark's Square",
    coordinates: { latitude: 45.4343, longitude: 12.3388 },
    aliases: ['Piazza San Marco', 'San Marco', "St Mark's", 'st marks square', 'piazza san marco'],
    touristMagnitude: 100,
  },
  {
    id: 'rialto-bridge',
    name: 'Rialto Bridge',
    coordinates: { latitude: 45.4380, longitude: 12.3359 },
    aliases: ['Ponte di Rialto', 'Rialto', 'rialto bridge', 'ponte rialto'],
    touristMagnitude: 95,
  },
  {
    id: 'doges-palace',
    name: "Doge's Palace",
    coordinates: { latitude: 45.4337, longitude: 12.3403 },
    aliases: ['Palazzo Ducale', "Doge's Palace", 'doges palace', 'palazzo ducale'],
    touristMagnitude: 90,
  },
  {
    id: 'bridge-of-sighs',
    name: 'Bridge of Sighs',
    coordinates: { latitude: 45.4340, longitude: 12.3410 },
    aliases: ['Ponte dei Sospiri', 'bridge of sighs'],
    touristMagnitude: 80,
  },
  {
    id: 'grand-canal',
    name: 'Grand Canal',
    coordinates: { latitude: 45.4360, longitude: 12.3350 },
    aliases: ['Canal Grande', 'grand canal', 'canal grande'],
    touristMagnitude: 75,
  },
  {
    id: 'accademia-gallery',
    name: 'Accademia Gallery',
    coordinates: { latitude: 45.4316, longitude: 12.3281 },
    aliases: ["Gallerie dell'Accademia", 'Accademia', 'accademia gallery'],
    touristMagnitude: 70,
  },
  {
    id: 'murano',
    name: 'Murano',
    coordinates: { latitude: 45.4585, longitude: 12.3518 },
    aliases: ['Murano Island', 'murano', 'glass island'],
    touristMagnitude: 70,
  },
  {
    id: 'santa-maria-salute',
    name: 'Santa Maria della Salute',
    coordinates: { latitude: 45.4306, longitude: 12.3346 },
    aliases: ['La Salute', 'Basilica di Santa Maria della Salute', 'santa maria della salute'],
    touristMagnitude: 65,
  },
  {
    id: 'burano',
    name: 'Burano',
    coordinates: { latitude: 45.4853, longitude: 12.4167 },
    aliases: ['Burano Island', 'burano', 'colorful island'],
    touristMagnitude: 65,
  },
  {
    id: 'harrys-bar',
    name: "Harry's Bar Area",
    coordinates: { latitude: 45.4329, longitude: 12.3365 },
    aliases: ["Harry's Bar", 'Cipriani', "harry's bar", 'harrys bar'],
    touristMagnitude: 60,
  },
  {
    id: 'dorsoduro',
    name: 'Dorsoduro',
    coordinates: { latitude: 45.4305, longitude: 12.3270 },
    aliases: ['Dorsoduro neighborhood', 'dorsoduro'],
    touristMagnitude: 45,
  },
  {
    id: 'san-giorgio-maggiore',
    name: 'San Giorgio Maggiore',
    coordinates: { latitude: 45.4295, longitude: 12.3435 },
    aliases: ['Church of San Giorgio Maggiore', 'san giorgio maggiore', 'san giorgio'],
    touristMagnitude: 55,
  },
  {
    id: 'ca-doro',
    name: "Ca' d'Oro",
    coordinates: { latitude: 45.4407, longitude: 12.3343 },
    aliases: ['Ca dOro', "ca' d'oro", 'golden house'],
    touristMagnitude: 50,
  },
];
