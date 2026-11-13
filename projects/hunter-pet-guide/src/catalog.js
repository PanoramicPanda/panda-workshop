import families from './data/families.json';
import abilities from './data/abilities.json';
import pets from './data/pets.json';
import { buildCatalog } from './lib/catalog.js';

/** The guide's data, built once and shared by every component. */
export const catalog = buildCatalog({ families, abilities, pets });
