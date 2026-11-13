import { KIND_LABELS, connections, displayName } from './catalog.js';
import { visibleNote } from './text.js';

export const DEFAULT_STATE = {
  view: 'timeline', // timeline | graph
  layout: 'time', // graph layout: time (x follows release order) | free
  sel: null, // selected title in the graph
  kind: 'all', // all | film | series | special (special also covers shorts)
  phases: [], // phase ids to show; empty means all
  q: '',
  hideSpoilers: true,
  showLinks: true,
  showSequels: true, // generated links between entries of the same series
  showAdjacent: false,
  list: 'doomsday', // selected watchlist id
  listOnly: false,
  glow: true,
};

export const currentList = (catalog, state) => catalog.watchlists.find((w) => w.id === state.list) ?? null;

/** Member of the list, or the title the list builds toward. */
export const inList = (title, list) => !!list && (list.memberSet.has(title.id) || list.target === title.id);

/**
 * Connections a reader can see: links to MCU Adjacent titles hide while that switch is off,
 * and generated sequel links hide while "Sequel links" is off.
 */
export function visibleConnections(title, state, catalog) {
  return connections(title).filter(
    (c) => (state.showAdjacent || !catalog.byId[c.to]?.adjacent) && (state.showSequels || c.rel !== 'sequel'),
  );
}

/** Everything a reader can read on a title's card, lowercased, for search. Hidden spoilers don't match. */
export function searchText(title, state, catalog) {
  const list = currentList(catalog, state);
  const parts = [
    title.date,
    title.title,
    KIND_LABELS[title.kind],
    title.adjacent && 'MCU Adjacent',
    list && list.memberSet.has(title.id) && list.chip,
    title.season,
    title.episodes,
    title.releaseNote,
    visibleNote(title.note, state.hideSpoilers),
  ];
  for (const c of visibleConnections(title, state, catalog)) {
    parts.push(c.label, displayName(catalog.byId[c.to]));
    if (c.text) parts.push(state.hideSpoilers ? 'redacted' : c.text);
  }
  return parts.filter(Boolean).join(' ').toLowerCase();
}

export function kindMatches(title, kind) {
  if (kind === 'all') return true;
  if (kind === 'special') return title.kind === 'special' || title.kind === 'short';
  return title.kind === kind;
}

export function isVisible(title, state, catalog) {
  const list = currentList(catalog, state);
  const listed = inList(title, list);
  if (!kindMatches(title, state.kind)) return false;
  if (state.phases.length && !state.phases.includes(title.phase)) return false;
  if (state.listOnly && !listed) return false;
  // Adjacent titles appear when the switch is on, or when they're on the list being filtered to.
  if (title.adjacent && !state.showAdjacent && !(state.listOnly && listed)) return false;
  const term = state.q.trim().toLowerCase();
  if (term && !searchText(title, state, catalog).includes(term)) return false;
  return true;
}
