import { test } from 'node:test';
import assert from 'node:assert/strict';
import { filterProjects, categoriesOf, matchesQuery } from '../src/lib/search.js';

const projects = [
  { id: 'a', name: 'Hunter Pet Guide', description: 'Pets to tame', category: 'Gaming', tags: ['WoW', 'Hunter'] },
  { id: 'b', name: 'MCU Chart', description: 'Release order timeline', category: 'Entertainment', tags: ['Marvel'] },
  { id: 'c', name: 'Misc', description: 'Thing', category: 'Other', tags: [] },
];

test('search covers name, description, category and tags (case-insensitive, all words)', () => {
  assert.deepEqual(filterProjects(projects, { query: 'hunter' }).map((p) => p.id), ['a']);
  assert.deepEqual(filterProjects(projects, { query: 'TIMELINE' }).map((p) => p.id), ['b']);
  assert.deepEqual(filterProjects(projects, { query: 'gaming' }).map((p) => p.id), ['a']);
  assert.deepEqual(filterProjects(projects, { query: 'marvel' }).map((p) => p.id), ['b']);
  assert.deepEqual(filterProjects(projects, { query: 'wow pets' }).map((p) => p.id), ['a']);
  assert.deepEqual(filterProjects(projects, { query: 'wow marvel' }), []);
  assert.equal(matchesQuery(projects[0], '   '), true);
});

test('category filter combines with search', () => {
  assert.deepEqual(filterProjects(projects, { category: 'Entertainment' }).map((p) => p.id), ['b']);
  assert.deepEqual(filterProjects(projects, { category: 'Gaming', query: 'marvel' }), []);
});

test('categories are counted and "Other" sorts last', () => {
  assert.deepEqual(categoriesOf(projects), [
    { name: 'Entertainment', count: 1 },
    { name: 'Gaming', count: 1 },
    { name: 'Other', count: 1 },
  ]);
});
