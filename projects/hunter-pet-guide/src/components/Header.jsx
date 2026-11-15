import { catalog as c } from '../catalog.js';
import { actives } from '../lib/catalog.js';
import Changelog from './Changelog.jsx';
import ThemeToggle from './ThemeToggle.jsx';

export default function Header({ fam }) {
  const family = c.familyById[fam];
  const skills = actives(c, fam).map((a) => a.name).join(', ');
  return (
    <header>
      <div>
        <div className="title-row">
          <h1>🐾 Hunter Pet Training Guide</h1>
          <Changelog />
        </div>
        <p className="sub">
          {family.name} · {skills} · pet links open Wowhead Forever in a new tab
        </p>
      </div>
      <ThemeToggle />
    </header>
  );
}
