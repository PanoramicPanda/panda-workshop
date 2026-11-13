import { catalog as c } from '../catalog.js';
import { REGION_NAMES } from '../lib/region.js';

export default function Controls({ settings, setFam, setFac, setZep }) {
  const { fam, fac, zep } = settings;
  return (
    <>
      <div className="ctl">
        <label>
          <b>Pet family:</b>{' '}
          <select value={fam} onChange={(e) => setFam(e.target.value)}>
            {c.families.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </label>
        <span>
          <b>Continent:</b>
        </span>
        <span className="seg">
          {['E', 'K'].map((r) => (
            <button key={r} type="button" aria-pressed={fac === r} onClick={() => setFac(r)}>
              {REGION_NAMES[r]}
            </button>
          ))}
        </span>
        <label>
          <input type="checkbox" checked={zep} onChange={(e) => setZep(e.target.checked)} /> Zephras Isle available{' '}
          <small>(Sky Elf start)</small>
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
