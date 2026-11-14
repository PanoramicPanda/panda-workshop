import { actives, alsoList, learnable, lowLevel, rankOf } from './catalog.js';
import { inContinent, otherRegion, tameable } from './region.js';

// The plan groups ranks into 10-level legs: 10–19, 20–29, 30–39, 40–49 and 50–60 (60 joins the last leg).
export const bucket = (level) => Math.min(Math.floor(level / 10), 5) - 1;
const legRange = (b) => [(b + 1) * 10, b === 4 ? 60 : (b + 1) * 10 + 9];

/** The level at which a rank can be picked up from this pet: max(10, rank's pet level, pet's level). */
const petGate = (c, id, info) => Math.max(10, info.petLevel, lowLevel(c.petById[id]));

const low = (c, id) => lowLevel(c.petById[id]);

/**
 * Drops pets above the hunter's level from a plan item's lists. The plan's shape
 * (which trip a rank falls in) is worked out first, so it doesn't change.
 * Adds `hidden` (how many were dropped) and `nextLevel` (lowest level among them).
 */
function limitToLevel(c, item, settings) {
  const ok = (id) => tameable(c.petById[id], settings);
  const dropped = [...item.own, ...item.alt].filter((id) => !ok(id));
  return {
    ...item,
    own: item.own.filter(ok),
    alt: item.alt.filter(ok),
    hidden: dropped.length,
    nextLevel: dropped.length ? Math.min(...dropped.map((id) => low(c, id))) : null,
  };
}

function sortOwn(c, ids, s, r, fam) {
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
 * The training plan: each skill rank goes in the 10-level leg where its source and the pet level
 * first line up. Only the highest rank of each skill per leg is kept (skipping ranks is free).
 * Stops: { title, items: [{ ability, rank, info, level, own, alt }] }.
 */
export function buildPlan(c, settings) {
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
      rows.push({ ability: a.id, rank: info.rank, info, level, own: sortOwn(c, own, a.id, info.rank, fam), alt });
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
    .map((b) => {
      const items = byBucket[b].sort(
        (x, y) => x.level - y.level || c.abilityById[x.ability].name.localeCompare(c.abilityById[y.ability].name),
      );
      const [lo, hi] = legRange(b);
      return {
        title: `Levels ${lo}–${hi}`,
        items: items.map((x) => limitToLevel(c, x, settings)),
      };
    });
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
    if (!teaches || !inContinent(p, settings) || !tameable(p, settings)) continue;
    const skills = new Set(
      teaches.filter(([s]) => !c.abilityById[s].passive && learnable(c, s, settings.fam)).map(([s]) => s),
    );
    if (skills.size >= 2) best.push({ id: p.id, count: skills.size });
  }
  return best.sort((a, b) => b.count - a.count || low(c, a.id) - low(c, b.id));
}

/** The family's pets grouped by attack speed (fastest first), split by continent, up to `settings.maxLvl`. */
export function speedGroups(c, settings) {
  const { fam, fac } = settings;
  const opp = otherRegion(fac);
  const speeds = [...new Set(c.pets.map((p) => p.speed))].sort((a, b) => parseFloat(a) - parseFloat(b));
  return speeds
    .map((speed) => {
      const ids = c.pets
        .filter((p) => p.speed === speed && p.family === fam && tameable(p, settings))
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
