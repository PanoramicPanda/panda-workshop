#!/usr/bin/env node
// Regenerates the "Projects" section of README.md from project metadata.
// Used by `npm run build`, `npm run readme`, and the CI "readme" job (which commits the result).
import fs from 'node:fs';
import { README_FILE } from './lib/paths.mjs';
import { discoverProjects } from './lib/discover.mjs';
import { renderReadmeBlock, updateReadmeText } from './lib/readme.mjs';

try {
  const projects = discoverProjects();
  const current = fs.existsSync(README_FILE) ? fs.readFileSync(README_FILE, 'utf8') : '# Panda Workshop\n';
  const { text, changed } = updateReadmeText(current, renderReadmeBlock(projects));
  if (changed) {
    fs.writeFileSync(README_FILE, text);
    console.log('📝 README.md project list updated.');
  } else {
    console.log('📝 README.md project list already up to date.');
  }
} catch (err) {
  console.error(`\n${err.message}\n`);
  process.exit(1);
}
