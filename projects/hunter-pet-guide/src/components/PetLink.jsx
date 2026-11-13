import { catalog as c } from '../catalog.js';
import { alsoText } from '../lib/catalog.js';

/**
 * A pet's Wowhead link (coloured by region) with its family, level and zone,
 * plus any other skills of the current family it teaches.
 * `cur` is the [ability, rank] being shown, left out of the "also" note.
 */
export default function PetLink({ id, cur = null, fam, wording = 'also' }) {
  const p = c.petById[id];
  const also = alsoText(c, id, cur, fam);
  return (
    <>
      <a className={`pet s-${p.region}`} href={`https://www.wowhead.com/forever/npc=${id}`} target="_blank" rel="noopener">
        {p.name}
      </a>{' '}
      <small>
        {c.familyById[p.family].singular} {p.level} · {p.zone}
        {also && (
          <>
            {' · '}
            <b className="two">
              {wording} {also}
            </b>
          </>
        )}
      </small>
    </>
  );
}

/** One row per pet. */
export function PetList({ ids, cur, fam }) {
  return ids.map((id) => (
    <span className="p" key={id}>
      <PetLink id={id} cur={cur} fam={fam} />
    </span>
  ));
}
