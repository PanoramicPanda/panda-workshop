import { useState } from 'react';
import { catalog as c } from '../catalog.js';
import { passives } from '../lib/catalog.js';
import { zonesOf } from '../lib/plans.js';
import { readStored, tickKey, useStored, writeStored } from '../lib/storage.js';
import PlanItem from './PlanItem.jsx';

const parseShowDone = (v) => v === '1';
const saveShowDone = (v) => (v ? '1' : '0');

/**
 * A plan (A or B) as a list of stops, each with tickable ranks.
 * Remounted (via `key`) when the family, continent or Zephras setting changes.
 */
export default function PlanPanel({ plan, title, sub, stops, settings }) {
  const { fam, fac } = settings;
  const keyOf = (x) => tickKey(plan, fam, fac, x.ability, x.rank);
  const keys = stops.flatMap((s) => s.items.map(keyOf));
  const [ticks, setTicks] = useState(() => Object.fromEntries(keys.map((k) => [k, readStored(k) === '1'])));
  const [showDone, setShowDone] = useStored('hpg-showdone', parseShowDone, saveShowDone);
  const doneCount = keys.filter((k) => ticks[k]).length;

  // Ticked ranks drop out of the list, and a stop with nothing left drops out entirely.
  const visible = stops
    .map((stop) => ({ ...stop, items: showDone ? stop.items : stop.items.filter((x) => !ticks[keyOf(x)]) }))
    .filter((stop) => stop.items.length);

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
        <label className="small">
          <input type="checkbox" checked={showDone} onChange={(e) => setShowDone(e.target.checked)} /> Show checked (
          {doneCount})
        </label>
        <button type="button" className="reset" onClick={clear}>
          Clear ticks
        </button>
      </div>
      {!stops.length && <div className="note">No obtainable ranks found for this family with these settings.</div>}
      {stops.length > 0 && !visible.length && (
        <div className="note">All skills ticked. Tick "Show checked" to see them again.</div>
      )}
      {visible.map((stop) => (
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
