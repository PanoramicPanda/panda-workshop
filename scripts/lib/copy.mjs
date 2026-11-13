import fs from 'node:fs';
import path from 'node:path';
import { assertInside } from './paths.mjs';

/**
 * Files and folders that are never published, whatever kind of project they live in.
 * Matching is done on the base name (case-insensitive).
 */
const EXCLUDED_NAMES = new Set([
  '.git',
  '.gitignore',
  '.gitattributes',
  'node_modules',
  '.npmrc',
  '.yarnrc',
  '.yarnrc.yml',
  '.cache',
  '.vite',
  '.parcel-cache',
  '.turbo',
  '.ds_store',
  'thumbs.db',
  'desktop.ini',
  'project.json',
  'package.json',
  'package-lock.json',
  'npm-shrinkwrap.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  'id_rsa',
  'id_dsa',
  'id_ecdsa',
  'id_ed25519',
  '.htpasswd',
  '.netrc',
  'credentials.json',
]);

const EXCLUDED_PATTERNS = [
  /^\.env($|\.)/i, // .env, .env.local, .env.production …
  /\.env$/i, // production.env
  /\.(pem|key|p12|pfx|crt|cer|keystore|jks)$/i,
  /^id_(rsa|dsa|ecdsa|ed25519)/i,
  /\.log$/i,
  /\.(swp|swo)$/i,
  /~$/,
];

/** Returns true if a file or directory with this base name must never be published. */
export function isExcluded(name) {
  const lower = name.toLowerCase();
  if (EXCLUDED_NAMES.has(lower)) return true;
  return EXCLUDED_PATTERNS.some((re) => re.test(name));
}

/**
 * Recursively copies `src` into `dest`, byte-for-byte, skipping excluded files.
 * Symlinks are never followed (they're skipped with a warning), so nothing outside `src` can leak.
 * Returns { files: string[] (relative posix paths), skipped: string[] }.
 */
export function copyStatic(src, dest, { onWarn = (msg) => console.warn(msg), exclude = isExcluded } = {}) {
  const root = path.resolve(src);
  const files = [];
  const skipped = [];

  function walk(dir, rel) {
    const target = path.join(dest, rel);
    fs.mkdirSync(target, { recursive: true });
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const relPath = rel ? `${rel}/${entry.name}` : entry.name;
      const full = path.join(dir, entry.name);
      assertInside(root, full, 'file');
      if (exclude(entry.name)) {
        skipped.push(relPath);
        continue;
      }
      const stat = fs.lstatSync(full);
      if (stat.isSymbolicLink()) {
        onWarn(`  ! skipping symlink ${relPath} (symlinks are never followed)`);
        skipped.push(relPath);
      } else if (stat.isDirectory()) {
        walk(full, relPath);
      } else if (stat.isFile()) {
        fs.copyFileSync(full, path.join(dest, relPath));
        files.push(relPath);
      } else {
        skipped.push(relPath);
      }
    }
  }

  walk(root, '');
  return { files, skipped };
}
