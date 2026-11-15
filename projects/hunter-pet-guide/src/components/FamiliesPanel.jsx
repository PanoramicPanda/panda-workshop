import { catalog as c } from '../catalog.js';
import { actives, uniqueAbilities } from '../lib/catalog.js';

const unique = uniqueAbilities(c);

/** "Lightning Breath" plus a note when it can't be trained from a known source. */
const UniqueName = ({ u }) => (
  <>
    {u.name}
    {!u.obtainable && <small> ({u.ability ? 'no known source' : 'no rank data'})</small>}
  </>
);

export default function FamiliesPanel({ fam, onPick }) {
  const rows = c.families.flatMap((f) => unique[f.id].map((u) => ({ f, u }))).sort((x, y) => x.u.name.localeCompare(y.u.name));
  const without = c.families.filter((f) => !unique[f.id].length);
  return (
    <>
      <h2>All families</h2>
      <p className="small">
        Click a family to switch the whole guide to it. <span className="uniq">Highlighted</span> skills are unique: no
        other family can learn them.
      </p>
      <div className="fgrid">
        {c.families.map((f) => {
          const mine = new Set(unique[f.id].map((u) => u.name));
          const skills = [...actives(c, f.id).map((a) => a.name), ...f.extra];
          return (
            <button
              key={f.id}
              type="button"
              className="fcard"
              aria-current={f.id === fam ? 'true' : undefined}
              onClick={() => onPick(f.id)}
            >
              <b>{f.name}</b>
              <small>Diet: {f.diet || '?'}</small>
              <br />
              {skills.map((name, i) => (
                <span key={name}>
                  {i > 0 && ', '}
                  {mine.has(name) ? <span className="uniq">{name}</span> : name}
                </span>
              ))}
            </button>
          );
        })}
      </div>

      <h2>Unique abilities</h2>
      <p className="small">Skills only one family can learn. Click a family to switch to it.</p>
      <div className="card">
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Ability</th>
                <th>Only</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ f, u }) => (
                <tr key={u.name}>
                  <td>
                    <UniqueName u={u} />
                  </td>
                  <td>
                    <button type="button" className="linkish" onClick={() => onPick(f.id)}>
                      {f.name}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {without.length > 0 && (
          <p className="small">No unique ability: {without.map((f) => f.name).join(', ')}.</p>
        )}
      </div>
    </>
  );
}
