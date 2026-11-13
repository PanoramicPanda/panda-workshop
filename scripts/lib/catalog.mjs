import fs from 'node:fs';
import path from 'node:path';
import { CATALOG_FILE, PROJECTS_DIR } from './paths.mjs';
import { discoverProjects, toCatalog } from './discover.mjs';

/** Discovers projects and writes src/generated/projects.json (only if it changed). */
export function writeCatalog({ projectsDir = PROJECTS_DIR, file = CATALOG_FILE } = {}) {
  const projects = discoverProjects(projectsDir);
  const catalog = toCatalog(projects);
  const json = `${JSON.stringify(catalog, null, 2)}\n`;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const previous = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
  if (previous !== json) fs.writeFileSync(file, json);
  return { projects, catalog, changed: previous !== json };
}
