import test from 'node:test';
import assert from 'node:assert/strict';
import { validate } from '../scripts/validate-data.mjs';
import { rawData } from './helpers.mjs';

test('shipped data passes validation', () => {
  assert.deepEqual(validate(rawData()), []);
});

test('validation catches a missing pet, an unknown family, a bad region and a bad level', () => {
  const data = rawData();
  data.abilities.find((a) => a.id === 'bite').ranks[1].pets.push(999999);
  data.pets.find((p) => p.id === 30).family = 'dragon';
  data.pets.find((p) => p.id === 43).region = 'X';
  data.pets.find((p) => p.id === 69).level = 'about 7';
  const problems = validate(data).join('\n');
  assert.match(problems, /"bite" rank 2: pet 999999 is not in pets\.json/);
  assert.match(problems, /30 "Forest Spider": family "dragon" is not in families\.json/);
  assert.match(problems, /43 "Mine Spider": region "X"/);
  assert.match(problems, /level "about 7"/);
});

test('validation catches a pet listed for a skill its family cannot learn', () => {
  const data = rawData();
  const prowlPet = data.abilities.find((a) => a.id === 'prowl').ranks[0].pets[0];
  data.pets.find((p) => p.id === prowlPet).family = 'bat';
  assert.match(validate(data).join('\n'), /"prowl" rank 1: pet \d+ .* is a bat, which can't learn Prowl/);
});
