import test from 'node:test';
import assert from 'node:assert/strict';
import { HUB_DEGREE, buildGraph, layoutGraph } from '../src/lib/graph.js';
import { currentList, isVisible } from '../src/lib/filter.js';
import { catalog, state } from './helpers.mjs';

const visible = (s) => catalog.titles.filter((t) => isVisible(t, s, catalog));

test('edges only connect visible titles', () => {
  const s = state({ phases: [4] });
  const g = buildGraph(visible(s), currentList(catalog, s));
  const ids = new Set(g.nodes.map((n) => n.id));
  assert.ok(g.edges.length > 0);
  for (const e of g.edges) assert.ok(ids.has(e.source) && ids.has(e.target), e.id);
});

test('degree, neighbors and hubs are consistent', () => {
  const s = state();
  const g = buildGraph(visible(s), currentList(catalog, s));
  for (const n of g.nodes) {
    const story = g.edges.filter((e) => e.rel !== 'sequel' && (e.source === n.id || e.target === n.id));
    assert.equal(n.degree, story.length, n.id);
    assert.equal(n.hub, n.degree >= HUB_DEGREE);
  }
  assert.ok(g.neighbors.get('nwh').has('ds'));
});

test('sequel edges appear by default and drop out when switched off', () => {
  const titles = visible(state());
  const on = buildGraph(titles, null);
  const off = buildGraph(titles, null, { sequels: false });
  assert.ok(on.edges.some((e) => e.id === 'im1>im2' && e.rel === 'sequel'));
  assert.ok(!off.edges.some((e) => e.rel === 'sequel'));
  assert.deepEqual(
    on.nodes.map((n) => n.degree),
    off.nodes.map((n) => n.degree),
    'sequels do not change node size',
  );
});

test('watchlist flags members and the target', () => {
  const s = state({ list: 'nowayhome' });
  const g = buildGraph(visible(s), currentList(catalog, s));
  const byId = new Map(g.nodes.map((n) => [n.id, n]));
  assert.equal(byId.get('nwh').target, true);
  assert.equal(byId.get('sm1').member, true);
  assert.equal(byId.get('im1').member, false);
});

test('timeline layout keeps release order left to right', () => {
  const s = state();
  const g = buildGraph(visible(s), null);
  const pos = layoutGraph(g, { layout: 'time' });
  const x = (id) => pos.get(id).x;
  assert.ok(x('im1') < x('av1') && x('av1') < x('eg') && x('eg') < x('vq'));
  for (const p of pos.values()) assert.ok(Number.isFinite(p.x) && Number.isFinite(p.y));
});

test('free layout produces finite positions for every node', () => {
  const s = state({ showAdjacent: true });
  const g = buildGraph(visible(s), null);
  const pos = layoutGraph(g, { layout: 'free' });
  assert.equal(pos.size, g.nodes.length);
  for (const p of pos.values()) assert.ok(Number.isFinite(p.x) && Number.isFinite(p.y));
});
