/**
 * Turns the raw JSON into lookups the guide renders from, plus the
 * `alsoIndex`: for each pet id, every [abilityId, rank] it can teach.
 */
export function buildCatalog({ families, abilities, pets }) {
  const abilityList = abilities.map((a) => ({ ...a, byRank: Object.fromEntries(a.ranks.map((r) => [r.rank, r])) }));
  const alsoIndex = {};
  for (const a of abilityList) {
    for (const r of a.ranks) for (const id of r.pets) (alsoIndex[id] ??= []).push([a.id, r.rank]);
  }
  return {
    families: [...families].sort((a, b) => a.name.localeCompare(b.name)),
    familyById: Object.fromEntries(families.map((f) => [f.id, f])),
    abilities: abilityList,
    abilityById: Object.fromEntries(abilityList.map((a) => [a.id, a])),
    pets: [...pets].sort((a, b) => a.id - b.id),
    petById: Object.fromEntries(pets.map((p) => [p.id, p])),
    alsoIndex,
  };
}

export const learnable = (c, abilityId, fam) => {
  const a = c.abilityById[abilityId];
  return a.allFamilies || a.families.includes(fam);
};

/** Tamed (non-passive) abilities a family can learn, by name. */
export const actives = (c, fam) =>
  c.abilities.filter((a) => !a.passive && learnable(c, a.id, fam)).sort((a, b) => a.name.localeCompare(b.name));

/** Pet-trainer passives a family can learn. */
export const passives = (c, fam) => c.abilities.filter((a) => a.passive && learnable(c, a.id, fam));

export const rankOf = (c, abilityId, rank) => c.abilityById[abilityId].byRank[rank];

/** The lowest level a pet spawns at ("40-41" → 40). */
export const lowLevel = (pet) => parseInt(pet.level, 10) || 1;

/**
 * Other [abilityId, rank] pairs this pet teaches that `fam` can learn,
 * excluding `cur`, and (optionally) only ranks a pet of level `maxPetLevel` can use.
 */
export function alsoList(c, petId, cur, fam, maxPetLevel) {
  return (c.alsoIndex[petId] ?? []).filter(([s, r]) => {
    if (cur && s === cur[0] && r === cur[1]) return false;
    if (!learnable(c, s, fam)) return false;
    if (maxPetLevel != null && rankOf(c, s, r).petLevel > maxPetLevel) return false;
    return true;
  });
}

/** "Bite 3, Dash 1": what else a pet teaches, as shown next to its name. */
export const alsoText = (c, petId, cur, fam) =>
  alsoList(c, petId, cur, fam)
    .map(([s, r]) => `${c.abilityById[s].name} ${r}`)
    .join(', ');

/** The text a pet row shows, used by the All ranks filter. */
export function petRowText(c, petId, cur, fam, wording = 'also') {
  const p = c.petById[petId];
  const also = alsoText(c, petId, cur, fam);
  return `${p.name} ${c.familyById[p.family].singular} ${p.level} · ${p.zone}${also ? ` · ${wording} ${also}` : ''}`;
}
