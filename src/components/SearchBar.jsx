export default function SearchBar({ value, onChange }) {
  return (
    <div className="search">
      <label htmlFor="project-search" className="visually-hidden">
        Search projects
      </label>
      <svg className="search-icon" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="m20 20-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <input
        id="project-search"
        type="search"
        placeholder="Search by name, tag, or category…"
        autoComplete="off"
        spellCheck="false"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Escape' && onChange('')}
      />
    </div>
  );
}
