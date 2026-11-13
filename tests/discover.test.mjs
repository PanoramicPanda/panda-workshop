import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { discoverProjects, toCatalog, DiscoveryError } from '../scripts/lib/discover.mjs';
import { makeTree, writeTree, cleanup, canSymlink } from './helpers.mjs';

const html = '<!doctype html><title>x</title>';

test('discovers static projects with and without metadata', () => {
  const root = makeTree({
    'simple/index.html': html,
    'fancy/index.html': html,
    'fancy/project.json': { name: 'Fancy', category: 'Tools', tags: ['a'], featured: true },
    '.gitkeep': '',
    'stray-file.txt': 'ignored',
  });
  try {
    const projects = discoverProjects(root);
    assert.deepEqual(projects.map((p) => p.slug), ['fancy', 'simple']);
    assert.ok(projects.every((p) => p.mode === 'static'));
    const catalog = toCatalog(projects);
    assert.deepEqual(catalog[0], {
      id: 'fancy',
      name: 'Fancy',
      description: projects[0].description,
      category: 'Tools',
      tags: ['a'],
      featured: true,
      type: 'static',
      url: '/projects/fancy/',
      thumbnail: null,
    });
    assert.equal(catalog[1].name, 'Simple');
    assert.equal(catalog[1].category, 'Other');
  } finally {
    cleanup(root);
  }
});

test('adding and removing folders is reflected', () => {
  const root = makeTree({ 'one/index.html': html });
  try {
    assert.equal(discoverProjects(root).length, 1);
    writeTree(root, { 'two/index.html': html });
    assert.deepEqual(discoverProjects(root).map((p) => p.slug), ['one', 'two']);
    fs.rmSync(path.join(root, 'one'), { recursive: true });
    assert.deepEqual(discoverProjects(root).map((p) => p.slug), ['two']);
  } finally {
    cleanup(root);
  }
});

test('hidden projects are discovered but excluded from the catalog', () => {
  const root = makeTree({
    'shown/index.html': html,
    'secret/index.html': html,
    'secret/project.json': { hidden: true },
  });
  try {
    const projects = discoverProjects(root);
    assert.equal(projects.length, 2);
    assert.deepEqual(toCatalog(projects).map((p) => p.id), ['shown']);
  } finally {
    cleanup(root);
  }
});

test('a package.json alone does not enable build mode', () => {
  const root = makeTree({ 'app/index.html': html, 'app/package.json': { name: 'app' } });
  try {
    assert.equal(discoverProjects(root)[0].mode, 'static');
  } finally {
    cleanup(root);
  }
});

test('build mode requires opt-in plus package.json and lockfile', () => {
  const root = makeTree({
    'app/index.html': html,
    'app/package.json': { name: 'app' },
    'app/package-lock.json': {},
    'app/project.json': { build: { enabled: true } },
  });
  try {
    const [app] = discoverProjects(root);
    assert.equal(app.mode, 'build');
    assert.equal(toCatalog([app])[0].type, 'build');
    fs.rmSync(path.join(root, 'app/package-lock.json'));
    assert.throws(() => discoverProjects(root), /package-lock\.json/);
  } finally {
    cleanup(root);
  }
});

test('errors are collected and descriptive', () => {
  const root = makeTree({
    'Bad Name/index.html': html,
    'no-index/style.css': 'body{}',
    'broken-json/index.html': html,
    'broken-json/project.json': '{nope',
    'missing-thumb/index.html': html,
    'missing-thumb/project.json': { thumbnail: 'thumb.png' },
    'ok/index.html': html,
  });
  try {
    discoverProjects(root);
    assert.fail('should throw');
  } catch (err) {
    assert.ok(err instanceof DiscoveryError);
    assert.equal(err.errors.length, 4);
    const text = err.message;
    assert.match(text, /Bad Name/);
    assert.match(text, /no-index: no index\.html/);
    assert.match(text, /broken-json\/project\.json.*not valid JSON/s);
    assert.match(text, /missing-thumb.*doesn't exist/s);
  }
});

test('empty placeholder folders are skipped', () => {
  const root = makeTree({ 'coming-soon/.gitkeep': '', 'ok/index.html': html });
  try {
    assert.deepEqual(discoverProjects(root).map((p) => p.slug), ['ok']);
  } finally {
    cleanup(root);
  }
});

test('thumbnail becomes a /thumbnails/ URL', () => {
  const root = makeTree({ 'pic/index.html': html, 'pic/img/T.PNG': 'x', 'pic/project.json': { thumbnail: 'img/T.PNG' } });
  try {
    assert.equal(toCatalog(discoverProjects(root))[0].thumbnail, '/thumbnails/pic.png');
  } finally {
    cleanup(root);
  }
});

test('missing projects directory yields no projects', () => {
  assert.deepEqual(discoverProjects(path.join(makeTree(), 'nope')), []);
});

test('symlinked project folders are rejected', { skip: !canSymlink() && 'symlinks not permitted here' }, () => {
  const outside = makeTree({ 'index.html': html });
  const root = makeTree({});
  try {
    fs.symlinkSync(outside, path.join(root, 'linked'), 'junction');
    assert.throws(() => discoverProjects(root), /symlinked/);
  } finally {
    cleanup(root);
    cleanup(outside);
  }
});
