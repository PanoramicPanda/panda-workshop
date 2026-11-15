import { catalog as c } from '../catalog.js';
import { SIDES } from '../lib/region.js';

export default function Controls({ settings, setFam, setFac, setZep, lvl, setLvl, hideHigh, setHideHigh, onBrowse }) {
  const { fam, fac, zep } = settings;
  return (
    <>
      <div className="ctl">
        <span className="fam-pick">
          <label>
            <b>Pet Family:</b>{' '}
            <select value={fam} onChange={(e) => setFam(e.target.value)}>
              {c.families.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </label>
          <button type="button" className="btn" onClick={onBrowse}>
            Browse all…
          </button>
        </span>
        <span>
          <b>Continent:</b>
        </span>
        <span className="seg">
          {SIDES.map(([r, name]) => (
            <button key={r} type="button" aria-pressed={fac === r} onClick={() => setFac(r)}>
              {name}
            </button>
          ))}
        </span>
        <label>
          <input type="checkbox" checked={zep} onChange={(e) => setZep(e.target.checked)} /> Zephras Isle available{' '}
          <small>(Sky Elf start)</small>
        </label>
      </div>
      <div className="ctl">
        <label>
          <b>Hunter Level:</b>{' '}
          <input
            type="number"
            min="1"
            max="60"
            value={lvl || ''}
            placeholder="any"
            onChange={(e) => setLvl(parseInt(e.target.value, 10) || 0)}
          />
        </label>
        <label>
          <input type="checkbox" checked={hideHigh} onChange={(e) => setHideHigh(e.target.checked)} /> Hide pets above my
          level <small>(ones you can't tame yet)</small>
        </label>
      </div>
      <div className="legend small">
        <span>
          <i className="dot" style={{ background: 'var(--sE)' }} />
          Eastern Kingdoms
        </span>
        <span>
          <i className="dot" style={{ background: 'var(--sK)' }} />
          Kalimdor
        </span>
        <span>
          <i className="dot" style={{ background: 'var(--sZ)' }} />
          Zephras Isle
        </span>
      </div>
    </>
  );
}
