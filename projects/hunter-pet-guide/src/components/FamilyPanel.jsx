import { Fragment } from 'react';
import { catalog as c } from '../catalog.js';
import { tamedSkills, trainerSkills, uniqueAbilities } from '../lib/catalog.js';
import { multiSkillPets } from '../lib/plans.js';
import { REGION_NAMES, otherRegion, placeName } from '../lib/region.js';
import PetLink from './PetLink.jsx';
import { Unique } from './FamiliesDialog.jsx';

/** The chosen family: diet, skills, what's unique to it and its best multi-skill pets. */
/** "Bite (8 ranks), Claw (8 ranks)". */
const SkillList = ({ skills }) =>
  skills.map((a, i) => {
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
  });

export default function FamilyPanel({ settings }) {
  const { fam, fac, zep } = settings;
  const family = c.familyById[fam];
  const mine = placeName(fac);
  const other = REGION_NAMES[otherRegion(fac)];
  const best = multiSkillPets(c, settings).slice(0, 12);
  const unique = uniqueAbilities(c)[fam];

  return (
    <>
      <h2>{family.name}</h2>
      <div className="card">
        <p>
          <b>Diet:</b> {family.diet || 'unknown'}
        </p>
        <p>
          <b>Learned by taming:</b> <SkillList skills={tamedSkills(c, fam)} />
          {family.extra.length > 0 && (
            <>
              , {family.extra.join(', ')} <small>(listed on Petopia's family page, no rank data)</small>
            </>
          )}
        </p>
        <p>
          <b>Learned from the pet trainer:</b> <SkillList skills={trainerSkills(c, fam)} />
        </p>
        <p>
          <b>Unique to {family.name}:</b>{' '}
          {unique.length ? (
            unique.map((u, i) => (
              <Fragment key={u.name}>
                {i > 0 && ', '}
                <Unique>{u.name}</Unique>
              </Fragment>
            ))
          ) : (
            <small>nothing; every skill is shared with another family</small>
          )}
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
              : fac === 'G'
                ? 'None found.'
                : 'None on this continent.'}
          </p>
        )}
      </div>

      <div className="note">
        Viewing <b>{mine}</b> with Zephras Isle pets {zep ? 'included' : 'hidden'}.{' '}
        {fac === 'G' ? (
          <>Pick one continent at the top to see only the pets you can reach without travelling.</>
        ) : (
          <>
            Pets in <b>{other}</b> are not left out: each step has a "{other}" divider you can open. If a rank has no
            source on your continent, the step says so and opens the divider for you.
          </>
        )}
      </div>
    </>
  );
}
