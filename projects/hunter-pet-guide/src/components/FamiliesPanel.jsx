import { catalog as c } from '../catalog.js';
import { actives } from '../lib/catalog.js';

export default function FamiliesPanel({ fam, onPick }) {
  return (
    <>
      <h2>All families</h2>
      <p className="small">Click a family to switch the whole guide to it.</p>
      <div className="fgrid">
        {c.families.map((f) => (
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
            {[...actives(c, f.id).map((a) => a.name), ...f.extra].join(', ')}
          </button>
        ))}
      </div>
    </>
  );
}
