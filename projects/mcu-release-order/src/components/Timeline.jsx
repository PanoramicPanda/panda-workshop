import TitleCard from './TitleCard.jsx';

function TitleRow({ title, ...cardProps }) {
  const { list } = cardProps;
  const cls = [
    'row',
    title.split && 'split',
    title.adjacent && 'adj',
    list?.memberSet.has(title.id) && 'dw',
    list?.target === title.id && 'dest',
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <article className={cls} id={`r-${title.id}`} data-k={title.kind} data-id={title.id}>
      <div className="date">{title.date}</div>
      <div className="spine" />
      <TitleCard title={title} {...cardProps} />
    </article>
  );
}

/** Phase sections containing the visible titles. Empty phases are left out. */
export default function Timeline({ phases, visible, ...cardProps }) {
  return (
    <main>
      {phases.map((phase) => {
        const rows = visible.filter((t) => t.phase === phase.id);
        if (!rows.length) return null;
        return (
          <section className="phase" key={phase.id} data-p={phase.id}>
            <h2>
              {phase.name}{' '}
              <small>
                {phase.years} · {rows.length} {rows.length === 1 ? 'title' : 'titles'}
              </small>
            </h2>
            {rows.map((t) => (
              <TitleRow key={t.id} title={t} {...cardProps} />
            ))}
          </section>
        );
      })}
    </main>
  );
}
