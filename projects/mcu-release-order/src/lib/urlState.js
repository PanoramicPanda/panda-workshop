import { DEFAULT_STATE } from './filter.js';

// Short, stable hash keys for each state field. Only non-default values are written.
const FIELDS = {
  view: { key: 'view', enc: (v) => v, dec: (v) => (['timeline', 'graph'].includes(v) ? v : undefined) },
  layout: { key: 'layout', enc: (v) => v, dec: (v) => (['time', 'free'].includes(v) ? v : undefined) },
  sel: { key: 'sel', enc: (v) => v ?? '', dec: (v, ctx) => (ctx.titleIds.has(v) ? v : undefined) },
  kind: { key: 'kind', enc: (v) => v, dec: (v) => (['all', 'film', 'series', 'special'].includes(v) ? v : undefined) },
  q: { key: 'q', enc: (v) => v, dec: (v) => v },
  phases: {
    key: 'phases',
    enc: (v) => v.join(','),
    dec: (v, ctx) => {
      const ids = v.split(',').map(Number).filter((n) => ctx.phaseIds.has(n));
      return ids.length ? [...new Set(ids)].sort((a, b) => a - b) : undefined;
    },
  },
  list: { key: 'list', enc: (v) => v, dec: (v, ctx) => (ctx.listIds.has(v) ? v : undefined) },
  listOnly: { key: 'only', enc: (v) => (v ? '1' : '0'), dec: (v) => v === '1' },
  glow: { key: 'glow', enc: (v) => (v ? '1' : '0'), dec: (v) => v === '1' },
  showAdjacent: { key: 'adj', enc: (v) => (v ? '1' : '0'), dec: (v) => v === '1' },
  hideSpoilers: { key: 'spoilers', enc: (v) => (v ? '0' : '1'), dec: (v) => v !== '1' },
  showLinks: { key: 'links', enc: (v) => (v ? '1' : '0'), dec: (v) => v === '1' },
};

const same = (a, b) => (Array.isArray(a) ? a.join() === b.join() : a === b);

/** State → "view=graph&kind=film" (without the leading #). Empty when everything is default. */
export function encodeState(state) {
  const params = new URLSearchParams();
  for (const [name, f] of Object.entries(FIELDS)) {
    if (!same(state[name], DEFAULT_STATE[name])) params.set(f.key, f.enc(state[name]));
  }
  return params.toString();
}

/** "#view=graph&kind=film" → full state. Unknown or invalid values fall back to defaults. */
export function decodeState(hash, catalog) {
  const ctx = {
    titleIds: new Set(catalog.titles.map((t) => t.id)),
    phaseIds: new Set(catalog.phases.map((p) => p.id)),
    listIds: new Set(catalog.watchlists.map((w) => w.id)),
  };
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  const state = { ...DEFAULT_STATE };
  for (const [name, f] of Object.entries(FIELDS)) {
    if (!params.has(f.key)) continue;
    const value = f.dec(params.get(f.key), ctx);
    if (value !== undefined) state[name] = value;
  }
  return state;
}
