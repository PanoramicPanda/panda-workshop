import { catalog as c } from '../catalog.js';
import { tpTotals, zonesByRegion } from '../lib/plans.js';

const zones = zonesByRegion(c);

export default function QuirksPanel({ fam }) {
  const { rows, total } = tpTotals(c, fam);
  return (
    <>
      <h2>Training points: {c.familyById[fam].name} at max obtainable rank</h2>
      <div className="card">
        <ul>
          {rows.map((r) => (
            <li key={r.ability}>
              {r.name} {r.rank}: {r.tp} TP
            </li>
          ))}
        </ul>
        <p>
          <b>Active skills total: {total} TP</b>
        </p>
        <p className="small">
          Upgrading a rank refunds the lower rank, so only the final ranks count. I did not check how many TP a pet has at
          each level. Passive skills (see All Ranks) cost extra TP.
        </p>
      </div>

      <h2>Data quirks</h2>
      <div className="note">
        <ul>
          <li>
            Cat Cower 4 lists <b>Savannah Patriarch</b> at level 14–16 (The Barrens) even though the rank needs pet level 35.
            Looks like a Petopia error.
          </li>
          <li>
            Spider Dash 3 lists <b>Broodwidow</b> at level 16 (Ruins of Lordaeron). Don't rely on it.
          </li>
          <li>
            Some ranks are marked "no known training source" by Petopia: Dismember 5, Lightning Breath 1, Mine! 2, 4 and 5,
            Savage Rend 4, Sonic Blast 5, Tendon Rip 4 and 5, Thunderstomp 4, and Web 5. Plans skip those ranks.
          </li>
          <li>
            Some bats and owls teach Demoralizing Screech, a Carrion Bird skill. Tame one to learn it, then teach it to a
            Carrion Bird.
          </li>
          <li>Core Hounds are left out: Petopia no longer has a page for them and found no tameable ones.</li>
          <li>
            Petopia lists the zone for each pet, not the continent. The Eastern Kingdoms / Kalimdor sorting is mine, by zone
            (below). Check it if a zone surprises you.
          </li>
        </ul>
      </div>

      <h2>How zones are sorted</h2>
      <div className="card">
        <ul>
          <li>
            <b style={{ color: 'var(--sE)' }}>Eastern Kingdoms:</b> {zones.E.join(', ')}
          </li>
          <li>
            <b style={{ color: 'var(--sK)' }}>Kalimdor:</b> {zones.K.join(', ')}
          </li>
          <li>
            <b style={{ color: 'var(--sZ)' }}>Zephras Isle:</b> {zones.Z.join(', ')} (toggle at the top)
          </li>
        </ul>
      </div>
    </>
  );
}
