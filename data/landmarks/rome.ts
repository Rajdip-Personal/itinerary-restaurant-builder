// data/landmarks/rome.ts
// Rome landmark database for Tier 1 geocoding

import type { Landmark } from './paris';

export const ROME_LANDMARKS: Landmark[] = [
  {
    id: 'colosseum',
    name: 'Colosseum',
    coordinates: { latitude: 41.8902, longitude: 12.4922 },
    aliases: ['Colosseo', 'Coliseum', 'Anfiteatro Flavio', 'colosseum', 'the colosseum'],
    touristMagnitude: 100,
  },
  {
    id: 'vatican-museums',
    name: "Vatican Museums",
    coordinates: { latitude: 41.9022, longitude: 12.4539 },
    aliases: ['Vatican', 'Vaticano', 'St Peters', 'San Pietro', 'Musei Vaticani', 'Sistine Chapel', 'Cappella Sistina', 'vatican museums', "St. Peter's Basilica"],
    touristMagnitude: 95,
  },
  {
    id: 'trevi-fountain',
    name: 'Trevi Fountain',
    coordinates: { latitude: 41.9009, longitude: 12.4833 },
    aliases: ['Trevi', 'Fontana di Trevi', 'trevi fountain'],
    touristMagnitude: 90,
  },
  {
    id: 'pantheon-rome',
    name: 'Pantheon',
    coordinates: { latitude: 41.8986, longitude: 12.4769 },
    aliases: ['Pantheon', 'Il Pantheon', 'pantheon rome'],
    touristMagnitude: 85,
  },
  {
    id: 'spanish-steps',
    name: 'Spanish Steps',
    coordinates: { latitude: 41.9060, longitude: 12.4828 },
    aliases: ['Scalinata di Trinità dei Monti', 'Piazza di Spagna', 'spanish steps'],
    touristMagnitude: 85,
  },
  {
    id: 'roman-forum',
    name: 'Roman Forum',
    coordinates: { latitude: 41.8925, longitude: 12.4853 },
    aliases: ['Foro Romano', 'Forum', 'roman forum', 'the forum'],
    touristMagnitude: 80,
  },
  {
    id: 'piazza-navona',
    name: 'Piazza Navona',
    coordinates: { latitude: 41.8992, longitude: 12.4731 },
    aliases: ['Navona', 'piazza navona'],
    touristMagnitude: 75,
  },
  {
    id: 'castel-sant-angelo',
    name: "Castel Sant'Angelo",
    coordinates: { latitude: 41.9031, longitude: 12.4663 },
    aliases: ['Castle of the Holy Angel', 'Mausoleum of Hadrian', 'castel sant angelo'],
    touristMagnitude: 70,
  },
  {
    id: 'borghese-gallery',
    name: 'Borghese Gallery',
    coordinates: { latitude: 41.9142, longitude: 12.4921 },
    aliases: ['Galleria Borghese', 'Villa Borghese', 'borghese gallery', 'borghese'],
    touristMagnitude: 65,
  },
  {
    id: 'trastevere',
    name: 'Trastevere',
    coordinates: { latitude: 41.8893, longitude: 12.4700 },
    aliases: ['Trastevere neighborhood', 'trastevere'],
    touristMagnitude: 60,
  },
  {
    id: 'campo-de-fiori',
    name: "Campo de' Fiori",
    coordinates: { latitude: 41.8956, longitude: 12.4722 },
    aliases: ['Campo de Fiori', 'campo de fiori', 'campo dei fiori'],
    touristMagnitude: 65,
  },
  {
    id: 'palatine-hill',
    name: 'Palatine Hill',
    coordinates: { latitude: 41.8892, longitude: 12.4874 },
    aliases: ['Palatino', 'palatine hill', 'colle palatino'],
    touristMagnitude: 70,
  },
  {
    id: 'piazza-del-popolo',
    name: 'Piazza del Popolo',
    coordinates: { latitude: 41.9107, longitude: 12.4763 },
    aliases: ['Popolo', 'piazza del popolo'],
    touristMagnitude: 60,
  },
  {
    id: 'circus-maximus',
    name: 'Circus Maximus',
    coordinates: { latitude: 41.8861, longitude: 12.4850 },
    aliases: ['Circo Massimo', 'circus maximus'],
    touristMagnitude: 55,
  },
];
