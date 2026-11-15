import test from 'node:test';
import assert from 'node:assert/strict';
import { readTick, tickKey, writeTick } from '../src/lib/storage.js';

// A tiny in-memory stand-in for the browser's localStorage.
function fakeStorage(initial = {}) {
  const data = new Map(Object.entries(initial));
  globalThis.localStorage = {
    getItem: (k) => (data.has(k) ? data.get(k) : null),
    setItem: (k, v) => data.set(k, String(v)),
    removeItem: (k) => data.delete(k),
    key: (i) => [...data.keys()][i] ?? null,
    get length() {
      return data.size;
    },
  };
  return data;
}

test('a tick is shared by every family and continent', () => {
  const data = fakeStorage();
  writeTick('planA', 'bite', 3, true);
  assert.equal(data.get(tickKey('planA', 'bite', 3)), '1');
  assert.equal(readTick('planA', 'bite', 3), true);
  assert.equal(readTick('planA', 'bite', 4), false);
  assert.equal(readTick('planA', 'claw', 3), false);
});

test('ticks saved per family and continent by older versions still count, and are cleaned up on change', () => {
  const data = fakeStorage({
    'hpg-ck-planA-cat-G-bite-3': '1',
    'hpg-ck-planA-bat-K-bite-3': '1',
    'hpg-ck-planA-wolf-E-claw-2': '0',
    'hpg-ck-planA-cat-E-bite-30': '1',
  });
  assert.equal(readTick('planA', 'bite', 3), true);
  assert.equal(readTick('planA', 'claw', 2), false);
  writeTick('planA', 'bite', 3, false);
  assert.equal(readTick('planA', 'bite', 3), false);
  assert.ok(!data.has('hpg-ck-planA-cat-G-bite-3') && !data.has('hpg-ck-planA-bat-K-bite-3'));
  // Bite 30 is a different key and is left alone.
  assert.equal(data.get('hpg-ck-planA-cat-E-bite-30'), '1');
});
