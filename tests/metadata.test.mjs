import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateMetadata, loadMetadata, titleFromSlug, MetadataError, DEFAULT_DESCRIPTION } from '../scripts/lib/metadata.mjs';
import { makeTree, cleanup } from './helpers.mjs';

test('defaults are generated when metadata is missing', () => {
  const m = validateMetadata(undefined, 'wow-calculator');
  assert.deepEqual(m, {
    name: 'Wow Calculator',
    description: DEFAULT_DESCRIPTION,
    category: 'Other',
    tags: [],
    featured: false,
    hidden: false,
    thumbnail: null,
    build: { enabled: false, command: null, output: null },
  });
});

test('titleFromSlug', () => {
  assert.equal(titleFromSlug('simple-example'), 'Simple Example');
  assert.equal(titleFromSlug('x'), 'X');
});

test('valid metadata is normalized', () => {
  const m = validateMetadata(
    { name: ' Pets ', category: 'Gaming', tags: ['WoW', 'WoW', ' Hunter '], featured: true, thumbnail: 'img\\t.png' },
    'pets',
  );
  assert.equal(m.name, 'Pets');
  assert.deepEqual(m.tags, ['WoW', 'Hunter']);
  assert.equal(m.featured, true);
  assert.equal(m.thumbnail, 'img/t.png');
});

test('wrong types are all reported together', () => {
  try {
    validateMetadata({ name: 5, tags: 'a', featured: 'yes', hidden: 1, url: 'https://evil.test' }, 'x');
    assert.fail('should throw');
  } catch (err) {
    assert.ok(err instanceof MetadataError);
    const text = err.problems.join('\n');
    assert.match(text, /"name" must be a string/);
    assert.match(text, /"tags" must be an array/);
    assert.match(text, /"featured" must be true or false/);
    assert.match(text, /"hidden" must be true or false/);
    assert.match(text, /unknown field "url"/);
  }
});

test('non-object metadata is rejected', () => {
  assert.throws(() => validateMetadata([], 'x'), /JSON object/);
  assert.throws(() => validateMetadata('hi', 'x'), /JSON object/);
});

test('thumbnail traversal and non-images are rejected', () => {
  assert.throws(() => validateMetadata({ thumbnail: '../secret.png' }, 'x'), /thumbnail/);
  assert.throws(() => validateMetadata({ thumbnail: '/abs.png' }, 'x'), /thumbnail/);
  assert.throws(() => validateMetadata({ thumbnail: 'https://a.test/a.png' }, 'x'), /thumbnail/);
  assert.throws(() => validateMetadata({ thumbnail: 'notes.txt' }, 'x'), /must be an image/);
});

test('build config validation', () => {
  const ok = validateMetadata({ build: { enabled: true, command: 'npm run build', output: 'dist' } }, 'x');
  assert.deepEqual(ok.build, { enabled: true, command: 'npm run build', output: 'dist' });
  const defaults = validateMetadata({ build: { enabled: true } }, 'x');
  assert.deepEqual(defaults.build, { enabled: true, command: 'npm run build', output: 'dist' });
  assert.equal(validateMetadata({ build: { enabled: false } }, 'x').build.enabled, false);
  assert.throws(() => validateMetadata({ build: true }, 'x'), /"build" must be an object/);
  assert.throws(() => validateMetadata({ build: { enabled: 'yes' } }, 'x'), /build.enabled/);
  assert.throws(() => validateMetadata({ build: { enabled: true, output: '../out' } }, 'x'), /build.output/);
  assert.throws(() => validateMetadata({ build: { enabled: true, output: '.' } }, 'x'), /sub-folder/);
  assert.throws(() => validateMetadata({ build: { enabled: true, command: '' } }, 'x'), /build.command/);
  assert.throws(() => validateMetadata({ build: { enabled: true, wat: 1 } }, 'x'), /build.wat/);
});

test('invalid JSON produces an error naming the file', () => {
  const dir = makeTree({ 'project.json': '{ "name": "oops", }' });
  try {
    assert.throws(() => loadMetadata(dir, 'oops'), (err) => err instanceof MetadataError && /projects\/oops\/project\.json/.test(err.message) && /not valid JSON/.test(err.message));
  } finally {
    cleanup(dir);
  }
});

test('missing project.json yields defaults; BOM is tolerated', () => {
  const empty = makeTree({ 'index.html': '<p>hi</p>' });
  const bom = makeTree({ 'project.json': '﻿{"name":"Bom"}' });
  try {
    assert.equal(loadMetadata(empty, 'my-tool').name, 'My Tool');
    assert.equal(loadMetadata(bom, 'b').name, 'Bom');
  } finally {
    cleanup(empty);
    cleanup(bom);
  }
});
