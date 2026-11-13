import { writeStored } from '../lib/storage.js';

/** Flips between light and dark, starting from whatever is showing now (saved choice or system setting). */
export default function ThemeToggle() {
  const toggle = () => {
    const root = document.documentElement;
    const current = root.getAttribute('data-theme');
    const dark = current === 'dark' || (!current && window.matchMedia('(prefers-color-scheme: dark)').matches);
    const next = dark ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    writeStored('cat-theme', next);
  };
  return (
    <button className="btn" type="button" onClick={toggle} aria-label="Toggle theme">
      Theme
    </button>
  );
}
