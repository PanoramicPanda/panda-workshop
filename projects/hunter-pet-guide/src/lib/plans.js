import { actives, alsoList, learnable, lowLevel, rankOf } from './catalog.js';
import { inContinent, isReachable, otherRegion } from './region.js';

// Plan A groups ranks into trips by these level thresholds.
const THRESHOLDS = [16, 24, 32, 40, 48, 56];
export const bucket = (level) => THRESHOLDS.filter((t) => level >= t).length;

/** The level at which a rank can be picked up from this pet: max(10, rank's pet level, pet's level). */
const petGate = (c, id, info) => Math.max(10, info.petLevel, lowLevel(c.petById[id]));

const low = (c, id) => lowLevel(c.petById[id]);

function sortOwnA(c, ids, s, r, fam) {
  const info = rankOf(c, s, r);
  return ids.slice().sort((a, b) => {
    const ba = bucket(petGate(c, a, info));
    const bb = bucket(petGate(c, b, info));
    if (ba !== bb) return ba - bb;
    const ca = alsoList(c, a, [s, r], fam).length;
    const cb = alsoList(c, b, [s, r], fam).length;
    if (ca !== cb) return cb - ca;
    return low(c, a) - low(c, b);
  });
}

/**
 * Plan A: learn each skill as soon as its source and the pet level line up.
 * Only the highest rank of each skill per trip is kept (skipping ranks is free).
 * Stops: { title, items: [{ ability, rank, info, level, own, alt }] }.
 */
export function buildPlanA(c, settings) {
  const { fam, fac } = settings;
  const opp = otherRegion(fac);
  const rows = [];
  for (const a of actives(c, fam)) {
    for (const info of a.ranks) {
      if (info.source === 'none') continue;
      let own = [];
      let alt = [];
      if (info.source === 'pet') {
        own = info.pets.filter((id) => inContinent(c.petById[id], settings));
        alt = info.pets.filter((id) => c.petById[id].region === opp);
      }
      const pool = own.length ? own : alt;
      let level = Math.max(10, info.petLevel);
      if (info.source === 'pet') {
        if (!pool.length) continue;
        level = Math.max(level, Math.min(...pool.map((id) => low(c, id))));
      }
      rows.push({ ability: a.id, rank: info.rank, info, level, own: sortOwnA(c, own, a.id, info.rank, fam), alt });
    }
  }
  const best = {};
  for (const x of rows) {
    const k = `${bucket(x.level)}|${x.ability}`;
    if (!best[k] || x.rank > best[k].rank) best[k] = x;
  }
  const byBucket = {};
  for (const x of Object.values(best)) (byBucket[bucket(x.level)] ??= []).push(x);
  return Object.keys(byBucket)
    .map(Number)
    .sort((a, b) => a - b)
    .map((b, i) => {
      const items = byBucket[b].sort(
        (x, y) => x.level - y.level || c.abilityById[x.ability].name.localeCompare(c.abilityById[y.ability].name),
      );
      const lo = items[0].level;
      const hi = items[items.length - 1].level;
      return { title: `Trip ${i + 1} · Level ${lo === hi ? lo : `${lo}–${hi}`}`, items };
    });
}

/** Plan B: one trip every 10 levels, teaching the highest rank the pet's level allows. */
export function buildPlanB(c, settings) {
  const { fam, fac } = settings;
  const opp = otherRegion(fac);
  const acts = actives(c, fam);
  const prev = {};
  const stops = [];
  for (let V = 10; V <= 60; V += 10) {
    const items = [];
    for (const a of acts) {
      const candidates = a.ranks.filter((info) => info.rank > (prev[a.id] || 0) && info.petLevel <= V).reverse();
      for (const info of candidates) {
        if (info.source === 'none') continue;
        if (info.source === 'trainer') {
          items.push({ ability: a.id, rank: info.rank, info, level: V, own: [], alt: [] });
          prev[a.id] = info.rank;
          break;
        }
        const any = info.pets.filter((id) => isReachable(c.petById[id], settings) && low(c, id) <= V);
        if (!any.length) continue;
        const own = any
          .filter((id) => inContinent(c.petById[id], settings))
          .sort((x, y) => {
            const cx = alsoList(c, x, [a.id, info.rank], fam, V).length;
            const cy = alsoList(c, y, [a.id, info.rank], fam, V).length;
            return cy - cx || low(c, y) - low(c, x);
          });
        const alt = info.pets.filter((id) => c.petById[id].region === opp).sort((x, y) => low(c, x) - low(c, y));
        items.push({ ability: a.id, rank: info.rank, info, level: V, own, alt });
        prev[a.id] = info.rank;
        break;
      }
    }
    if (items.length) stops.push({ title: `Visit ${stops.length + 1} · Level ${V}`, items });
  }
  return stops;
}

/** Up to four zones from a stop's top pets, for the stop heading. */
export function zonesOf(c, items) {
  const zones = [];
  for (const x of items) {
    for (const id of x.own.slice(0, 5)) {
      const z = c.petById[id].zone.replace(' (Dungeon)', '').replace(' (Raid)', '');
      if (!zones.includes(z)) zones.push(z);
    }
  }
  return zones.slice(0, 4).join(' · ');
}

/** Pets on this continent that teach two or more of the family's tamed skills, most skills first. */
export function multiSkillPets(c, settings) {
  const best = [];
  for (const p of c.pets) {
    const teaches = c.alsoIndex[p.id];
    if (!teaches || !inContinent(p, settings)) continue;
    const skills = new Set(
      teaches.filter(([s]) => !c.abilityById[s].passive && learnable(c, s, settings.fam)).map(([s]) => s),
    );
    if (skills.size >= 2) best.push({ id: p.id, count: skills.size });
  }
  return best.sort((a, b) => b.count - a.count || low(c, a.id) - low(c, b.id));
}

/** The family's pets grouped by attack speed (fastest first), split by continent. */
export function speedGroups(c, settings, maxLevel) {
  const { fam, fac } = settings;
  const opp = otherRegion(fac);
  const speeds = [...new Set(c.pets.map((p) => p.speed))].sort((a, b) => parseFloat(a) - parseFloat(b));
  return speeds
    .map((speed) => {
      const ids = c.pets
        .filter((p) => p.speed === speed && p.family === fam && (!maxLevel || lowLevel(p) <= maxLevel))
        .sort((a, b) => lowLevel(a) - lowLevel(b) || a.name.localeCompare(b.name))
        .map((p) => p.id);
      return {
        speed,
        isBase: speed === '2.0',
        ids,
        own: ids.filter((id) => inContinent(c.petById[id], settings)),
        other: ids.filter((id) => c.petById[id].region === opp),
      };
    })
    .filter((g) => g.ids.length);
}

/** TP for each tamed skill at its highest obtainable rank, and the total. */
export function tpTotals(c, fam) {
  const rows = [];
  for (const a of actives(c, fam)) {
    const top = a.ranks.filter((r) => r.source !== 'none').pop();
    if (top) rows.push({ ability: a.id, name: a.name, rank: top.rank, tp: top.tp });
  }
  return { rows, total: rows.reduce((n, r) => n + r.tp, 0) };
}

/** Every zone, grouped by the region its pets are sorted into. */
export function zonesByRegion(c) {
  const zones = { E: new Set(), K: new Set(), Z: new Set() };
  for (const p of c.pets) zones[p.region].add(p.zone);
  return Object.fromEntries(Object.entries(zones).map(([r, s]) => [r, [...s].sort()]));
}
