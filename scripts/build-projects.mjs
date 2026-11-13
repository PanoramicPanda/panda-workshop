#!/usr/bin/env node
// Publishes every discovered project into dist/projects/<slug>/ and thumbnails into dist/thumbnails/.
// Run after `vite build` (which empties dist/). Any failure exits non-zero so deployment stops.
import fs from 'node:fs';
import path from 'node:path';
import { DIST_DIR } from './lib/paths.mjs';
import { discoverProjects, thumbnailPublicPath } from './lib/discover.mjs';
import { publishProject } from './lib/build.mjs';

async function main() {
  if (!fs.existsSync(path.join(DIST_DIR, 'index.html'))) {
    throw new Error('dist/index.html is missing — run "vite build" before scripts/build-projects.mjs (or just use "npm run build").');
  }
  const projects = discoverProjects();

  // Start from a clean slate so removed projects never linger.
  fs.rmSync(path.join(DIST_DIR, 'projects'), { recursive: true, force: true });
  fs.rmSync(path.join(DIST_DIR, 'thumbnails'), { recursive: true, force: true });
  fs.mkdirSync(path.join(DIST_DIR, 'projects'), { recursive: true });

  const failures = [];
  for (const project of projects) {
    console.log(`\n▶ ${project.slug} (${project.mode})`);
    try {
      const { files } = await publishProject(project, DIST_DIR);
      console.log(`  ✓ published ${files.length} file${files.length === 1 ? '' : 's'} → /projects/${project.slug}/`);
      const thumb = thumbnailPublicPath(project);
      if (thumb) {
        const dest = path.join(DIST_DIR, thumb);
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        fs.copyFileSync(path.join(project.dir, project.thumbnail), dest);
      }
    } catch (err) {
      console.error(`  ✗ ${err.message}`);
      failures.push(`${project.slug}: ${err.message}`);
    }
  }

  if (failures.length) {
    throw new Error(`${failures.length} project${failures.length === 1 ? '' : 's'} failed to build:\n  - ${failures.join('\n  - ')}`);
  }
  console.log(`\n🐼 Published ${projects.length} project${projects.length === 1 ? '' : 's'}.`);
}

main().catch((err) => {
  console.error(`\nBuild failed: ${err.message}\n`);
  process.exit(1);
});
