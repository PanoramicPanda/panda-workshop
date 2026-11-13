import { useState } from 'react';
import { catalog as c } from '../catalog.js';
import { passives } from '../lib/catalog.js';
import { zonesOf } from '../lib/plans.js';
import { readStored, tickKey, writeStored } from '../lib/storage.js';
import PlanItem from './PlanItem.jsx';

/**
 * A plan (A or B) as a list of stops, each with tickable ranks.
 * Remounted (via `key`) when the family, continent or Zephras setting changes.
 */
export default function PlanPanel({ plan, title, sub, stops, settings }) {
  const { fam, fac } = settings;
  const keyOf = (x) => tickKey(plan, fam, fac, x.ability, x.rank);
  const keys = stops.flatMap((s) => s.items.map(keyOf));
  const [ticks, setTicks] = useState(() => Object.fromEntries(keys.map((k) => [k, readStored(k) === '1'])));

  const setTick = (k, on) => {
    writeStored(k, on ? '1' : '0');
    setTicks((t) => ({ ...t, [k]: on }));
  };
  const clear = () => {
    keys.forEach((k) => writeStored(k, '0'));
    setTicks(Object.fromEntries(keys.map((k) => [k, false])));
  };

  return (
    <>
      <h2>
        {title} — {c.familyById[fam].name}
      </h2>
      <div className="row">
        <span className="small">{sub}</span>
        <button type="button" className="reset" onClick={clear}>
          Clear ticks
        </button>
      </div>
      {!stops.length && <div className="note">No obtainable ranks found for this family with these settings.</div>}
      {stops.map((stop) => (
        <div className="card stop" key={stop.title}>
          <h3>
            {stop.title} <span>{zonesOf(c, stop.items)}</span>
          </h3>
          <ul className="plain">
            {stop.items.map((x) => {
              const k = keyOf(x);
              return <PlanItem key={k} item={x} settings={settings} checked={!!ticks[k]} onCheck={(on) => setTick(k, on)} />;
            })}
          </ul>
        </div>
      ))}
      <p className="small">
        Also from the pet trainer (see All ranks): {passives(c, fam).map((a) => a.name).join(', ')}.
      </p>
    </>
  );
}
