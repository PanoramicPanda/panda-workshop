import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import titles from './data/titles.json';
import phases from './data/phases.json';
import watchlists from './data/watchlists.json';
import { buildCatalog, stats as computeStats } from './lib/catalog.js';
import { DEFAULT_STATE, currentList, isVisible } from './lib/filter.js';
import Header from './components/Header.jsx';
import FilterBar from './components/FilterBar.jsx';
import Timeline from './components/Timeline.jsx';
import AfterSection from './components/AfterSection.jsx';
import Footer from './components/Footer.jsx';

const catalog = buildCatalog({ titles, phases, watchlists });
const headerStats = computeStats(catalog.titles);
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function App() {
  const [state, setState] = useState(DEFAULT_STATE);
  const set = useCallback((patch) => setState((s) => ({ ...s, ...patch })), []);
  const [jump, setJump] = useState(null); // { id, n } — n makes repeat jumps to the same title re-fire

  const list = currentList(catalog, state);
  const visible = useMemo(() => catalog.titles.filter((t) => isVisible(t, state, catalog)), [state]);

  // Jump to a linked title. If current filters hide it, loosen them first.
  const go = useCallback((id) => {
    setState((s) => {
      const t = catalog.byId[id];
      if (!t || t.after || isVisible(t, s, catalog)) return s;
      const loosened = { ...s, kind: 'all', q: '' };
      return isVisible(t, loosened, catalog) ? loosened : { ...loosened, listOnly: false };
    });
    setJump((j) => ({ id, n: (j?.n ?? 0) + 1 }));
  }, []);

  useEffect(() => {
    if (!jump) return;
    const el = document.getElementById(`r-${jump.id}`);
    if (!el) return;
    el.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' });
    el.classList.remove('flash');
    void el.offsetWidth; // restart the animation
    el.classList.add('flash');
  }, [jump]);

  const appClass = ['app', !state.showLinks && 'nolinks', !state.glow && 'noglow'].filter(Boolean).join(' ');
  const cardProps = { state, catalog, list, onGo: go };

  return (
    <div className={appClass}>
      <div className="wrap">
        <Header stats={headerStats} list={list} />
        <FilterBar state={state} set={set} shown={visible.length} list={list} />
        <Timeline phases={catalog.phases} visible={visible} {...cardProps} />
        <AfterSection titles={catalog.after} catalog={catalog} hideSpoilers={state.hideSpoilers} />
        <Footer />
      </div>
    </div>
  );
}
