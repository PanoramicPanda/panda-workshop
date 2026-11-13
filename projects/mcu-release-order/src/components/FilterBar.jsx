import { useEffect, useId, useRef, useState } from 'react';
import { DEFAULT_STATE } from '../lib/filter.js';
import PhasePicker from './PhasePicker.jsx';

const KINDS = [
  ['all', 'All'],
  ['film', 'Films'],
  ['series', 'Series'],
  ['special', 'Specials & shorts'],
];

/** A row of mutually exclusive options that reads as one control. */
function Segmented({ label, options, value, onChange }) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {options.map(([v, text]) => (
        <button key={v} type="button" aria-pressed={value === v} onClick={() => onChange(v)}>
          {text}
        </button>
      ))}
    </div>
  );
}

/** On/off switch with a fixed label (the label never flips; the switch shows the state). */
function Switch({ checked, onChange, label, hint, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className="sw"
      disabled={disabled}
      onClick={() => onChange(!checked)}
    >
      <span className="sw-track" aria-hidden="true">
        <span className="sw-thumb" />
      </span>
      <span className="sw-text">
        {label}
        {hint && <small>{hint}</small>}
      </span>
    </button>
  );
}

/** What differs from the default view, as removable chips. */
function activeFilters(state, list, phases) {
  const d = DEFAULT_STATE;
  const chips = [];
  if (state.kind !== d.kind) chips.push({ key: 'kind', text: KINDS.find(([k]) => k === state.kind)[1], reset: { kind: d.kind } });
  if (state.phases.length) {
    const names = state.phases.map((id) => phases.find((p) => p.id === id).short.replace('Phase ', ''));
    const text = state.phases.length === 1 ? phases.find((p) => p.id === state.phases[0]).short : `Phases ${names.join(', ')}`;
    chips.push({ key: 'phases', text, reset: { phases: [] } });
  }
  if (state.list !== d.list) chips.push({ key: 'list', text: `Toward ${list.label}`, reset: { list: d.list } });
  if (state.listOnly) chips.push({ key: 'only', text: 'Only the watchlist', reset: { listOnly: false } });
  if (!state.glow) chips.push({ key: 'glow', text: 'Highlight off', reset: { glow: true } });
  if (state.showAdjacent) chips.push({ key: 'adj', text: 'MCU Adjacent', reset: { showAdjacent: false } });
  if (!state.hideSpoilers) chips.push({ key: 'spoil', text: 'Spoilers revealed', reset: { hideSpoilers: true } });
  if (!state.showLinks) chips.push({ key: 'links', text: 'Connections hidden', reset: { showLinks: true } });
  return chips;
}

export default function FilterBar({ state, set, shown, list, watchlists, phases }) {
  const [open, setOpen] = useState(false);
  const barRef = useRef(null);
  const panelId = useId();
  const selectId = useId();
  const graph = state.view === 'graph';
  const chips = activeFilters(state, list, phases);

  // Close the panel on Escape or a click outside the bar.
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    const onDown = (e) => !barRef.current?.contains(e.target) && setOpen(false);
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onDown);
    };
  }, [open]);

  return (
    <div className={'bar' + (open ? ' open' : '')} ref={barRef}>
      <div className="bar-main">
        <Segmented
          label="View"
          options={[
            ['timeline', 'Timeline'],
            ['graph', 'Graph'],
          ]}
          value={state.view}
          onChange={(view) => set({ view })}
        />
        <label className="search">
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <circle cx="8.5" cy="8.5" r="5.5" />
            <path d="M13 13l4.5 4.5" />
          </svg>
          <input
            type="search"
            placeholder="Search titles, characters, connections"
            aria-label="Search"
            value={state.q}
            onChange={(e) => set({ q: e.target.value })}
          />
        </label>
        <button
          type="button"
          className="fbtn"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((o) => !o)}
        >
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <path d="M3 5h14M6 10h8M9 15h2" />
          </svg>
          Filters
          {chips.length > 0 && <span className="badge">{chips.length}</span>}
        </button>
        <span className="count" aria-live="polite">
          {shown} shown
        </span>
      </div>

      {chips.length > 0 && (
        <div className="active" aria-label="Active filters">
          {chips.map((c) => (
            <button key={c.key} type="button" className="achip" onClick={() => set(c.reset)} title="Remove this filter">
              {c.text}
              <span aria-hidden="true">×</span>
            </button>
          ))}
          {chips.length > 1 && (
            <button
              type="button"
              className="aclear"
              onClick={() => set(Object.assign({}, ...chips.map((c) => c.reset)))}
            >
              Clear all
            </button>
          )}
        </div>
      )}

      <div className="fpanel" id={panelId} hidden={!open}>
        <section>
          <h3>Type</h3>
          <Segmented label="Type" options={KINDS} value={state.kind} onChange={(kind) => set({ kind })} />
        </section>
        <section>
          <h3>Phases</h3>
          <PhasePicker phases={phases} selected={state.phases} onChange={(ids) => set({ phases: ids })} />
        </section>
        <section>
          <h3>
            <label htmlFor={selectId}>Watching toward</label>
          </h3>
          <select id={selectId} value={state.list} onChange={(e) => set({ list: e.target.value })}>
            {watchlists.map((w) => (
              <option key={w.id} value={w.id}>
                {w.label}
                {w.source === 'official' ? ' (Disney+ list)' : ''}
              </option>
            ))}
          </select>
          <p className="fnote">{list?.sourceNote}</p>
          <Switch checked={state.glow} onChange={(glow) => set({ glow })} label="Highlight the watchlist" />
          <Switch checked={state.listOnly} onChange={(listOnly) => set({ listOnly })} label="Only show the watchlist" />
        </section>
        <section>
          <h3>Display</h3>
          <Switch
            checked={graph || state.showLinks}
            onChange={(showLinks) => set({ showLinks })}
            label="Connections"
            hint={graph ? 'Always on in the graph' : 'What each title sets up or pays off'}
            disabled={graph}
          />
          <Switch
            checked={!state.hideSpoilers}
            onChange={(reveal) => set({ hideSpoilers: !reveal })}
            label="Reveal spoilers"
            hint="Or tap a single redaction to peek"
          />
          <Switch
            checked={state.showAdjacent}
            onChange={(showAdjacent) => set({ showAdjacent })}
            label="MCU Adjacent"
            hint="Fox X-Men, other Spider-Men, Netflix shows and more"
          />
        </section>
        <button type="button" className="fdone" onClick={() => setOpen(false)}>
          Done
        </button>
      </div>
    </div>
  );
}
