import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const PROJECTS_DIR = path.join(ROOT_DIR, 'projects');
export const DIST_DIR = path.join(ROOT_DIR, 'dist');
export const CATALOG_FILE = path.join(ROOT_DIR, 'src', 'generated', 'projects.json');
export const README_FILE = path.join(ROOT_DIR, 'README.md');

export const SITE_URL = 'https://panoramicpanda.me';
export const REPO_URL = 'https://github.com/PanoramicPanda/panda-workshop';

/** Project folder names that would collide with homepage output or are otherwise unsafe. */
export const RESERVED_SLUGS = new Set(['assets', 'thumbnails', 'projects', 'generated', 'node_modules']);

const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/;

/** Returns null if the slug is usable, otherwise a human-readable reason. */
export function slugProblem(slug) {
  if (typeof slug !== 'string' || slug.length === 0) return 'folder name is empty';
  if (!SLUG_PATTERN.test(slug)) {
    return 'folder names must be 1–64 characters of lowercase letters, numbers, and hyphens, and must start and end with a letter or number (e.g. "my-tool")';
  }
  if (slug.includes('--')) return 'folder names may not contain consecutive hyphens';
  if (RESERVED_SLUGS.has(slug)) return `"${slug}" is a reserved name`;
  return null;
}

export function assertSafeSlug(slug) {
  const problem = slugProblem(slug);
  if (problem) throw new Error(`Invalid project folder "${slug}": ${problem}.`);
  return slug;
}

/** True when `child` resolves to `parent` itself or somewhere beneath it. */
export function isInside(parent, child) {
  const rel = path.relative(path.resolve(parent), path.resolve(child));
  return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel));
}

export function assertInside(parent, child, label = 'path') {
  if (!isInside(parent, child)) {
    throw new Error(`Refusing to use ${label} "${child}" because it is outside "${parent}".`);
  }
  return path.resolve(child);
}

/**
 * Validates a relative path declared in metadata (thumbnail, build output).
 * Returns null when OK, otherwise a reason.
 */
export function relativePathProblem(value) {
  if (typeof value !== 'string' || value.trim() === '') return 'must be a non-empty string';
  if (value.includes('\0')) return 'must not contain null bytes';
  if (path.isAbsolute(value) || path.win32.isAbsolute(value) || value.startsWith('/') || value.startsWith('\\')) {
    return 'must be a relative path inside the project folder';
  }
  if (/^[a-z][a-z0-9+.-]*:/i.test(value)) return 'must be a relative path, not a URL';
  const parts = value.split(/[\\/]+/);
  if (parts.includes('..')) return 'must not contain ".." segments';
  return null;
}

export function projectUrl(slug) {
  return `/projects/${slug}/`;
}

export function projectBasePath(slug) {
  return `/projects/${slug}/`;
}

export function toPosix(p) {
  return p.split(path.sep).join('/');
}
