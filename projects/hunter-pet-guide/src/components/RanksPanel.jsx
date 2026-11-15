import { catalog as c } from '../catalog.js';
import { lowLevel, petRowText, tamedSkills, trainerSkills } from '../lib/catalog.js';
import { REGION_NAMES, otherRegion, placeName, tameable } from '../lib/region.js';
import { readTick, useStored } from '../lib/storage.js';
import { PetList } from './PetLink.jsx';

const parseShowDone = (v) => v === '1';
const saveShowDone = (v) => (v ? '1' : '0');
// Ticks are saved under the training plan's key (see PlanPanel).
const ticked = (a, rank) => readTick('planA', a.id, rank);

function RankCard({ ability, info, settings, q }) {
  const { fam, fac, zep } = settings;
  const cur = [ability.id, info.rank];
  const known = info.pets.map((id) => c.petById[id]);
  const pets = known.filter((p) => tameable(p, settings));
  const tooHigh = known.length - pets.length;
  const nextLevel = tooHigh ? Math.min(...known.filter((p) => !tameable(p, settings)).map(lowLevel)) : null;
  const groups = {
    zep: pets.filter((p) => p.region === 'Z' && zep).map((p) => p.id),
    main: pets.filter((p) => p.region !== 'Z' && (fac === 'G' || p.region === fac)).map((p) => p.id),
    other: pets.filter((p) => p.region === otherRegion(fac)).map((p) => p.id),
  };
  const all = [...groups.zep, ...groups.main, ...groups.other];
  const match = (id) => !q || petRowText(c, id, cur, fam).toLowerCase().includes(q);
  // Cards with pets disappear when none match; trainer and unknown ranks always stay.
  if (q && all.length && !all.some(match)) return null;
  const shown = Object.fromEntries(Object.entries(groups).map(([k, ids]) => [k, ids.filter(match)]));

  return (
    <div className="card rk-card">
      <h4>
        {ability.name} {info.rank}{' '}
        <small>
          pet lvl {info.petLevel} · {info.tp} TP{info.effect ? ` · ${info.effect}` : ''}
        </small>
      </h4>
      {info.source === 'trainer' && <p className="small">Learned from the pet trainer.</p>}
      {info.source === 'none' && <p className="small">No known training source (Petopia).</p>}
      {info.source === 'pet' && !pets.length && tooHigh > 0 && (
        <p className="small">No pets at your level yet (from level {nextLevel}).</p>
      )}
      {groups.zep.length > 0 && (
        <>
          <div className="grp">Zephras Isle</div>
          <PetList ids={shown.zep} cur={cur} fam={fam} />
        </>
      )}
      {groups.main.length > 0 && (
        <>
          <div className="grp">{placeName(fac)}</div>
          <PetList ids={shown.main} cur={cur} fam={fam} />
        </>
      )}
      {groups.other.length > 0 && (
        <details className="divd" open>
          <summary>
            {REGION_NAMES[otherRegion(fac)]} ({groups.other.length})
          </summary>
          <PetList ids={shown.other} cur={cur} fam={fam} />
        </details>
      )}
    </div>
  );
}

export default function RanksPanel({ settings, query, setQuery }) {
  const { fam } = settings;
  const q = query.toLowerCase();
  // Shares "Show checked" with the training plan: ticked ranks hide here too.
  const [showDone, setShowDone] = useStored('hpg-showdone', parseShowDone, saveShowDone);
  const tamed = tamedSkills(c, fam);
  const trainer = trainerSkills(c, fam);
  const doneCount = [...tamed, ...trainer].flatMap((a) => a.ranks.filter((r) => ticked(a, r.rank))).length;
  const shownRanks = (a) => a.ranks.filter((r) => showDone || !ticked(a, r.rank));
  const trainerRows = trainer.flatMap((a) => shownRanks(a).map((r) => ({ a, r })));

  return (
    <>
      <h2>All Ranks — {c.familyById[fam].name}</h2>
      <div className="row">
        <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Filter by pet, family or zone…" />
        <label className="small">
          <input type="checkbox" checked={showDone} onChange={(e) => setShowDone(e.target.checked)} /> Show checked (
          {doneCount})
        </label>
      </div>
      <p className="small">Ranks ticked on the Training Plan are hidden until you tick "Show checked".</p>
      <h2>Learned by taming</h2>
      {tamed.map((a) => {
        const ranks = shownRanks(a);
        if (!ranks.length) return null;
        return (
          <div key={a.id} className="rk-skill">
            <h3>{a.name}</h3>
            <p className="small">{a.description}</p>
            {ranks.map((info) => (
              <RankCard key={info.rank} ability={a} info={info} settings={settings} q={q} />
            ))}
          </div>
        );
      })}
      <h2>Learned from the pet trainer</h2>
      <div className="card">
        {trainerRows.length ? (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Skill</th>
                  <th>Rank</th>
                  <th>Pet lvl</th>
                  <th>TP</th>
                  <th>Effect</th>
                </tr>
              </thead>
              <tbody>
                {trainerRows.map(({ a, r }) => (
                  <tr key={`${a.id}-${r.rank}`}>
                    <td>{a.name}</td>
                    <td>{r.rank}</td>
                    <td>{r.petLevel}</td>
                    <td>{r.tp}</td>
                    <td>{r.effect}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="small">All ticked.</p>
        )}
      </div>
    </>
  );
}
