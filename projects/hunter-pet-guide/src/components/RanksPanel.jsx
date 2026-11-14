import { catalog as c } from '../catalog.js';
import { actives, lowLevel, passives, petRowText } from '../lib/catalog.js';
import { REGION_NAMES, otherRegion, tameable } from '../lib/region.js';
import { PetList } from './PetLink.jsx';

function RankCard({ ability, info, settings, q }) {
  const { fam, fac, zep } = settings;
  const cur = [ability.id, info.rank];
  const known = info.pets.map((id) => c.petById[id]);
  const pets = known.filter((p) => tameable(p, settings));
  const tooHigh = known.length - pets.length;
  const nextLevel = tooHigh ? Math.min(...known.filter((p) => !tameable(p, settings)).map(lowLevel)) : null;
  const groups = {
    zep: pets.filter((p) => p.region === 'Z' && zep).map((p) => p.id),
    main: pets.filter((p) => p.region === fac).map((p) => p.id),
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
          <div className="grp">{REGION_NAMES[fac]}</div>
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
  return (
    <>
      <h2>All ranks — {c.familyById[fam].name}</h2>
      <div className="row">
        <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Filter by pet, family or zone…" />
      </div>
      {actives(c, fam).map((a) => (
        <div key={a.id}>
          <h2>{a.name}</h2>
          <p className="small">{a.description}</p>
          {a.ranks.map((info) => (
            <RankCard key={info.rank} ability={a} info={info} settings={settings} q={q} />
          ))}
        </div>
      ))}
      <h2>Pet trainer passives</h2>
      <div className="card">
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
              {passives(c, fam).flatMap((a) =>
                a.ranks.map((r) => (
                  <tr key={`${a.id}-${r.rank}`}>
                    <td>{a.name}</td>
                    <td>{r.rank}</td>
                    <td>{r.petLevel}</td>
                    <td>{r.tp}</td>
                    <td>{r.effect}</td>
                  </tr>
                )),
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
