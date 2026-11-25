---
name: update-pet-data
description: Refresh the Hunter Pet Training Guide (projects/hunter-pet-guide) from Petopia Forever (wow-petopia.com/forever). Use when asked to update, sync, refresh or re-check the hunter pet guide's pets, abilities, ranks, families or attack speeds against Petopia, or when Petopia has published new or corrected data.
---

# Update the hunter pet guide from Petopia Forever

The guide's data lives in three JSON files under `projects/hunter-pet-guide/src/data/`. The app builds everything else from them: plans, unique skills, TP totals, speed groups and the zone list. An update means bringing those files in line with Petopia, validating, and shipping a changelog entry. Components should only change when Petopia changes something the UI explains in words (see step 5).

## Source pages

Three pages, plus one page per family, hold everything. They're static HTML. The quickest route that worked:

1. Download them with `curl -sf -A "Mozilla/5.0"` into a fresh folder in the scratchpad: `index.html`, `abilities.html`, `attackspeed.html` and `fam-<id>.html` for each family in `families.json`.
2. Parse them with a Node script kept in a separate scratchpad folder, using regexes, and write one JSON file.
3. Diff that JSON against `src/data` with a second script. Then apply it with a third, which rewrites the files in the existing style (see below).

The raw HTML quotes attributes with **single quotes** (`<h3 class='guide_heading …' id='bite'>`), so write regexes that accept `['"]`. The browser's DOM shows double quotes, which is misleading. A family page that redirects to the index (curl gets a ~200-byte 302 body) means Petopia dropped that family. Ask the user before removing it.

- **Index**, `https://www.wow-petopia.com/forever/`: links to every family as `family.php?id=<id>`. The ids match our family ids (`birdofprey`, `windserpent`…). A family page (`https://www.wow-petopia.com/forever/family.php?id=cat`) gives its trainable skills (Active and Passive), `Diet` (`Fish - Meat`), any family note, and looks. It doesn't list pets. Core Hounds aren't linked from the index, but `family.php?id=corehound` still exists and Lava Breath's family list links to it.
- **Abilities**, `https://www.wow-petopia.com/forever/abilities.php`: every ability and rank on one page.
  - Each ability starts with `<h3 id="<abilityid>">` (`bite`, `lavabreath`, `mine!`). It's followed by `p.abilitymaindesc` (our `description`), then `span.ability_family_list` with `family.php?id=` links (our `families`), then `ul.abilityranklist`.
  - The page index splits abilities into "Learned from wild creatures" and "Learned from the trainer". Trainer skills are the all-family ones (resistances, Great Stamina, Growl, Natural Armor).
  - Each rank is `li.abilityrank#<abilityid><rank>`, with text like `Bite 4: Pet Level 24, Cost 10 TP.` followed by `span.abilityrankdesc` (our `effect`). Its `span.abilitysourceheading` maps to `source`: "Can be learned by taming:" → `pet`, "Can be learned from trainers." → `trainer`, "No known training source." → `none`.
  - For taming ranks, `li.abilityranknpc` holds `<a class="npclink" href="https://www.wowhead.com/forever/npc=<id>">Name</a> (Family, level, zone)`. That gives the pet id, name, family (singular), level and zone.
  - Ability id quirk: Petopia's `mine!` is our `mine` if it ever gets rank data. Today it's only in Birds of Prey's `extra`.
- **Attack speeds**, `https://www.wow-petopia.com/forever/attackspeed.php`: one `h4#attackspeed_<speed>` heading per speed (`attackspeed_1.0` … `attackspeed_2.7`), each followed by `ul.guidenpclist` items in the same `npclink` + `(Family, level, zone)` format. This is the fullest pet list. Pets that teach nothing appear only here.

Pets in `pets.json` are every pet across both pages, keyed by the Wowhead NPC id in the link. If a pet's level or zone differs between the two pages, flag it rather than picking one silently. Never invent an id.

If the site errors (it has returned 502s before), stop and tell the user. Don't fill gaps from memory or other fan sites.

## Data shape (enforced by `scripts/validate-data.mjs`)

- **families.json**: `{ id, name, singular, diet, notes, extra }`. `id` is lowercase letters only (`birdofprey`). `diet` is Petopia's list joined with ` - `. `notes` is Petopia's family note, verbatim, or `""`. `extra` holds skills Petopia lists on the family page that have no rank data (e.g. `"Mine!"`).
- **abilities.json**: `{ id, name, description, passive, allFamilies, families, ranks }`. Each rank is `{ rank, source, petLevel, tp, effect, pets }`, listed in increasing order:
  - `source` is `"pet"` (learned by taming; `pets` lists the NPC ids that teach it), `"trainer"` (pet trainer; `pets: []`) or `"none"` (Petopia says "no known training source"; `pets: []`).
  - Set `allFamilies: true` with `families: []` for skills every family learns (Growl, Cower, resistances…).
