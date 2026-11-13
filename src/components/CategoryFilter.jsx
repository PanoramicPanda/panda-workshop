export default function CategoryFilter({ categories, active, total, onChange }) {
  return (
    <div className="chips" role="group" aria-label="Filter by category">
      <button type="button" className="chip" aria-pressed={active === null} onClick={() => onChange(null)}>
        All <span className="chip-count">{total}</span>
      </button>
      {categories.map(({ name, count }) => (
        <button
          key={name}
          type="button"
          className="chip"
          aria-pressed={active === name}
          onClick={() => onChange(active === name ? null : name)}
        >
          {name} <span className="chip-count">{count}</span>
        </button>
      ))}
    </div>
  );
}
