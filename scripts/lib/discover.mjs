import fs from 'node:fs';
import path from 'node:path';
import { PROJECTS_DIR, slugProblem, projectUrl, isInside } from './paths.mjs';
import { loadMetadata, MetadataError } from './metadata.mjs';

export class DiscoveryError extends Error {
  constructor(errors) {
    super(`Project discovery found ${errors.length} problem${errors.length === 1 ? '' : 's'}:\n\n${errors.join('\n\n')}`);
    this.name = 'DiscoveryError';
    this.errors = errors;
  }
}

/** Files that don't, on their own, make a folder a project (lets people stash notes or a placeholder). */
const IGNORABLE_ONLY = new Set(['.gitkeep', 'readme.md', '.ds_store', 'thumbs.db']);

/**
 * Scans immediate child folders of `projectsDir`.
 * Returns every valid project (hidden ones included). Throws DiscoveryError if any folder is invalid.
 */
export function discoverProjects(projectsDir = PROJECTS_DIR) {
  if (!fs.existsSync(projectsDir)) return [];
  const projects = [];
  const errors = [];

  const entries = fs.readdirSync(projectsDir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name));
  for (const entry of entries) {
    const slug = entry.name;
    if (slug.startsWith('.')) continue; // .gitkeep, .DS_Store, etc.
    const dir = path.join(projectsDir, slug);
    const stat = fs.lstatSync(dir);

    if (stat.isSymbolicLink()) {
      errors.push(`✗ projects/${slug}: symlinked project folders are not allowed. Move the real folder into projects/.`);
      continue;
    }
    if (!stat.isDirectory()) continue; // stray files at the top level are ignored

    const problem = slugProblem(slug);
    if (problem) {
      errors.push(`✗ projects/${slug}: ${problem}. Rename the folder — its name becomes the URL.`);
      continue;
    }

    let metadata;
    try {
      metadata = loadMetadata(dir, slug);
    } catch (err) {
      errors.push(`✗ ${err instanceof MetadataError ? err.message : `projects/${slug}: ${err.message}`}`);
      continue;
    }

    const mode = metadata.build.enabled ? 'build' : 'static';
    const indexFile = path.join(dir, 'index.html');
    const hasIndex = fs.existsSync(indexFile) && fs.lstatSync(indexFile).isFile();

    if (!hasIndex) {
      const contents = fs.readdirSync(dir).filter((n) => !IGNORABLE_ONLY.has(n.toLowerCase()));
      if (contents.length === 0) continue; // empty placeholder folder — nothing to publish yet
      errors.push(
        mode === 'build'
          ? `✗ projects/${slug}: built projects still need an index.html at the project root (the Vite entry point).`
          : `✗ projects/${slug}: no index.html found. Every project needs an index.html in its folder root.`,
      );
      continue;
    }

    if (mode === 'build' && !fs.existsSync(path.join(dir, 'package.json'))) {
      errors.push(`✗ projects/${slug}: "build.enabled" is true but there is no package.json.`);
      continue;
    }
    if (mode === 'build' && !fs.existsSync(path.join(dir, 'package-lock.json'))) {
      errors.push(`✗ projects/${slug}: built projects need a committed package-lock.json (run "npm install" inside the project folder).`);
      continue;
    }

    if (metadata.thumbnail) {
      const thumbPath = path.join(dir, metadata.thumbnail);
      if (!isInside(dir, thumbPath) || !fs.existsSync(thumbPath) || !fs.lstatSync(thumbPath).isFile()) {
        errors.push(`✗ projects/${slug}/project.json: "thumbnail" points to "${metadata.thumbnail}", which doesn't exist in the project folder.`);
        continue;
      }
    }

    projects.push({ slug, dir, mode, ...metadata });
  }

  if (errors.length) throw new DiscoveryError(errors);
  return projects;
}

export function thumbnailPublicPath(project) {
  if (!project.thumbnail) return null;
  return `/thumbnails/${project.slug}${path.extname(project.thumbnail).toLowerCase()}`;
}

/** Public catalog consumed by the homepage: hidden projects removed, featured first, then by name. */
export function toCatalog(projects) {
  return projects
    .filter((p) => !p.hidden)
    .sort((a, b) => Number(b.featured) - Number(a.featured) || a.name.localeCompare(b.name))
    .map((p) => ({
      id: p.slug,
      name: p.name,
      description: p.description,
      category: p.category,
      tags: p.tags,
      featured: p.featured,
      type: p.mode,
      url: projectUrl(p.slug),
      thumbnail: thumbnailPublicPath(p),
    }));
}
