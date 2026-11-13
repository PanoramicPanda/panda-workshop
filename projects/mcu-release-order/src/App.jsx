import { useCallback, useEffect, useMemo, useState } from 'react';
import titles from './data/titles.json';
import phases from './data/phases.json';
import watchlists from './data/watchlists.json';
import { buildCatalog, stats as computeStats } from './lib/catalog.js';
import { currentList, isVisible } from './lib/filter.js';
import { decodeState, encodeState } from './lib/urlState.js';
import Header from './components/Header.jsx';
import FilterBar from './components/FilterBar.jsx';
import Timeline from './components/Timeline.jsx';
import GraphView from './components/GraphView.jsx';
import AfterSection from './components/AfterSection.jsx';
import Footer from './components/Footer.jsx';

const catalog = buildCatalog({ titles, phases, watchlists });
const headerStats = computeStats(catalog.titles);
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Loosen filters just enough that `id` becomes visible (kind/search/phases first, then List only). */
function revealTitle(s, id) {
  const t = catalog.byId[id];
  if (!t || t.after || isVisible(t, s, catalog)) return s;
  const loosened = { ...s, kind: 'all', q: '', phases: [] };
  return isVisible(t, loosened, catalog) ? loosened : { ...loosened, listOnly: false };
}

export default function App() {
  const [state, setState] = useState(() => decodeState(window.location.hash, catalog));
  const set = useCallback((patch) => setState((s) => ({ ...s, ...patch })), []);
  const [jump, setJump] = useState(null); // { id, n } — n makes repeat jumps to the same title re-fire

  const list = currentList(catalog, state);
  const visible = useMemo(() => catalog.titles.filter((t) => isVisible(t, state, catalog)), [state]);

  // Keep the URL hash in sync so any view can be bookmarked or shared.
  useEffect(() => {
    const hash = encodeState(state);
    const url = window.location.pathname + window.location.search + (hash ? `#${hash}` : '');
    if (url !== window.location.pathname + window.location.search + window.location.hash) {
      window.history.replaceState(null, '', url);
    }
  }, [state]);
  useEffect(() => {
    const onHash = () => setState(decodeState(window.location.hash, catalog));
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  // Jump to a title in the timeline, loosening filters if they hide it.
  const go = useCallback((id) => {
    setState((s) => ({ ...revealTitle(s, id), view: 'timeline' }));
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

  // Select a title in the graph, loosening filters if they hide it.
  const selectNode = useCallback((id) => setState((s) => ({ ...revealTitle(s, id), sel: id })), []);

  // The graph also shows the next film outside the chart (e.g. Doomsday), so its incoming web is visible.
  const graphTitles = useMemo(
    () => (state.view === 'graph' ? [...visible, ...catalog.after.filter((t) => isVisible(t, state, catalog))] : []),
    [visible, state],
  );

  const graphView = state.view === 'graph';
  const appClass = ['app', !graphView && !state.showLinks && 'nolinks', !state.glow && 'noglow'].filter(Boolean).join(' ');
  const cardProps = { state, catalog, list, onGo: go };

  return (
    <div className={appClass}>
      <div className="wrap">
        <Header stats={headerStats} list={list} showDest={!!list && !catalog.byId[list.target]?.after} />
        <FilterBar
          state={state}
          set={set}
          shown={graphView ? graphTitles.length : visible.length}
          list={list}
          watchlists={catalog.watchlists}
          phases={catalog.phases}
        />
        {graphView ? (
          <GraphView
            titles={graphTitles}
            state={state}
            set={set}
            catalog={catalog}
            list={list}
            onSelect={selectNode}
            onShowInTimeline={go}
          />
        ) : (
          <>
            <Timeline phases={catalog.phases} visible={visible} {...cardProps} />
            <AfterSection titles={catalog.after} catalog={catalog} hideSpoilers={state.hideSpoilers} />
          </>
        )}
        <Footer />
      </div>
    </div>
  );
}
