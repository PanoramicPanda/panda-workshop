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

/** Plan checkbox key, unchanged from the original page so saved ticks carry over. */
export const tickKey = (plan, fam, fac, ability, rank) => `hpg-ck-${plan}-${fam}-${fac}-${ability}-${rank}`;
