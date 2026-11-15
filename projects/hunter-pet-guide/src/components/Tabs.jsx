export const TABS = [
  { id: 'rules', label: 'Training Overview' },
  { id: 'family', label: 'Family Overview' },
  { id: 'plan', label: 'Training Plan' },
  { id: 'speed', label: 'Attack Speed' },
  { id: 'ranks', label: 'All Ranks' },
  { id: 'more', label: 'Quirks & TP' },
];

export default function Tabs({ tab, setTab }) {
  return (
    <nav role="tablist">
      {TABS.map((t) => (
        <button
          key={t.id}
          type="button"
          className="tab"
          role="tab"
          aria-selected={tab === t.id}
          aria-controls={t.id}
          onClick={() => setTab(t.id)}
        >
          {t.label}
        </button>
      ))}
    </nav>
  );
}
