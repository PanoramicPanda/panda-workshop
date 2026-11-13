import { KIND_LABELS, displayName } from '../lib/catalog.js';
import { visibleConnections } from '../lib/filter.js';
import Note from './Note.jsx';
import Redacted from './Redacted.jsx';

/** The card body for one title. Shared by the timeline row and the graph's side panel. */
export default function TitleCard({ title, state, catalog, list, onGo, headingLevel = 3 }) {
  const H = `h${headingLevel}`;
  const member = list?.memberSet.has(title.id);
  const target = list?.target === title.id;
  const conns = visibleConnections(title, state, catalog);
  return (
    <div className="card">
      <H>{title.title}</H>
      <div className="chips">
        <span className="chip kind">{KIND_LABELS[title.kind]}</span>
        {title.adjacent && <span className="chip adjchip">MCU Adjacent</span>}
        {member && <span className="chip dwchip">{list.chip}</span>}
        {target && <span className="chip destchip">Destination</span>}
        {title.season && <span className="chip">{title.season}</span>}
        {title.episodes && <span className="chip">{title.episodes}</span>}
        {title.live && <span className="chip live">Airing now</span>}
        {title.soon && <span className="chip soon">Upcoming</span>}
      </div>
      {title.releaseNote && <p className="pause">{title.releaseNote}</p>}
      <Note text={title.note} hideSpoilers={state.hideSpoilers} />
      {conns.length > 0 && (
        <ul className="links">
          {conns.map((c) => (
            <li key={c.label + c.to} className={c.rel === 'sequel' ? 'seq' : undefined}>
              <span className="rel">{c.label}</span>
              <button type="button" className="ref" onClick={() => onGo(c.to)}>
                {displayName(catalog.byId[c.to])}
              </button>
              {c.text && <Redacted text={c.text} hidden={state.hideSpoilers} />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
