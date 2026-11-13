import TitleCard from './TitleCard.jsx';

/** Details for the selected graph node: the same card as the timeline, plus a way back to it. */
export default function GraphPanel({ title, state, catalog, list, onSelect, onShowInTimeline, onClose }) {
  return (
    <aside className="gpanel" aria-label={`${title.title} details`} data-k={title.kind}>
      <div className="gpanel-bar">
        <span className="date">{title.date}</span>
        <button type="button" className="gclose" onClick={onClose} aria-label="Close details">
          ×
        </button>
      </div>
      <TitleCard title={title} state={state} catalog={catalog} list={list} onGo={onSelect} headingLevel={2} />
      {!title.after && (
        <button type="button" className="f gshow" onClick={onShowInTimeline}>
          Show in timeline
        </button>
      )}
    </aside>
  );
}