- **pets.json**: one line per pet, `{"id","name","family","level","zone","region","speed"}`. `level` is a string like `"12"` or `"12-14"`. `speed` is a string like `"2.0"`. Keep the file sorted by id, one compact object per line, matching the existing style.
  - `region` is our own call, since Petopia only gives the zone: `E` Eastern Kingdoms, `K` Kalimdor, `Z` Zephras Isle. Reuse the region that zone already has in pets.json. For a zone the guide hasn't seen before, pick by geography and tell the user so they can check it.

## Steps

1. **Snapshot first.** Read the three JSON files so you can diff against them. Count pets per family and ranks per ability.
2. **Collect from Petopia.** Parse abilities.php, attackspeed.php and each family page as described above. Write the parsed result to a JSON file in the scratchpad, not the repo, so the diff and the edits work from the same data.
3. **Diff before editing.** Write a short list for the user covering new pets, removed pets, changed levels, zones or speeds, rank changes (TP, level, effect, source, teaching pets), new abilities or families, and changed diets or notes. If the diff is large or surprising (a family vanishes, dozens of ids change), show it and ask before applying.
4. **Apply** the changes to the JSON. Keep existing key order and formatting so the git diff stays readable. These three formatters reproduce today's files byte for byte. Re-check that before relying on them:
   - `families.json`: `JSON.stringify(f, null, 2) + '\n'`.
   - `abilities.json`: the same, then collapse every array of numbers or strings onto one line with `, ` between items, and write empty arrays as `[]`.
   - `pets.json`: `'[\n' + pets.map(p => '  ' + JSON.stringify(p)).join(',\n') + '\n]\n'`, sorted by id.

   Keep our ability and family names, `passive` and `allFamilies`. Take ranks, effects, descriptions and teaching-pet order from Petopia. Sort abilities by id and each ability's families alphabetically. Regions: keep a pet's existing region unless its zone changed. Ask the user about any zone the guide hasn't seen before, since Forever adds zones (Riverglades, for one) that aren't where you'd guess.
5. **Check the hand-written text** that quotes Petopia, and update or remove lines that are no longer true:
   - `src/components/QuirksPanel.jsx`: the "Data quirks" list (Savannah Patriarch on Cower 4, Broodwidow on Dash 3, the "no known training source" ability list, Core Hounds with no tameable pets).
   - `src/components/FamilyPanel.jsx` and `RanksPanel.jsx`: Petopia notes and source wording.
   - `scripts/validate-data.mjs`: `KNOWN_FAMILY_MISMATCHES`, the pets Petopia lists for a skill their family can't learn. Drop entries Petopia fixed. Add a new one only after telling the user it looks like a Petopia error, never just to quiet the validator.
   - `tests/data.test.mjs` and `tests/plans.test.mjs`: tests that pin real data (unique abilities, the Cats EK plan legs, multi-skill pets). New pets often change the best pick or the alternatives count in a plan leg. Update a pin only after checking the new value comes from a real Petopia change, and say which.
   - A saved family that no longer exists falls back to Cats (`parseFam` in `src/App.jsx`), so removing a family is safe for returning visitors.
6. **Validate**, from `projects/hunter-pet-guide/`:
   ```
   npm run validate
   npm test
   npm run build
   ```
   Fix data problems at the source. Don't loosen the validator.
7. **Look at it.** Start the guide's dev server and spot-check a family whose data changed: Family Overview, All Ranks, Training Plan and Attack Speed.
8. **Changelog and version.** Add an entry at the top of `projects/hunter-pet-guide/CHANGELOG.md` (`## x.y.z — YYYY-MM-DD`) and match `version` in `package.json`. Data refreshes are a patch bump. If there's already an unpushed version (check `git log origin/main..main`), add to that entry instead of bumping again. Write for players: name the pets, families and ranks that changed, e.g. "Bite 4 can now be learned from …", not "updated abilities.json".
9. **Commit in focused pieces.** Put the data refresh, any text or quirk updates, and the version bump with its changelog in separate commits. Don't push unless asked.

## Report back

Finish with the diff summary from step 3, any zones you assigned a region to, any suspected Petopia errors, and whether validate, tests and build passed.
