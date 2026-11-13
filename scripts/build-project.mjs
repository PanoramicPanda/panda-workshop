#!/usr/bin/env node
// Builds (or, for static projects, validates) a single project.
// Usage: npm run build:project -- <slug>
//   Built projects: runs npm ci + the build command inside projects/<slug>/ with
//   PROJECT_BASE_PATH=/projects/<slug>/, leaving output in its own build folder
//   (which `npm run dev` then serves). Use `npm run build` for the full site.
import { assertSafeSlug } from './lib/paths.mjs';
import { discoverProjects } from './lib/discover.mjs';
import { runProjectBuild } from './lib/build.mjs';

async function main() {
  const slug = process.argv[2];
  if (!slug) throw new Error('Usage: npm run build:project -- <project-folder-name>');
  assertSafeSlug(slug);
  const project = discoverProjects().find((p) => p.slug === slug);
  if (!project) throw new Error(`No project named "${slug}" in projects/.`);
  if (project.mode !== 'build') {
    console.log(`projects/${slug} is a static project — nothing to build. Its files are published as-is.`);
    return;
  }
  const out = await runProjectBuild(project);
  console.log(`\n✓ Built projects/${slug} → ${out}`);
}

main().catch((err) => {
  console.error(`\n${err.message}\n`);
  process.exit(1);
});
