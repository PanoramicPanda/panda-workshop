import { startKey } from './dates.js';

export const KIND_LABELS = { film: 'Film', series: 'Series', special: 'Special', short: 'Shorts' };

/**
 * Turns the raw JSON into the structure the app renders:
 * titles sorted by phase then release date, an id lookup, and each title's
 * incoming connections (`incoming`) derived from the other side's `links`.
 */
export function buildCatalog({ titles: rawTitles, phases, watchlists }) {
  const titles = rawTitles
    .map((t) => ({ ...t, links: t.links ?? [], incoming: [] }))
    .sort((a, b) => a.phase - b.phase || startKey(a) - startKey(b));
  const byId = Object.fromEntries(titles.map((t) => [t.id, t]));
  addSequelLinks(titles);
  for (const t of titles) {
    for (const link of t.links) {
      if (byId[link.to]) byId[link.to].incoming.push({ to: t.id, rel: link.rel, text: link.text });
    }
  }
  const chart = titles.filter((t) => !t.after);
  return {
    titles: chart,
    after: titles.filter((t) => t.after),
    byId,
    phases,
    watchlists: watchlists.map((w) => ({ ...w, memberSet: new Set(w.members) })),
  };
}

export const seriesOf = (title) => (title.series == null ? [] : [].concat(title.series));

/**
 * Titles sharing a `series` are chained in release order with generated `sequel` links
 * (each entry → the next). A pair that already has a hand-written link keeps that one instead.
 * Expects `titles` already sorted by release.
 */
export function addSequelLinks(titles) {
  const linked = new Set();
  for (const t of titles) for (const l of t.links) linked.add([t.id, l.to].sort().join('|'));
  const chains = new Map();
  for (const t of titles) for (const s of seriesOf(t)) chains.set(s, [...(chains.get(s) ?? []), t]);
  for (const chain of chains.values()) {
    for (let i = 0; i + 1 < chain.length; i++) {
      const [a, b] = [chain[i], chain[i + 1]];
      const key = [a.id, b.id].sort().join('|');
      if (linked.has(key)) continue;
      linked.add(key);
      a.links.push({ to: b.id, rel: 'sequel', text: '' });
    }
  }
}

export const displayName = (title) => title.shortTitle || title.title;

/** Header stats: counts each work once (season buckets share a `work`), main chart only. */
export function stats(titles) {
  const works = {};
  for (const t of titles) if (!t.adjacent) works[t.work || t.id] = t.kind;
  const c = { film: 0, series: 0, special: 0, short: 0 };
  for (const k of Object.values(works)) c[k]++;
  return {
    total: c.film + c.series + c.special + c.short,
    films: c.film,
    series: c.series,
    specials: c.special + c.short,
    adjacent: titles.filter((t) => t.adjacent).length,
  };
}

const IN_LABELS = { sets: 'Set up by', ties: 'Ties to', sequel: 'Follows' };
const OUT_LABELS = { sets: 'Sets up', ties: 'Ties to', sequel: 'Continues in' };

/** All connections of a title: "Follows", then incoming, outgoing, and "Continues in" last. */
export function connections(title) {
  const all = [
    ...title.incoming.map((l) => ({ ...l, label: IN_LABELS[l.rel] })),
    ...title.links.map((l) => ({ ...l, label: OUT_LABELS[l.rel] })),
  ];
  const rank = (c) => (c.label === 'Follows' ? 0 : c.label === 'Continues in' ? 2 : 1);
  return all.sort((a, b) => rank(a) - rank(b));
}
