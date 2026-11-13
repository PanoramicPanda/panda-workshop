export default function Header({ stats, list, showDest }) {
  return (
    <header className="top">
      <h1>The MCU in release order</h1>
      <p>
        Every movie, series and special from Iron Man (2008) through VisionQuest (2026), in the order audiences actually
        got them. When a show was still running as a film opened, the film is listed after the show. Tap any linked title
        to jump to it. The MCU Adjacent switch adds the Fox X-Men and Deadpool films, the other Spider-Men, the Netflix
        shows and Agents of S.H.I.E.L.D.
      </p>
      <div className="stats">
        <span><b>{stats.total}</b> titles</span>
        <span><b>{stats.films}</b> films</span>
        <span><b>{stats.series}</b> series and seasons</span>
        <span><b>{stats.specials}</b> specials and shorts</span>
        <span><b>{stats.adjacent}</b> more in MCU Adjacent</span>
      </div>
      <div className="legend">
        <span><i style={{ background: 'var(--film)' }} />Film</span>
        <span><i style={{ background: 'var(--series)' }} />Series</span>
        <span><i style={{ background: 'var(--special)' }} />Special</span>
        <span><i style={{ background: 'var(--short)' }} />Shorts</span>
        <span><i className="hollow" />Hollow dot and dashed card: MCU Adjacent, hidden until you switch it on</span>
        {list && (
          <span className="dwleg">
            <i style={{ background: 'var(--dw)' }} />
            {list.source === 'official'
              ? `Green glow: on Disney+’s official ${list.label} watchlist`
              : `Green glow: essential before ${list.label}`}
          </span>
        )}
        {list && showDest && (
          <span className="dwleg">
            <i className="destdot" />
            Ringed: {list.label} itself
          </span>
        )}
      </div>
    </header>
  );
}
