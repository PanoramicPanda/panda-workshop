import { useEffect, useRef } from 'react';
import { catalog as c } from '../catalog.js';
import { actives, fastestSpeeds, uniqueAbilities } from '../lib/catalog.js';

const unique = uniqueAbilities(c);
const fastest = fastestSpeeds(c);

/** A unique skill: starred as well as coloured, so it doesn't rely on colour alone. */
export const Unique = ({ children }) => <span className="uniq">★ {children}</span>;

/** Every family as a card; picking one switches the guide and closes the dialog. */
export default function FamiliesDialog({ open, fam, onPick, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    const d = ref.current;
    if (open && !d.open) {
      d.showModal();
      // The dialog keeps its scroll position between openings; start at the top so the key shows.
      d.scrollTop = 0;
    }
    if (!open && d.open) d.close();
  }, [open]);

  return (
    // onClose covers Escape; clicking the backdrop (the dialog itself, outside its box) also closes.
    <dialog ref={ref} className="modal wide" onClose={onClose} onClick={(e) => e.target === ref.current && onClose()}>
      <div className="modal-head">
        <h2>All families</h2>
        <button type="button" className="btn" onClick={onClose}>
          Close
        </button>
      </div>
      <div className="modal-body">
        <div className="uniq-key">
          <Unique>Unique skill</Unique>
          <span>No other family can learn it. Pick a family to switch the whole guide to it.</span>
        </div>
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
                {fastest[f.id] && (
                  <small>
                    Fastest attack speed: <b className="spd-inline">{fastest[f.id]}</b>
                  </small>
                )}
                {skills.map((name, i) => (
                  <span key={name}>
                    {i > 0 && ', '}
                    {mine.has(name) ? <Unique>{name}</Unique> : name}
                  </span>
                ))}
              </button>
            );
          })}
        </div>
      </div>
    </dialog>
  );
}
