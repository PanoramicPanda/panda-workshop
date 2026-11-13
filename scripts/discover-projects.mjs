#!/usr/bin/env node
// Scans projects/ and writes the homepage catalog to src/generated/projects.json.
import { writeCatalog } from './lib/catalog.mjs';

try {
  const { projects, catalog } = writeCatalog();
  const hidden = projects.length - catalog.length;
  console.log(
    `🐼 Discovered ${projects.length} project${projects.length === 1 ? '' : 's'}` +
      (hidden ? ` (${hidden} hidden)` : '') +
      (projects.length ? `: ${projects.map((p) => `${p.slug}${p.mode === 'build' ? ' [build]' : ''}`).join(', ')}` : ''),
  );
} catch (err) {
  console.error(`\n${err.message}\n`);
  process.exit(1);
}
