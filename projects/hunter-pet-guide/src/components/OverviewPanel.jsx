import { Fragment } from 'react';
import { catalog as c } from '../catalog.js';
import { actives, passives } from '../lib/catalog.js';
import { multiSkillPets } from '../lib/plans.js';
import { REGION_NAMES, otherRegion } from '../lib/region.js';
import PetLink from './PetLink.jsx';

export default function OverviewPanel({ settings }) {
  const { fam, fac, zep } = settings;
  const family = c.familyById[fam];
  const mine = REGION_NAMES[fac];
  const other = REGION_NAMES[otherRegion(fac)];
  const best = multiSkillPets(c, settings).slice(0, 12);

  return (
    <>
      <h2>{family.name}</h2>
      <div className="card">
        <p>
          <b>Diet:</b> {family.diet || 'unknown'}
        </p>
        <p>
          <b>Trainable abilities:</b>{' '}
          {actives(c, fam).map((a, i) => {
            const top = a.ranks.at(-1).rank;
            return (
              <Fragment key={a.id}>
                {i > 0 && ', '}
                {a.name}{' '}
                <small>
                  ({top} rank{top > 1 ? 's' : ''})
                </small>
              </Fragment>
            );
          })}
          {family.extra.length > 0 && (
            <>
              , {family.extra.join(', ')} <small>(listed on Petopia's family page, no rank data)</small>
            </>
          )}
        </p>
        <p>
          <b>Passive (trainer) skills:</b> {passives(c, fam).map((a) => a.name).join(', ')}
        </p>
        {family.notes && (
          <p className="small">
            <b>Petopia notes:</b> {family.notes}
          </p>
        )}
      </div>

      <div className="tip">
        <b>
          Multi-skill pets for {family.name} in {mine}
          {zep ? ' and Zephras Isle' : ''}
        </b>{' '}
        <small>(one tame teaches several of this family's skills)</small>
        {best.length ? (
          <ul className="plain">
            {best.map((b) => (
              <li key={b.id}>
                <PetLink id={b.id} fam={fam} wording="teaches" />
              </li>
            ))}
          </ul>
        ) : (
          <p className="small">
            {settings.maxLvl && multiSkillPets(c, { ...settings, maxLvl: 0 }).length
              ? `None at level ${settings.maxLvl} or below yet.`
              : 'None on this continent.'}
          </p>
        )}
      </div>

      <h2>How it works</h2>
      <div className="card">
        <ul>
          <li>
            You can tame a pet only if it is <b>at or below your level</b>.
          </li>
          <li>
            Your permanent pet must be <b>at or above the "pet lvl"</b> of a rank before you can teach it (the pet's level,
            not yours).
          </li>
          <li>
            <b>Skipping ranks is fine</b>, and upgrading refunds the TP of the lower rank, so jumping straight to a higher
            rank costs the same total as going rank by rank.
          </li>
          <li>
            <b>Growl</b>, <b>resistances</b>, <b>Great Stamina</b> and <b>Natural Armor</b> are bought from the pet trainer,
            not tamed.
          </li>
          <li>Level ranges like "40–41" mean the one you find might be a level above you. Tame a neighbour or gain a level.</li>
          <li>Every pet name links to its Wowhead Forever page, where you can see its spawn locations.</li>
          <li>
            The plans are generated from Petopia's data for whichever family you pick. They are a starting point, not
            hand-tuned.
          </li>
        </ul>
      </div>
      <div className="note">
        Viewing <b>{mine}</b> with Zephras Isle pets {zep ? 'included' : 'hidden'}. Pets in <b>{other}</b> are not left
        out: each step has a "{other}" divider you can open. If a rank has no source on your continent, the step says so
        and opens the divider for you.
      </div>
      <p className="small">
        Tick boxes are saved in this browser, per family and continent; ticked skills hide until you tick "Show checked".
        Enter your hunter level at the top to hide pets you can't tame yet. Data source: wow-petopia.com/forever.
      </p>
    </>
  );
}
