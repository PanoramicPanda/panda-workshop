#!/usr/bin/env node
// Checks src/data/*.json before every build so a typo in an id, date or link
// fails loudly instead of silently dropping a connection from the chart.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { startKey } from '../src/lib/dates.js';

const dataDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data');
const read = (name) => JSON.parse(fs.readFileSync(path.join(dataDir, name), 'utf8'));

export function validate({ titles, phases, watchlists }) {
  const problems = [];
  const KINDS = ['film', 'series', 'special', 'short'];
  const RELS = ['sets', 'ties'];
  const TITLE_KEYS = new Set(['id', 'phase', 'work', 'title', 'season', 'kind', 'date', 'sortKey', 'releaseNote', 'episodes',
    'shortTitle', 'adjacent', 'split', 'live', 'soon', 'after', 'note', 'links', 'leadIns', 'series']);
  const phaseIds = new Set(phases.map((p) => p.id));
  const ids = new Set();
  const seriesCount = {};

  for (const t of titles) {
    const where = `titles.json "${t.id ?? t.title ?? '?'}"`;
    if (!t.id || !/^[a-z0-9-]+$/.test(t.id)) problems.push(`${where}: id must be lowercase letters, numbers and hyphens.`);
    if (ids.has(t.id)) problems.push(`${where}: duplicate id.`);
    ids.add(t.id);
    for (const k of Object.keys(t)) if (!TITLE_KEYS.has(k)) problems.push(`${where}: unknown field "${k}".`);
    if (!t.title) problems.push(`${where}: missing "title".`);
    if (!t.note) problems.push(`${where}: missing "note".`);
    if (!KINDS.includes(t.kind)) problems.push(`${where}: kind "${t.kind}" must be one of ${KINDS.join(', ')}.`);
    if (!t.after && !phaseIds.has(t.phase)) problems.push(`${where}: phase ${t.phase} is not in phases.json.`);
    if (typeof t.date !== 'string' || Number.isNaN(startKey(t))) problems.push(`${where}: date "${t.date}" can't be parsed (use "Mon D, YYYY" or add a numeric "sortKey").`);
    if ((t.note.match(/\{\{/g) || []).length !== (t.note.match(/\}\}/g) || []).length) problems.push(`${where}: unbalanced {{spoiler}} markers in note.`);
    if (t.series != null) {
      const list = [].concat(t.series);
      if (!list.length || !list.every((s) => typeof s === 'string' && /^[a-z0-9-]+$/.test(s))) {
        problems.push(`${where}: "series" must be a lowercase-hyphenated name, or a list of them.`);
      }
      for (const s of list) (seriesCount[s] ??= []).push(t.id);
    }
  }
  for (const [s, members] of Object.entries(seriesCount)) {
    if (members.length < 2) problems.push(`titles.json series "${s}" has only one title (${members[0]}); a series needs at least two to link.`);
  }

  const pairs = new Set();
  for (const t of titles) {
    for (const l of t.links ?? []) {
      const where = `titles.json "${t.id}" → "${l.to}"`;
      if (!ids.has(l.to)) problems.push(`${where}: link target doesn't exist.`);
      if (l.to === t.id) problems.push(`${where}: links to itself.`);
      if (!RELS.includes(l.rel)) problems.push(`${where}: rel "${l.rel}" must be "sets" or "ties" (sequel links are generated from "series").`);
      if (!l.text) problems.push(`${where}: missing link text.`);
      const key = [t.id, l.to].sort().join('|');
      if (pairs.has(key)) problems.push(`${where}: this pair is already linked (write each connection once; the other side is generated).`);
      pairs.add(key);
    }
    for (const lead of t.leadIns ?? []) {
      if (!ids.has(lead.from)) problems.push(`titles.json "${t.id}" leadIns: "${lead.from}" doesn't exist.`);
    }
  }

  const listIds = new Set();
  for (const w of watchlists) {
    const where = `watchlists.json "${w.id}"`;
    if (listIds.has(w.id)) problems.push(`${where}: duplicate id.`);
    listIds.add(w.id);
    if (!ids.has(w.target)) problems.push(`${where}: target "${w.target}" doesn't exist.`);
    if (!['official', 'curated'].includes(w.source)) problems.push(`${where}: source must be "official" or "curated".`);
    if (!w.label || !w.chip) problems.push(`${where}: needs "label" and "chip".`);
    for (const m of w.members) {
      if (!ids.has(m)) problems.push(`${where}: member "${m}" doesn't exist.`);
      if (m === w.target) problems.push(`${where}: the target shouldn't also be a member.`);
    }
    if (new Set(w.members).size !== w.members.length) problems.push(`${where}: duplicate members.`);
  }
  return problems;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const problems = validate({ titles: read('titles.json'), phases: read('phases.json'), watchlists: read('watchlists.json') });
  if (problems.length) {
    console.error(`\nChart data has ${problems.length} problem${problems.length === 1 ? '' : 's'}:\n  - ${problems.join('\n  - ')}\n`);
    process.exit(1);
  }
  console.log('✓ Chart data looks good.');
}
