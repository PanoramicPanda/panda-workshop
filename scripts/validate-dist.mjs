#!/usr/bin/env node
// Final sanity checks on dist/ before it is uploaded to GitHub Pages.
import fs from 'node:fs';
import path from 'node:path';
import { DIST_DIR, CATALOG_FILE } from './lib/paths.mjs';
import { discoverProjects } from './lib/discover.mjs';
import { isExcluded } from './lib/copy.mjs';

const problems = [];
const check = (ok, msg) => ok || problems.push(msg);

check(fs.existsSync(path.join(DIST_DIR, 'index.html')), 'dist/index.html is missing.');
check(fs.existsSync(path.join(DIST_DIR, 'assets')), 'dist/assets/ is missing.');

const projects = discoverProjects();
const catalog = JSON.parse(fs.readFileSync(CATALOG_FILE, 'utf8'));
const slugs = new Set(projects.map((p) => p.slug));

// Every catalog entry must point at a real published page.
for (const entry of catalog) {
  check(/^\/projects\/[a-z0-9-]+\/$/.test(entry.url), `Catalog URL "${entry.url}" is malformed.`);
  check(fs.existsSync(path.join(DIST_DIR, entry.url, 'index.html')), `Catalog entry "${entry.id}" → ${entry.url} has no published index.html.`);
  if (entry.thumbnail) check(fs.existsSync(path.join(DIST_DIR, entry.thumbnail)), `Thumbnail ${entry.thumbnail} is missing.`);
}

// Every project (hidden included) must be published; nothing else may be.
const publishedDir = path.join(DIST_DIR, 'projects');
const published = fs.existsSync(publishedDir) ? fs.readdirSync(publishedDir) : [];
for (const slug of slugs) check(published.includes(slug), `projects/${slug} was not published.`);
for (const name of published) check(slugs.has(name), `dist/projects/${name} is stale or unexpected.`);

// No sensitive or development files anywhere in the output.
const SOURCE_EXT = /\.(jsx|tsx|ts|vue|svelte)$/i;
const buildSlugs = new Set(projects.filter((p) => p.mode === 'build').map((p) => p.slug));
function walk(dir, rel) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const relPath = rel ? `${rel}/${entry.name}` : entry.name;
    check(!isExcluded(entry.name), `Forbidden file published: dist/${relPath}`);
    check(!entry.isSymbolicLink(), `Symlink in output: dist/${relPath}`);
    const [top, slug] = relPath.split('/');
    if (top === 'projects' && buildSlugs.has(slug) && SOURCE_EXT.test(entry.name) && !entry.name.endsWith('.d.ts')) {
      problems.push(`Source file published for built project: dist/${relPath}`);
    }
    if (entry.isDirectory()) walk(path.join(dir, entry.name), relPath);
  }
}
walk(DIST_DIR, '');

if (problems.length) {
  console.error(`\ndist/ validation failed:\n  - ${problems.join('\n  - ')}\n`);
  process.exit(1);
}
console.log(`✅ dist/ looks good: homepage + ${published.length} project${published.length === 1 ? '' : 's'}.`);
