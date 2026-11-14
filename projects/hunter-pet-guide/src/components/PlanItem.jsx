import { catalog as c } from '../catalog.js';
import { REGION_NAMES, otherRegion } from '../lib/region.js';
import { PetList } from './PetLink.jsx';

const SHOWN = 5;

/** One rank in a plan stop: a tick box, its cost, the best pets here, and the rest behind dividers. */
export default function PlanItem({ item, settings, checked, onCheck }) {
  const { fam, fac } = settings;
  const { info, own, alt } = item;
  const cur = [item.ability, item.rank];
  const mine = REGION_NAMES[fac];
  const other = REGION_NAMES[otherRegion(fac)];
  const trainer = info.source === 'trainer';
  const shown = own.slice(0, SHOWN);
  const more = own.slice(SHOWN);

  return (
    <li>
      <label className="ck">
        <input type="checkbox" checked={checked} onChange={(e) => onCheck(e.target.checked)} />
        <span>
          <span className="pill">
            {c.abilityById[item.ability].name} {item.rank}
          </span>
          <small>
            pet lvl {info.petLevel} · {info.tp || 0} TP{info.effect ? ` · ${info.effect}` : ''}
          </small>
          <span className="pets">
            {trainer ? (
              <span className="p">
                <small>Learned from the pet trainer (no taming).</small>
              </span>
            ) : shown.length ? (
              <PetList ids={shown} cur={cur} fam={fam} />
            ) : item.nextLevel && !alt.length ? (
              <span className="p">
                <small>Tameable from level {item.nextLevel}.</small>
              </span>
            ) : (
              <span className="p">
                <small>
                  No source in {mine}
                  {alt.length ? `. Open the ${other} list below.` : '.'}
                </small>
              </span>
            )}
          </span>
        </span>
      </label>
      {!trainer && more.length > 0 && (
        <details className="alt">
          <summary>
            More in {mine} ({more.length})
          </summary>
          <PetList ids={more} cur={cur} fam={fam} />
        </details>
      )}
      {alt.length > 0 && (
        <details className="alt" open={info.source === 'pet' && !own.length}>
          <summary>
            {other} ({alt.length})
          </summary>
          <PetList ids={alt} cur={cur} fam={fam} />
        </details>
      )}
    </li>
  );
}
