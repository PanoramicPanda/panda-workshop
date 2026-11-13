// Expected values were checked against the original single-file page's output.
import test from 'node:test';
import assert from 'node:assert/strict';
import { actives, alsoList, petRowText } from '../src/lib/catalog.js';
import { buildPlanA, buildPlanB, multiSkillPets, speedGroups, tpTotals, zonesOf } from '../src/lib/plans.js';
import { catalog as c, summarize } from './helpers.mjs';

const CAT_EK = { fam: 'cat', fac: 'E', zep: true };
const SPIDER_KAL = { fam: 'spider', fac: 'K', zep: false };

test('family skills: tamed ones sorted by name, passives kept apart', () => {
  assert.deepEqual(actives(c, 'cat').map((a) => a.id), ['bite', 'claw', 'cower', 'dash', 'growl', 'prowl']);
  assert.ok(!actives(c, 'cat').some((a) => a.passive));
});

test('Plan A for Cats in Eastern Kingdoms', () => {
  const stops = summarize(buildPlanA(c, CAT_EK));
  assert.equal(stops.length, 7);
  assert.deepEqual(stops[0], ['Trip 1 · Level 10', ['bite2:254589:5', 'claw2:254588:6', 'cower1:1199:9', 'growl2:-:0']]);
  assert.deepEqual(stops[3], ['Trip 4 · Level 32–39', ['bite5:2727:7', 'dash1:2727:4', 'prowl1:2731:0', 'cower4:2731:1', 'claw5:7022:3']]);
  assert.deepEqual(stops[6], ['Trip 7 · Level 56–60', ['bite8:9696:0', 'cower6:8602:1', 'claw8:-:2', 'growl7:-:0']]);
});

test('Plan A falls back to the other continent when a rank has no source here', () => {
  const claw4 = buildPlanA(c, CAT_EK).flatMap((s) => s.items).find((i) => i.ability === 'claw' && i.rank === 4);
  assert.deepEqual(claw4.own, []);
  assert.equal(claw4.alt.length, 4);
  assert.ok(claw4.alt.every((id) => c.petById[id].region === 'K'));
});

test('Plan B for Spiders in Kalimdor without Zephras Isle', () => {
  const stops = summarize(buildPlanB(c, SPIDER_KAL));
  assert.deepEqual(stops.map((s) => s[0]), [10, 20, 30, 40, 50, 60].map((v, i) => `Visit ${i + 1} · Level ${v}`));
  assert.deepEqual(stops[1][1], ['bite3:3653:10', 'cower2:2237:1', 'growl3:-:0', 'web1:3819:10']);
  assert.deepEqual(stops[4][1], ['bite7:-:8', 'cower5:-:3', 'dash3:-:8', 'growl6:-:0']);
});

test('Plan B only offers pets tameable by each visit and hides Zephras Isle when off', () => {
  for (const stop of buildPlanB(c, SPIDER_KAL)) {
    const level = Number(stop.title.split('Level ')[1]);
    for (const item of stop.items) {
      assert.ok(item.info.petLevel <= level);
      for (const id of item.own) {
        assert.ok(parseInt(c.petById[id].level, 10) <= level);
        assert.equal(c.petById[id].region, 'K');
      }
    }
  }
});

test('stop headings list up to four zones without dungeon/raid tags', () => {
  const [first] = buildPlanA(c, CAT_EK);
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
  const groups = speedGroups(c, CAT_EK, 30);
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
