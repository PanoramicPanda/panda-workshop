import { useEffect, useState } from 'react';

// localStorage can throw (private windows, blocked site data), so every access is guarded.
export function readStored(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeStored(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}

/**
 * useState that loads from and saves to localStorage.
 * `parse` turns the stored string (or null) into a value; `serialize` the reverse.
 */
export function useStored(key, parse, serialize = String) {
  const [value, setValue] = useState(() => parse(readStored(key)));
  useEffect(() => {
    writeStored(key, serialize(value));
  }, [key, value, serialize]);
  return [value, setValue];
}

export function removeStored(key) {
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

/**
 * Plan checkbox key. Ticks are per skill rank only: the hunter learns the skill, so a rank
 * learned for one family (or on one continent) is learned for every pet.
 */
export const tickKey = (plan, ability, rank) => `hpg-ck-${plan}-${ability}-${rank}`;

/** Every stored key, or none when storage is blocked. */
function storedKeys() {
  try {
    return Array.from({ length: localStorage.length }, (_, i) => localStorage.key(i));
  } catch {
    return [];
  }
}

// Older versions saved a tick per family and continent: hpg-ck-planA-cat-E-bite-3.
const legacyTickKeys = (plan, ability, rank) => {
  const re = new RegExp(`^hpg-ck-${plan}-[a-z]+-[EKG]-${ability}-${rank}$`);
  return storedKeys().filter((k) => re.test(k));
};

/** Whether a rank is ticked. Until it's saved under the new key, a tick for any family or continent counts. */
export function readTick(plan, ability, rank) {
  const v = readStored(tickKey(plan, ability, rank));
  if (v === '1' || v === '0') return v === '1';
  return legacyTickKeys(plan, ability, rank).some((k) => readStored(k) === '1');
}

/** Saves a tick under the new key and drops the old per-family, per-continent ones. */
export function writeTick(plan, ability, rank, on) {
  writeStored(tickKey(plan, ability, rank), on ? '1' : '0');
  legacyTickKeys(plan, ability, rank).forEach(removeStored);
}
