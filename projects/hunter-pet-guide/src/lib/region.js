import { lowLevel } from './catalog.js';

export const REGION_NAMES = { E: 'Eastern Kingdoms', K: 'Kalimdor', Z: 'Zephras Isle' };

/** The continent picker: Global (both continents, the default) or one continent. */
export const SIDES = [
  ['G', 'Global'],
  ['E', 'Eastern Kingdoms'],
  ['K', 'Kalimdor'],
];

/** What the chosen setting covers, for sentences like "No source in …". */
export const placeName = (fac) => (fac === 'G' ? 'Eastern Kingdoms and Kalimdor' : REGION_NAMES[fac]);

/** The continent you're not on; Global has none. */
export const otherRegion = (fac) => (fac === 'G' ? null : fac === 'E' ? 'K' : 'E');

/** On the chosen continent (or either one, for Global), or on Zephras Isle when that's switched on. */
export const inContinent = (pet, { fac, zep }) => (pet.region === 'Z' ? zep : fac === 'G' || pet.region === fac);

/** Reachable at all with these settings (either continent; Zephras only when on). */
export const isReachable = (pet, { zep }) => pet.region !== 'Z' || zep;

/** Tameable at the hunter's level (`maxLvl` 0 or unset means no limit). "40-41" counts from 40. */
export const tameable = (pet, { maxLvl } = {}) => !maxLvl || lowLevel(pet) <= maxLvl;
