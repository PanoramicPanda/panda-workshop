/** Phase chips. Nothing selected means every phase; selecting chips narrows to those phases. */
export default function PhasePicker({ phases, selected, onChange }) {
  const toggle = (id) =>
    onChange(selected.includes(id) ? selected.filter((p) => p !== id) : [...selected, id].sort((a, b) => a - b));
  return (
    <div className="chipset" role="group" aria-label="Phases">
      <button type="button" aria-pressed={selected.length === 0} onClick={() => onChange([])}>
        All
      </button>
      {phases.map((p) => (
        <button key={p.id} type="button" aria-pressed={selected.includes(p.id)} onClick={() => toggle(p.id)}>
          {p.short}
          <small>{p.years}</small>
        </button>
      ))}
    </div>
  );
}
