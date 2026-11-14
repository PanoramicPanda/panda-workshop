// Expected values were checked against the original single-file page's output.
import test from 'node:test';
import assert from 'node:assert/strict';
import { actives, alsoList, petRowText } from '../src/lib/catalog.js';
import { buildPlan, multiSkillPets, speedGroups, tpTotals, zonesOf } from '../src/lib/plans.js';
import { catalog as c, summarize } from './helpers.mjs';

const CAT_EK = { fam: 'cat', fac: 'E', zep: true };
const SPIDER_KAL = { fam: 'spider', fac: 'K', zep: false };

test('family skills: tamed ones sorted by name, passives kept apart', () => {
  assert.deepEqual(actives(c, 'cat').map((a) => a.id), ['bite', 'claw', 'cower', 'dash', 'growl', 'prowl']);
  assert.ok(!actives(c, 'cat').some((a) => a.passive));
});

const LEGS = ['Levels 10–19', 'Levels 20–29', 'Levels 30–39', 'Levels 40–49', 'Levels 50–60'];

test('the plan for Cats in Eastern Kingdoms has one leg per 10 levels', () => {
  const stops = summarize(buildPlan(c, CAT_EK));
  assert.deepEqual(stops.map((s) => s[0]), LEGS);
  assert.deepEqual(stops[0][1], ['cower1:1199:9', 'growl2:-:0', 'bite3:1923:7', 'claw3:1189:6']);
  assert.deepEqual(stops[2][1], ['growl4:-:0', 'bite5:2727:7', 'dash1:2727:4', 'prowl1:2731:0', 'cower4:2731:1', 'claw5:7022:3']);
  assert.deepEqual(stops[4][1], ['dash3:2681:3', 'prowl3:2522:1', 'bite8:9696:0', 'cower6:8602:1', 'claw8:-:2', 'growl7:-:0']);
});

test('each leg holds ranks first learnable in it, highest rank per skill only', () => {
  const stops = buildPlan(c, SPIDER_KAL);
  assert.deepEqual(stops.map((s) => s.title), LEGS);
  stops.forEach((stop, i) => {
    const lo = (i + 1) * 10;
    const skills = stop.items.map((x) => x.ability);
    assert.equal(new Set(skills).size, skills.length);
    // The last leg also takes anything at 60 or above.
    for (const x of stop.items) assert.ok(x.level >= lo && (i === 4 || x.level < lo + 10));
    for (const id of stop.items.flatMap((x) => x.own)) assert.notEqual(c.petById[id].region, 'Z');
  });
});

test('the plan falls back to the other continent when a rank has no source here', () => {
  const claw4 = buildPlan(c, CAT_EK).flatMap((s) => s.items).find((i) => i.ability === 'claw' && i.rank === 4);
  assert.deepEqual(claw4.own, []);
  assert.equal(claw4.alt.length, 4);
  assert.ok(claw4.alt.every((id) => c.petById[id].region === 'K'));
});

test('stop headings list up to four zones without dungeon/raid tags', () => {
  const [first] = buildPlan(c, CAT_EK);
  const zones = zonesOf(c, first.items).split(' · ');
  assert.ok(zones.length > 0 && zones.length <= 4);
  assert.ok(zones.every((z) => !/\((Dungeon|Raid)\)/.test(z)));
});

test('multi-skill pets rank by number of skills, then level', () => {
  assert.deepEqual(multiSkillPets(c, CAT_EK).slice(0, 4), [
    { id: 2727, count: 2 },
    { id: 2731, count: 2 },
    { id: 2734, count: 2 },
    { id: 1713, count: 2 },
  ]);
  assert.deepEqual(multiSkillPets(c, SPIDER_KAL), [{ id: 5286, count: 2 }]);
});

test('"also" notes skip the current rank and skills the family cannot learn', () => {
  assert.deepEqual(alsoList(c, 2727, ['bite', 5], 'cat'), [['dash', 1]]);
  assert.match(petRowText(c, 2727, ['bite', 5], 'cat'), / · also Dash 1$/);
  assert.ok(alsoList(c, 2727, null, 'bat').every(([s]) => s !== 'dash'));
});

test('attack speed groups are fastest first, level-filtered and ordered by level then name', () => {
  const groups = speedGroups(c, { ...CAT_EK, maxLvl: 30 });
  assert.deepEqual(groups.map((g) => g.speed), [...groups.map((g) => g.speed)].sort((a, b) => a - b));
  for (const g of groups) {
    const pets = g.ids.map((id) => c.petById[id]);
    assert.ok(pets.every((p) => p.family === 'cat' && parseInt(p.level, 10) <= 30));
    for (let i = 1; i < pets.length; i++) {
      const [a, b] = [pets[i - 1], pets[i]];
      const la = parseInt(a.level, 10);
      const lb = parseInt(b.level, 10);
      assert.ok(la < lb || (la === lb && a.name.localeCompare(b.name) <= 0), `${a.name} before ${b.name}`);
    }
  }
});

test('training point totals use the highest obtainable rank', () => {
  assert.equal(tpTotals(c, 'cat').total, 118);
  assert.equal(tpTotals(c, 'spider').total, 68);
});

test('a hunter level hides higher pets from plans without changing the trips', () => {
  const capped = { ...CAT_EK, maxLvl: 20 };
  const full = buildPlan(c, CAT_EK);
  const limited = buildPlan(c, capped);
  assert.deepEqual(limited.map((s) => s.title), full.map((s) => s.title));
  for (const x of limited.flatMap((s) => s.items)) {
    assert.ok([...x.own, ...x.alt].every((id) => parseInt(c.petById[id].level, 10) <= 20));
    if (x.hidden) assert.ok(x.nextLevel > 20);
  }
  const bite8 = limited.flatMap((s) => s.items).find((i) => i.ability === 'bite' && i.rank === 8);
  assert.deepEqual(bite8.own, []);
  assert.ok(bite8.nextLevel > 20);
  // No level set: nothing hidden.
  assert.ok(full.flatMap((s) => s.items).every((x) => x.hidden === 0 && x.nextLevel === null));
  for (const stop of buildPlan(c, { ...SPIDER_KAL, maxLvl: 25 })) {
    for (const x of stop.items) assert.ok([...x.own, ...x.alt].every((id) => parseInt(c.petById[id].level, 10) <= 25));
  }
});

test('multi-skill pets respect the hunter level', () => {
  const all = multiSkillPets(c, CAT_EK);
  const capped = multiSkillPets(c, { ...CAT_EK, maxLvl: 20 });
  assert.ok(capped.length < all.length);
  assert.ok(capped.every((b) => parseInt(c.petById[b.id].level, 10) <= 20));
});
