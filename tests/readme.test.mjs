import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderReadmeBlock, updateReadmeText, START_MARKER, END_MARKER } from '../scripts/lib/readme.mjs';

const project = (over) => ({
  slug: 'demo',
  name: 'Demo',
  description: 'A demo.',
  category: 'Other',
  tags: [],
  featured: false,
  hidden: false,
  mode: 'static',
  ...over,
});

test('renders one section per visible project', () => {
  const block = renderReadmeBlock([
    project({ slug: 'b-tool', name: 'B Tool', tags: ['x', 'y'] }),
    project({ slug: 'a-app', name: 'A App', mode: 'build', featured: true }),
    project({ slug: 'secret', name: 'Secret', hidden: true }),
  ]);
  assert.match(block, /### A App ⭐/);
  assert.match(block, /### B Tool/);
  assert.ok(block.indexOf('A App') < block.indexOf('B Tool'), 'featured first');
  assert.doesNotMatch(block, /Secret/);
  assert.match(block, /https:\/\/panoramicpanda\.me\/projects\/b-tool\//);
  assert.match(block, /Built app \(Vite \+ React\)/);
  assert.match(block, /`x`, `y`/);
});

test('empty state message when nothing is published', () => {
  assert.match(renderReadmeBlock([]), /No projects published yet/);
});

test('markdown special characters are escaped', () => {
  const block = renderReadmeBlock([project({ name: 'Under_score *star*', description: '<script>' })]);
  assert.match(block, /Under\\_score \\\*star\\\*/);
  assert.match(block, /\\<script\\>/);
});

test('replaces only the marked block and is idempotent', () => {
  const original = `# Title\n\nIntro.\n\n${START_MARKER}\n\nold\n\n${END_MARKER}\n\n## After\n`;
  const first = updateReadmeText(original, 'new');
  assert.equal(first.changed, true);
  assert.match(first.text, /# Title\n\nIntro\./);
  assert.match(first.text, /## After\n$/);
  assert.doesNotMatch(first.text, /old/);
  assert.equal(updateReadmeText(first.text, 'new').changed, false);
});

test('appends a Projects section when markers are missing', () => {
  const { text } = updateReadmeText('# Title\n', 'content');
  assert.match(text, /## Projects\n\n<!-- PROJECTS:START[^>]*-->\n\ncontent\n\n<!-- PROJECTS:END -->\n$/);
});
