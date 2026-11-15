import { useState } from 'react';
import { writeStored } from '../lib/storage.js';

/** What's showing now: the saved choice, or dark (the default). */
const current = () => (document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark');

const Sun = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
  </svg>
);

const Moon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

const OPTIONS = [
  ['light', 'Light theme', Sun],
  ['dark', 'Dark theme', Moon],
];

/** A sun / moon pair; the one showing is highlighted. Dark until light is picked. */
export default function ThemeToggle() {
  const [theme, setTheme] = useState(current);

  const pick = (next) => {
    document.documentElement.setAttribute('data-theme', next);
    writeStored('cat-theme', next);
    setTheme(next);
  };

  return (
    <span className="seg theme" role="group" aria-label="Theme">
      {OPTIONS.map(([id, label, Icon]) => (
        <button key={id} type="button" aria-pressed={theme === id} aria-label={label} title={label} onClick={() => pick(id)}>
          <Icon />
        </button>
      ))}
    </span>
  );
}
