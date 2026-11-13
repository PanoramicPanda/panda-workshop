#!/usr/bin/env node
// Checks src/data/*.json before every build so a typo in a pet id, family or
// level fails loudly instead of silently dropping a pet from the guide.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dataDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data');
const read = (name) => JSON.parse(fs.readFileSync(path.join(dataDir, name), 'utf8'));

const FAMILY_KEYS = new Set(['id', 'name', 'singular', 'diet', 'notes', 'extra']);
const ABILITY_KEYS = new Set(['id', 'name', 'description', 'passive', 'allFamilies', 'families', 'ranks']);
const RANK_KEYS = new Set(['rank', 'source', 'petLevel', 'tp', 'effect', 'pets']);
const PET_KEYS = new Set(['id', 'name', 'family', 'level', 'zone', 'region', 'speed']);
const SOURCES = ['pet', 'trainer', 'none'];
const REGIONS = ['E', 'K', 'Z'];
// Petopia lists these pets as teaching a skill their family can't learn. Kept as
// published; anything new of this kind still fails the build.
const KNOWN_FAMILY_MISMATCHES = new Set(['bite/4/4825', 'claw/5/4343', 'shellshield/1/4825']);

const unknownKeys = (obj, allowed, where, problems) => {
  for (const k of Object.keys(obj)) if (!allowed.has(k)) problems.push(`${where}: unknown field "${k}".`);
};

export function validate({ families, abilities, pets }) {
  const problems = [];

  const famIds = new Set();
  for (const f of families) {
    const where = `families.json "${f.id ?? f.name ?? '?'}"`;
    unknownKeys(f, FAMILY_KEYS, where, problems);
    if (!f.id || !/^[a-z]+$/.test(f.id)) problems.push(`${where}: id must be lowercase letters.`);
    if (famIds.has(f.id)) problems.push(`${where}: duplicate id.`);
    famIds.add(f.id);
    if (!f.name || !f.singular) problems.push(`${where}: needs "name" and "singular".`);
    if (!Array.isArray(f.extra)) problems.push(`${where}: "extra" must be an array.`);
  }

  const petById = new Map();
  for (const p of pets) {
    const where = `pets.json ${p.id ?? '?'} "${p.name ?? '?'}"`;
    unknownKeys(p, PET_KEYS, where, problems);
    if (!Number.isInteger(p.id) || p.id <= 0) problems.push(`${where}: id must be the pet's Wowhead NPC id.`);
    if (petById.has(p.id)) problems.push(`${where}: duplicate id.`);
    petById.set(p.id, p);
    if (!p.name) problems.push(`${where}: missing "name".`);
    if (!famIds.has(p.family)) problems.push(`${where}: family "${p.family}" is not in families.json.`);
    if (typeof p.level !== 'string' || !/^\d+(-\d+)?$/.test(p.level)) problems.push(`${where}: level "${p.level}" must look like "12" or "12-14".`);
    if (!p.zone) problems.push(`${where}: missing "zone".`);
    if (!REGIONS.includes(p.region)) problems.push(`${where}: region "${p.region}" must be one of ${REGIONS.join(', ')}.`);
    if (typeof p.speed !== 'string' || !/^\d\.\d$/.test(p.speed)) problems.push(`${where}: speed "${p.speed}" must look like "2.0".`);
  }

  const abIds = new Set();
  for (const a of abilities) {
    const where = `abilities.json "${a.id ?? a.name ?? '?'}"`;
    unknownKeys(a, ABILITY_KEYS, where, problems);
    if (!a.id || !/^[a-z]+$/.test(a.id)) problems.push(`${where}: id must be lowercase letters.`);
    if (abIds.has(a.id)) problems.push(`${where}: duplicate id.`);
    abIds.add(a.id);
    if (!a.name) problems.push(`${where}: missing "name".`);
    for (const f of a.families) if (!famIds.has(f)) problems.push(`${where}: family "${f}" is not in families.json.`);
    if (!a.allFamilies && !a.families.length) problems.push(`${where}: no family can learn it (set "allFamilies" or list "families").`);
    const seen = new Set();
    let prev = 0;
    for (const r of a.ranks) {
      const rw = `${where} rank ${r.rank}`;
      unknownKeys(r, RANK_KEYS, rw, problems);
      if (!Number.isInteger(r.rank) || r.rank < 1) problems.push(`${rw}: rank must be a positive whole number.`);
      if (seen.has(r.rank)) problems.push(`${rw}: duplicate rank.`);
      if (r.rank <= prev) problems.push(`${rw}: ranks must be listed in increasing order.`);
      seen.add(r.rank);
      prev = r.rank;
      if (!SOURCES.includes(r.source)) problems.push(`${rw}: source "${r.source}" must be one of ${SOURCES.join(', ')}.`);
      if (!Number.isInteger(r.petLevel) || !Number.isInteger(r.tp)) problems.push(`${rw}: "petLevel" and "tp" must be whole numbers.`);
      if (r.source === 'pet' && !r.pets.length) problems.push(`${rw}: source is "pet" but no pets are listed.`);
      if (r.source !== 'pet' && r.pets.length) problems.push(`${rw}: only source "pet" ranks list pets.`);
      for (const id of r.pets) {
        const p = petById.get(id);
        if (!p) problems.push(`${rw}: pet ${id} is not in pets.json.`);
        else if (!a.allFamilies && !a.families.includes(p.family) && !KNOWN_FAMILY_MISMATCHES.has(`${a.id}/${r.rank}/${id}`)) problems.push(`${rw}: pet ${id} (${p.name}) is a ${p.family}, which can't learn ${a.name}.`);
      }
      if (new Set(r.pets).size !== r.pets.length) problems.push(`${rw}: duplicate pets.`);
    }
  }
  return problems;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const problems = validate({ families: read('families.json'), abilities: read('abilities.json'), pets: read('pets.json') });
  if (problems.length) {
    console.error(`\nPet data has ${problems.length} problem${problems.length === 1 ? '' : 's'}:\n  - ${problems.join('\n  - ')}\n`);
    process.exit(1);
  }
  console.log('✓ Pet data looks good.');
}
