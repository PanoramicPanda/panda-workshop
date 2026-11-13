const KINDS = [
  ['all', 'All'],
  ['film', 'Films'],
  ['series', 'Series'],
  ['special', 'Specials and shorts'],
];

function Toggle({ on, onClick, children, title, disabled }) {
  return (
    <button type="button" className="f" aria-pressed={on} onClick={onClick} title={title} disabled={disabled}>
      {children}
    </button>
  );
}

export default function FilterBar({ state, set, shown, list, watchlists }) {
  const flip = (key) => () => set({ [key]: !state[key] });
  return (
    <div className="bar" role="group" aria-label="Filters">
      {KINDS.map(([k, label]) => (
        <Toggle key={k} on={state.kind === k} onClick={() => set({ kind: k })}>
          {label}
        </Toggle>
      ))}
      <input
        type="search"
        placeholder="Search titles, characters, connections"
        aria-label="Search"
        value={state.q}
        onChange={(e) => set({ q: e.target.value })}
      />
      <Toggle on={state.showLinks} onClick={flip('showLinks')}>
        {state.showLinks ? 'Connections on' : 'Connections off'}
      </Toggle>
      <Toggle on={state.hideSpoilers} onClick={flip('hideSpoilers')} title="Hide what each connection actually sets up">
        {state.hideSpoilers ? 'Spoilers hidden' : 'Spoilers shown'}
      </Toggle>
      <Toggle
        on={state.showAdjacent}
        onClick={flip('showAdjacent')}
        title="Show Fox X-Men, other Spider-Men, Netflix shows and more"
      >
        {state.showAdjacent ? 'MCU Adjacent on' : 'MCU Adjacent off'}
      </Toggle>
      <span className="watch">
        <label htmlFor="watchlist">Watching toward</label>
        <select id="watchlist" value={state.list} onChange={(e) => set({ list: e.target.value })}>
          {watchlists.map((w) => (
            <option key={w.id} value={w.id}>
              {w.label}
              {w.source === 'official' ? ' (Disney+ list)' : ''}
            </option>
          ))}
        </select>
      </span>
      <Toggle on={state.glow} onClick={flip('glow')} title={`Highlight the titles to watch before ${list?.label}`}>
        Glow {state.glow ? 'on' : 'off'}
      </Toggle>
      <Toggle on={state.listOnly} onClick={flip('listOnly')} title={`Show only the titles to watch before ${list?.label}`}>
        List only
      </Toggle>
      <span className="count">{shown} shown</span>
    </div>
  );
}
