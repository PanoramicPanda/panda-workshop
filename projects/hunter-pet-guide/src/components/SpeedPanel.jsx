import { catalog as c } from '../catalog.js';
import { speedGroups } from '../lib/plans.js';
import { REGION_NAMES, otherRegion } from '../lib/region.js';
import { PetList } from './PetLink.jsx';

export default function SpeedPanel({ settings, lvl, setLvl }) {
  const { fam, fac, zep } = settings;
  const family = c.familyById[fam];
  const groups = speedGroups(c, settings, lvl);
  const other = REGION_NAMES[otherRegion(fac)];

  return (
    <>
      <h2>{family.name} by attack speed</h2>
      <div className="note">
        Attack speed does not change a pet's DPS: faster pets hit more often for proportionally less. It mostly matters in
        PvP and for interrupts. A pet keeps the speed of the creature you tame.
      </div>
      <div className="row">
        <label>
          Only pets up to level{' '}
          <input
            type="number"
            min="0"
            max="63"
            value={lvl || ''}
            placeholder="any"
            onChange={(e) => setLvl(parseInt(e.target.value, 10) || 0)}
          />
        </label>
        <span className="small">tames your current level can take</span>
      </div>
      {groups.map((g) => (
        <div className="card rk-card" key={g.speed}>
          {/* The default 2.0 group is the big one, so it starts closed. */}
          <details open={!g.isBase}>
            <summary>
              <b>
                <span className="spd">{g.speed}</span>
              </b>{' '}
              <small>
                {g.ids.length} pet{g.ids.length > 1 ? 's' : ''}
                {g.isBase ? ' (the default speed)' : ''}
              </small>
            </summary>
            {g.own.length > 0 && (
              <>
                <div className="grp">
                  {REGION_NAMES[fac]}
                  {zep ? ' and Zephras Isle' : ''}
                </div>
                <PetList ids={g.own} fam={fam} />
              </>
            )}
            {g.other.length > 0 && (
              <details className="divd">
                <summary>
                  {other} ({g.other.length})
                </summary>
                <PetList ids={g.other} fam={fam} />
              </details>
            )}
            {!g.own.length && !g.other.length && <p className="small">None.</p>}
          </details>
        </div>
      ))}
      {!groups.length && <div className="note">No {family.name} found with these settings.</div>}
      <p className="small">
        Pets that also teach one of this family's skills show it in orange. Source: wow-petopia.com/forever/attackspeed.php.
      </p>
    </>
  );
}
