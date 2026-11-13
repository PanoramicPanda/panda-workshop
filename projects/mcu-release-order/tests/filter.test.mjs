import test from 'node:test';
import assert from 'node:assert/strict';
import { isVisible, searchText, visibleConnections } from '../src/lib/filter.js';
import { stats } from '../src/lib/catalog.js';
import { catalog, state } from './helpers.mjs';

const ids = (s) => catalog.titles.filter((t) => isVisible(t, s, catalog)).map((t) => t.id);

test('default view matches the original chart: 71 main titles, Iron Man first, VisionQuest last', () => {
  const v = ids(state());
  assert.equal(v.length, 71);
  assert.equal(v[0], 'im1');
  assert.equal(v.at(-1), 'vq');
});

test('header stats count season buckets once', () => {
  assert.deepEqual(stats(catalog.titles), { total: 71, films: 38, series: 21, specials: 12, adjacent: 34 });
});

test('MCU Adjacent switch shows all 105 titles', () => {
  assert.equal(ids(state({ showAdjacent: true })).length, 105);
});

test('kind filter: "special" also covers shorts', () => {
  const v = ids(state({ kind: 'special' }));
  assert.ok(v.includes('wbn') && v.includes('groot'));
  assert.ok(!v.includes('im1'));
});

test('phase filter keeps only the chosen phases', () => {
  const v = ids(state({ phases: [6] }));
  assert.deepEqual(v, ['ff', 'eow', 'zombies', 'wm', 'dd2', 'punisher', 'bnd', 'vq']);
});

test('List only shows members (adjacent members too) plus the destination', () => {
  const v = ids(state({ list: 'nowayhome', listOnly: true }));
  assert.ok(v.includes('nwh'), 'destination is shown');
  assert.ok(v.includes('sp1'), 'adjacent member shown even with MCU Adjacent off');
  assert.ok(!v.includes('im1'));
});

test('Doomsday list only matches the original 16 entries', () => {
  assert.deepEqual(ids(state({ listOnly: true })), ['fx1', 'fx2', 'cap1', 'av1', 'iw', 'eg', 'loki1', 'shangchi', 'nwh', 'momm', 'bpwf', 'loki2', 'dp', 'cabnd', 'tb', 'ff']);
});

test('search ignores hidden spoilers but finds them once revealed', () => {
  assert.deepEqual(ids(state({ q: 'thanos' })), ['iw']);
  assert.deepEqual(ids(state({ q: 'thanos', hideSpoilers: false })), ['av1', 'gotg', 'thorrag', 'iw']);
  const im1 = catalog.byId.im1;
  assert.ok(!searchText(im1, state(), catalog).includes('avengers initiative'));
  assert.ok(searchText(im1, state({ hideSpoilers: false }), catalog).includes('avengers initiative'));
});

test('series entries are chained with sequel links in release order', () => {
  const labels = (id, s = state()) => visibleConnections(catalog.byId[id], s, catalog).map((c) => `${c.label} ${c.to}`);
  assert.ok(labels('im1').includes('Continues in im2'));
  assert.ok(labels('im2').includes('Follows im1'));
  assert.ok(labels('im2').includes('Continues in im3'));
  assert.equal(labels('im2')[0], 'Follows im1', '"Follows" is listed first');
  assert.ok(labels('eg').includes('Continues in doom'), 'chains into the film after the chart');
  // A pair with a hand-written link keeps it instead of getting a duplicate sequel link.
  const capLinks = catalog.byId.cap1.links.filter((l) => l.to === 'cap2');
  assert.deepEqual(capLinks.map((l) => l.rel), ['sets']);
  // Deadpool & Wolverine sits in two series and follows both.
  assert.ok(catalog.byId.dpool2.links.some((l) => l.to === 'dp'));
  assert.ok(catalog.byId.fx9.links.some((l) => l.to === 'dp'));
});

test('Sequel links switch hides only generated links', () => {
  const conns = visibleConnections(catalog.byId.im2, state({ showSequels: false }), catalog);
  assert.ok(!conns.some((c) => c.rel === 'sequel'));
  assert.ok(conns.some((c) => c.to === 'thor'), 'hand-written link stays');
});

test('connections to adjacent titles hide while the switch is off', () => {
  const nwh = catalog.byId.nwh;
  assert.ok(!visibleConnections(nwh, state(), catalog).some((c) => c.to === 'sp1'));
  assert.ok(visibleConnections(nwh, state({ showAdjacent: true }), catalog).some((c) => c.to === 'sp1'));
});
