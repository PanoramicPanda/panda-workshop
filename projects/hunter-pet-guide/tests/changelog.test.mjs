import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { parseChangelog, versionOf } from '../src/lib/changelog.js';

const read = (f) => fs.readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');

test('the version is the first heading of CHANGELOG.md and matches package.json', () => {
  const v = versionOf(read('CHANGELOG.md'));
  assert.match(v, /^\d+\.\d+\.\d+$/);
  assert.equal(v, JSON.parse(read('package.json')).version);
});

test('changelog versions run newest first', () => {
  const versions = [...read('CHANGELOG.md').matchAll(/^## (\d+)\.(\d+)\.(\d+)/gm)].map((m) => m.slice(1).map(Number));
  for (let i = 1; i < versions.length; i++) {
    const [a, b] = [versions[i - 1], versions[i]];
    const cmp = a[0] - b[0] || a[1] - b[1] || a[2] - b[2];
    assert.ok(cmp > 0, `${a.join('.')} before ${b.join('.')}`);
  }
});

test('the changelog parser handles headings, lists, paragraphs and bold', () => {
  const blocks = parseChangelog('## 1.2.0 — today\n\n- New **Global** option\n- Two\n\nA para\nthat wraps.\n');
  assert.deepEqual(blocks, [
    { type: 'h', level: 2, text: ['1.2.0 — today'] },
    { type: 'ul', items: [['New ', { bold: 'Global' }, ' option'], ['Two']] },
    { type: 'p', text: ['A para that wraps.'] },
  ]);
  assert.equal(versionOf('# 3.0.0\n'), '3.0.0');
});
