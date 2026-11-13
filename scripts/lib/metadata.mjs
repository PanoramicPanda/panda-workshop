import fs from 'node:fs';
import path from 'node:path';
import { relativePathProblem } from './paths.mjs';

export const METADATA_FILE = 'project.json';
export const DEFAULT_DESCRIPTION = 'A small project from the workshop.';
export const DEFAULT_CATEGORY = 'Other';
export const THUMBNAIL_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.avif']);

const ALLOWED_KEYS = new Set(['name', 'description', 'category', 'tags', 'featured', 'hidden', 'thumbnail', 'build']);
const ALLOWED_BUILD_KEYS = new Set(['enabled', 'command', 'output']);

export class MetadataError extends Error {
  constructor(file, problems) {
    super(`${file} has ${problems.length === 1 ? 'a problem' : `${problems.length} problems`}:\n  - ${problems.join('\n  - ')}`);
    this.name = 'MetadataError';
    this.file = file;
    this.problems = problems;
  }
}

/** "wow-calculator" -> "Wow Calculator" */
export function titleFromSlug(slug) {
  return slug
    .split('-')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

function optionalString(raw, key, problems, { maxLength = 500 } = {}) {
  if (!(key in raw)) return undefined;
  const value = raw[key];
  if (typeof value !== 'string') {
    problems.push(`"${key}" must be a string (got ${describeType(value)})`);
    return undefined;
  }
  const trimmed = value.trim();
  if (trimmed === '') {
    problems.push(`"${key}" must not be empty`);
    return undefined;
  }
  if (trimmed.length > maxLength) problems.push(`"${key}" must be at most ${maxLength} characters`);
  return trimmed;
}

function optionalBoolean(raw, key, problems) {
  if (!(key in raw)) return undefined;
  if (typeof raw[key] !== 'boolean') {
    problems.push(`"${key}" must be true or false (got ${describeType(raw[key])})`);
    return undefined;
  }
  return raw[key];
}

function describeType(value) {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'an array';
  return typeof value === 'object' ? 'an object' : `${typeof value} ${JSON.stringify(value)}`;
}

/**
 * Validates parsed project.json contents and returns normalized metadata with defaults applied.
 * Throws MetadataError listing every problem found.
 */
export function validateMetadata(raw, slug, file = `projects/${slug}/${METADATA_FILE}`) {
  const problems = [];
  if (raw === undefined) raw = {};
  if (!isPlainObject(raw)) throw new MetadataError(file, [`must contain a JSON object (got ${describeType(raw)})`]);

  for (const key of Object.keys(raw)) {
    if (!ALLOWED_KEYS.has(key)) {
      problems.push(`unknown field "${key}" (allowed: ${[...ALLOWED_KEYS].join(', ')})`);
    }
  }

  const name = optionalString(raw, 'name', problems, { maxLength: 80 });
  const description = optionalString(raw, 'description', problems, { maxLength: 500 });
  const category = optionalString(raw, 'category', problems, { maxLength: 40 });
  const featured = optionalBoolean(raw, 'featured', problems);
  const hidden = optionalBoolean(raw, 'hidden', problems);

  let tags = [];
  if ('tags' in raw) {
    if (!Array.isArray(raw.tags)) {
      problems.push(`"tags" must be an array of strings (got ${describeType(raw.tags)})`);
    } else {
      raw.tags.forEach((tag, i) => {
        if (typeof tag !== 'string' || tag.trim() === '') {
          problems.push(`"tags[${i}]" must be a non-empty string`);
        } else if (tag.length > 40) {
          problems.push(`"tags[${i}]" must be at most 40 characters`);
        }
      });
      tags = [...new Set(raw.tags.filter((t) => typeof t === 'string').map((t) => t.trim()).filter(Boolean))];
    }
  }

  let thumbnail = null;
  if ('thumbnail' in raw) {
    const problem = relativePathProblem(raw.thumbnail);
    if (problem) {
      problems.push(`"thumbnail" ${problem}`);
    } else if (!THUMBNAIL_EXTENSIONS.has(path.extname(raw.thumbnail).toLowerCase())) {
      problems.push(`"thumbnail" must be an image (${[...THUMBNAIL_EXTENSIONS].join(', ')})`);
    } else {
      thumbnail = raw.thumbnail.replace(/\\/g, '/');
    }
  }

  let build = { enabled: false, command: null, output: null };
  if ('build' in raw) {
    const b = raw.build;
    if (!isPlainObject(b)) {
      problems.push(`"build" must be an object like { "enabled": true, "command": "npm run build", "output": "dist" }`);
    } else {
      for (const key of Object.keys(b)) {
        if (!ALLOWED_BUILD_KEYS.has(key)) problems.push(`unknown field "build.${key}" (allowed: enabled, command, output)`);
      }
      if (typeof b.enabled !== 'boolean') {
        problems.push(`"build.enabled" must be true or false`);
      } else if (b.enabled) {
        const command = b.command ?? 'npm run build';
        const output = b.output ?? 'dist';
        if (typeof command !== 'string' || command.trim() === '') {
          problems.push(`"build.command" must be a non-empty string`);
        }
        const outProblem = relativePathProblem(output);
        if (outProblem) problems.push(`"build.output" ${outProblem}`);
        else if (/^\.?[\\/]?$/.test(output)) problems.push(`"build.output" must be a sub-folder (e.g. "dist"), not the project root`);
        build = { enabled: true, command: typeof command === 'string' ? command.trim() : null, output };
      }
    }
  }

  if (problems.length) throw new MetadataError(file, problems);

  return {
    name: name ?? titleFromSlug(slug),
    description: description ?? DEFAULT_DESCRIPTION,
    category: category ?? DEFAULT_CATEGORY,
    tags,
    featured: featured ?? false,
    hidden: hidden ?? false,
    thumbnail,
    build,
  };
}

/** Reads and validates projects/<slug>/project.json (optional). */
export function loadMetadata(projectDir, slug) {
  const file = path.join(projectDir, METADATA_FILE);
  const displayFile = `projects/${slug}/${METADATA_FILE}`;
  let raw;
  if (fs.existsSync(file)) {
    const stat = fs.lstatSync(file);
    if (!stat.isFile()) throw new MetadataError(displayFile, ['must be a regular file (symlinks are not allowed)']);
    const text = fs.readFileSync(file, 'utf8').replace(/^﻿/, '');
    try {
      raw = JSON.parse(text);
    } catch (err) {
      throw new MetadataError(displayFile, [`is not valid JSON: ${err.message}`]);
    }
  }
  return validateMetadata(raw, slug, displayFile);
}
