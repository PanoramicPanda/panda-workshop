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

/** All connections of a title, incoming first ("Set up by"/"Ties to"), then outgoing. */
export function connections(title) {
  return [
    ...title.incoming.map((l) => ({ ...l, label: l.rel === 'ties' ? 'Ties to' : 'Set up by' })),
    ...title.links.map((l) => ({ ...l, label: l.rel === 'ties' ? 'Ties to' : 'Sets up' })),
  ];
}
