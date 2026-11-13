import test from 'node:test';
import assert from 'node:assert/strict';
import { validate } from '../scripts/validate-data.mjs';
import { decodeState, encodeState } from '../src/lib/urlState.js';
import { catalog, rawData, state } from './helpers.mjs';

test('shipped data passes validation', () => {
  assert.deepEqual(validate(rawData()), []);
});

test('validation catches a broken link, a bad date and an unknown watchlist member', () => {
  const data = rawData();
  data.titles.find((t) => t.id === 'im1').links[0].to = 'nope';
  data.titles.find((t) => t.id === 'hulk').date = 'sometime';
  data.watchlists[0].members.push('ghost');
  const problems = validate(data).join('\n');
  assert.match(problems, /"im1" → "nope": link target doesn't exist/);
  assert.match(problems, /"hulk": date "sometime" can't be parsed/);
  assert.match(problems, /member "ghost" doesn't exist/);
});

test('URL hash round-trips and writes only non-defaults', () => {
  assert.equal(encodeState(state()), '');
  const s = state({ view: 'graph', layout: 'free', sel: 'nwh', kind: 'film', phases: [4, 5], list: 'endgame', listOnly: true, glow: false, showAdjacent: true, hideSpoilers: false, showLinks: false, q: 'loki' });
  assert.deepEqual(decodeState('#' + encodeState(s), catalog), s);
});

test('URL hash ignores unknown values', () => {
  const s = decodeState('#view=wat&list=nope&phases=99,4&sel=ghost&kind=x', catalog);
  assert.deepEqual(s, state({ phases: [4] }));
});
