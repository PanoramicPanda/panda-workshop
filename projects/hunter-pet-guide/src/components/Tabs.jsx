export const TABS = [
  { id: 'rules', label: 'Overview' },
  { id: 'plan', label: 'Training plan' },
  { id: 'speed', label: 'Attack speed' },
  { id: 'ranks', label: 'All ranks' },
  { id: 'fams', label: 'All families' },
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
