import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildCatalog } from '../src/lib/catalog.js';

const dataDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data');
export const readData = (name) => JSON.parse(fs.readFileSync(path.join(dataDir, name), 'utf8'));
export const rawData = () => ({ families: readData('families.json'), abilities: readData('abilities.json'), pets: readData('pets.json') });
export const catalog = buildCatalog(rawData());

/** A plan stop as "ability+rank:first own pet (or -):other-continent count", for compact assertions. */
export const summarize = (stops) =>
  stops.map((s) => [s.title, s.items.map((i) => `${i.ability}${i.rank}:${i.own[0] ?? '-'}:${i.alt.length}`)]);
