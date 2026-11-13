import { catalog as c } from '../catalog.js';
import { actives } from '../lib/catalog.js';
import ThemeToggle from './ThemeToggle.jsx';

export default function Header({ fam }) {
  const family = c.familyById[fam];
  const skills = actives(c, fam).map((a) => a.name).join(', ');
  return (
    <header>
      <div>
        <h1>🐾 {family.name} Training Guide</h1>
        <p className="sub">Hunter pets · {skills} · pet links open Wowhead Forever in a new tab</p>
      </div>
      <ThemeToggle />
    </header>
  );
}
