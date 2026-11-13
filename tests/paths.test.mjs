import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { slugProblem, assertSafeSlug, isInside, relativePathProblem } from '../scripts/lib/paths.mjs';

test('accepts well-formed slugs', () => {
  for (const slug of ['a', 'my-tool', 'wow-calculator', 'x1', 'react-dashboard-2']) {
    assert.equal(slugProblem(slug), null, slug);
  }
});

test('rejects unsafe or malformed slugs', () => {
  for (const slug of ['', '..', '.', 'My Tool', 'UPPER', '-lead', 'trail-', 'a--b', 'a/b', 'a\\b', 'a.b', 'ünïcode', 'x'.repeat(65), 'assets', 'thumbnails']) {
    assert.notEqual(slugProblem(slug), null, JSON.stringify(slug));
  }
  assert.throws(() => assertSafeSlug('../etc'), /Invalid project folder/);
});

test('isInside detects traversal', () => {
  const base = path.resolve('/srv/projects/demo');
  assert.equal(isInside(base, path.join(base, 'img/a.png')), true);
  assert.equal(isInside(base, base), true);
  assert.equal(isInside(base, path.join(base, '..', 'other')), false);
  assert.equal(isInside(base, path.resolve('/etc/passwd')), false);
  assert.equal(isInside(base, `${base}-evil/x`), false);
});

test('relativePathProblem rejects absolute paths, URLs and ..', () => {
  assert.equal(relativePathProblem('thumb.png'), null);
  assert.equal(relativePathProblem('images/thumb.png'), null);
  for (const bad of ['', '/etc/x.png', 'C:\\x.png', '\\\\server\\x.png', '../x.png', 'a/../../x.png', 'https://evil.test/x.png', 'javascript:alert(1)', 'data:image/png;base64,AA']) {
    assert.notEqual(relativePathProblem(bad), null, bad);
  }
});
