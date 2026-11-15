import { useState } from 'react';
import { catalog as c } from '../catalog.js';
import { passives } from '../lib/catalog.js';
import { zonesOf } from '../lib/plans.js';
import { readTick, tickKey, useStored, writeTick } from '../lib/storage.js';
import PlanItem from './PlanItem.jsx';

const parseShowDone = (v) => v === '1';
const saveShowDone = (v) => (v ? '1' : '0');

/**
 * A plan (A or B) as a list of stops, each with tickable ranks.
 * Remounted (via `key`) when the family, continent or Zephras setting changes.
 */
export default function PlanPanel({ plan, title, sub, stops, settings, allRanks, setAllRanks }) {
  const { fam } = settings;
  const keyOf = (x) => tickKey(plan, x.ability, x.rank);
  const items = stops.flatMap((s) => s.items);
  const keys = items.map(keyOf);
  const [ticks, setTicks] = useState(() =>
    Object.fromEntries(items.map((x) => [keyOf(x), readTick(plan, x.ability, x.rank)])),
  );
  const [showDone, setShowDone] = useStored('hpg-showdone', parseShowDone, saveShowDone);
  const doneCount = keys.filter((k) => ticks[k]).length;

  // Ticked ranks drop out of the list, and a stop with nothing left drops out entirely.
  const visible = stops
    .map((stop) => ({ ...stop, items: showDone ? stop.items : stop.items.filter((x) => !ticks[keyOf(x)]) }))
    .filter((stop) => stop.items.length);

  const setTick = (x, on) => {
    writeTick(plan, x.ability, x.rank, on);
    setTicks((t) => ({ ...t, [keyOf(x)]: on }));
  };
  const clear = () => {
    items.forEach((x) => writeTick(plan, x.ability, x.rank, false));
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
          <input type="checkbox" checked={allRanks} onChange={(e) => setAllRanks(e.target.checked)} /> Show every rank
        </label>
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
              return <PlanItem key={k} item={x} settings={settings} checked={!!ticks[k]} onCheck={(on) => setTick(x, on)} />;
            })}
          </ul>
        </div>
      ))}
      <p className="small">
        Also from the pet trainer (see All Ranks): {passives(c, fam).map((a) => a.name).join(', ')}.
      </p>
    </>
  );
}
