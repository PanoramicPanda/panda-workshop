import { lowLevel } from './catalog.js';

export const REGION_NAMES = { E: 'Eastern Kingdoms', K: 'Kalimdor', Z: 'Zephras Isle' };

export const otherRegion = (fac) => (fac === 'E' ? 'K' : 'E');

/** On the chosen continent, or on Zephras Isle when that's switched on. */
export const inContinent = (pet, { fac, zep }) => (pet.region === 'Z' ? zep : pet.region === fac);

/** Reachable at all with these settings (either continent; Zephras only when on). */
export const isReachable = (pet, { zep }) => pet.region !== 'Z' || zep;

/** Tameable at the hunter's level (`maxLvl` 0 or unset means no limit). "40-41" counts from 40. */
export const tameable = (pet, { maxLvl } = {}) => !maxLvl || lowLevel(pet) <= maxLvl;
