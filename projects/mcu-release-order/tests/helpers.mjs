import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildCatalog } from '../src/lib/catalog.js';
import { DEFAULT_STATE } from '../src/lib/filter.js';

const dataDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data');
export const readData = (name) => JSON.parse(fs.readFileSync(path.join(dataDir, name), 'utf8'));
export const rawData = () => ({ titles: readData('titles.json'), phases: readData('phases.json'), watchlists: readData('watchlists.json') });
export const catalog = buildCatalog(rawData());
export const state = (patch = {}) => ({ ...DEFAULT_STATE, ...patch });
