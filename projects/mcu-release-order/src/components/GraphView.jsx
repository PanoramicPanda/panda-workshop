import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { select } from 'd3-selection';
import { zoom, zoomIdentity, zoomTransform } from 'd3-zoom';
import { bounds, buildGraph, layoutGraph } from '../lib/graph.js';
import GraphPanel from './GraphPanel.jsx';

const ZOOM_LABELS_AT = 1.5; // show every label once zoomed in this far

/** Connections as a node graph. Shows the same filtered titles as the timeline. */
export default function GraphView({ titles, state, set, catalog, list, onShowInTimeline, onSelect }) {
  const graph = useMemo(() => buildGraph(titles, list), [titles, list]);

  // Lay out synchronously; keep positions of titles that stay on screen when filters change.
  const svgRef = useRef(null);
  const [aspect, setAspect] = useState(1.6);
  useEffect(() => {
    const svg = svgRef.current;
    const measure = () => setAspect(Math.round((svg.clientWidth / Math.max(svg.clientHeight, 1)) * 4) / 4 || 1.6);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(svg);
    return () => ro.disconnect();
  }, []);

  const lastPositions = useRef(new Map());
  const lastLayout = useRef(state.layout);
  const positions = useMemo(() => {
    const previous = lastLayout.current === state.layout ? lastPositions.current : new Map();
    return layoutGraph(graph, { layout: state.layout, previous, aspect });
  }, [graph, state.layout, aspect]);
  useEffect(() => {
    lastPositions.current = positions;
    lastLayout.current = state.layout;
  }, [positions, state.layout]);

  // Pan and zoom. The transform is written straight to the <g>; React only hears whether labels should show.
  const gRef = useRef(null);
  const zoomRef = useRef(null);
  const [zoomedIn, setZoomedIn] = useState(false);
  useEffect(() => {
    const z = zoom()
      .scaleExtent([0.2, 5])
      .on('zoom', (ev) => {
        const g = gRef.current;
        if (!g) return;
        g.setAttribute('transform', ev.transform.toString());
        g.style.setProperty('--inv', String(1 / ev.transform.k));
        setZoomedIn(ev.transform.k >= ZOOM_LABELS_AT);
      });
    select(svgRef.current).call(z).on('dblclick.zoom', null);
    zoomRef.current = z;
    return () => select(svgRef.current).on('.zoom', null);
  }, []);

  const fit = useCallback(() => {
    const svg = svgRef.current;
    if (!svg || !zoomRef.current || !graph.nodes.length) return;
    const w = svg.clientWidth;
    const h = svg.clientHeight;
    const b = bounds(graph.nodes, positions);
    const pad = 40;
    const bw = Math.max(b.x1 - b.x0, 1);
    const bh = Math.max(b.y1 - b.y0, 1);
    const k = Math.min(Math.max(Math.min((w - pad * 2) / bw, (h - pad * 2) / bh), 0.45), 1.6);
    // Too wide to fit at a readable size (long timeline webs): start at the left edge instead of centering.
    const tx = bw * k > w - pad * 2 ? pad - b.x0 * k : (w - bw * k) / 2 - b.x0 * k;
    const ty = (h - bh * k) / 2 - b.y0 * k;
    select(svg).call(zoomRef.current.transform, zoomIdentity.translate(tx, ty).scale(k));
  }, [graph, positions]);
  useEffect(fit, [fit]);

  // Highlight: hovered node wins, otherwise the selected one.
  const [hoverId, setHoverId] = useState(null);
  const selVisible = state.sel && graph.neighbors.has(state.sel) ? state.sel : null;
  const focusId = hoverId && graph.neighbors.has(hoverId) ? hoverId : selVisible;
  const lit = focusId ? new Set([focusId, ...graph.neighbors.get(focusId)]) : null;

  // When a node is selected, pan it out from under the details panel if needed.
  useEffect(() => {
    const svg = svgRef.current;
    const panel = svg?.parentElement.querySelector('.gpanel');
    const p = selVisible && positions.get(selVisible);
    if (!p || !panel || !zoomRef.current || window.matchMedia('(max-width:660px)').matches) return;
    const t = zoomTransform(svg);
    const [sx, sy] = t.apply([p.x, p.y]);
    const freeRight = svg.clientWidth - panel.offsetWidth - 24;
    if (sx > freeRight - 40) {
      select(svg).call(zoomRef.current.translateBy, (freeRight / 2 - sx) / t.k, (svg.clientHeight / 2 - sy) / t.k);
    }
  }, [selVisible, positions]);

  const select_ = (id) => set({ sel: id });
  const nodeById = useMemo(() => new Map(graph.nodes.map((n) => [n.id, n])), [graph]);
  const selectedTitle = selVisible ? catalog.byId[selVisible] : null;

  return (
    <div className={'graph' + (lit ? ' focused' : '') + (state.glow ? '' : ' noglow')}>
      <div className="gtools" role="group" aria-label="Graph layout">
        <button type="button" className="f" aria-pressed={state.layout === 'time'} onClick={() => set({ layout: 'time' })}
          title="Left to right follows release order">
          Timeline web
        </button>
        <button type="button" className="f" aria-pressed={state.layout === 'free'} onClick={() => set({ layout: 'free' })}
          title="Tightly connected titles pull together">
          Free web
        </button>
        <button type="button" className="f" onClick={fit}>Fit</button>
        <span className="gkey">
          <svg width="34" height="10" aria-hidden="true"><line x1="2" y1="5" x2="26" y2="5" className="gk sets" /><path d="M26,1 L33,5 L26,9z" className="gk-arrow" /></svg>
          sets up
          <svg width="34" height="10" aria-hidden="true"><line x1="2" y1="5" x2="32" y2="5" className="gk ties" /></svg>
          ties to
        </span>
        <span className="ghint">Drag to pan, scroll or pinch to zoom, tap a title for details.</span>
      </div>

      <svg
        ref={svgRef}
        className="gsvg"
        role="img"
        aria-label={`Connection graph of ${graph.nodes.length} titles and ${graph.edges.length} connections`}
        onClick={(e) => {
          if (e.target === svgRef.current) set({ sel: null });
        }}
      >
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" className="arrowhead" />
          </marker>
          <marker id="arrow-lit" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" className="arrowhead lit" />
          </marker>
        </defs>
        <g ref={gRef}>
          <g className="gedges">
            {graph.edges.map((e) => {
              const a = positions.get(e.source);
              const b = positions.get(e.target);
              const tr = nodeById.get(e.target).r;
              const dx = b.x - a.x;
              const dy = b.y - a.y;
              const len = Math.hypot(dx, dy) || 1;
              const cut = e.rel === 'sets' ? tr + 3 : tr;
              const isLit = lit && (e.source === focusId || e.target === focusId);
              return (
                <line
                  key={e.id}
                  className={`gedge ${e.rel}${isLit ? ' lit' : ''}`}
                  x1={a.x}
                  y1={a.y}
                  x2={b.x - (dx / len) * cut}
                  y2={b.y - (dy / len) * cut}
                  markerEnd={e.rel === 'sets' ? `url(#${isLit ? 'arrow-lit' : 'arrow'})` : undefined}
                />
              );
            })}
          </g>
          <g className="gnodes">
            {graph.nodes.map((n) => {
              const p = positions.get(n.id);
              const cls = [
                'gnode',
                n.adjacent && 'adj',
                n.member && 'member',
                n.target && 'target',
                lit?.has(n.id) && 'lit',
                n.id === selVisible && 'sel',
              ]
                .filter(Boolean)
                .join(' ');
              const showLabel = n.hub || n.target || zoomedIn || lit?.has(n.id);
              return (
                <g
                  key={n.id}
                  className={cls}
                  data-k={n.kind}
                  data-id={n.id}
                  transform={`translate(${p.x},${p.y})`}
                  tabIndex={0}
                  role="button"
                  aria-label={`${n.label}, ${n.degree} connection${n.degree === 1 ? '' : 's'}`}
                  aria-pressed={n.id === selVisible}
                  onMouseEnter={() => setHoverId(n.id)}
                  onMouseLeave={() => setHoverId(null)}
                  onFocus={() => setHoverId(n.id)}
                  onBlur={() => setHoverId(null)}
                  onClick={(ev) => {
                    ev.stopPropagation();
                    select_(n.id);
                  }}
                  onKeyDown={(ev) => {
                    if (ev.key === 'Enter' || ev.key === ' ') {
                      ev.preventDefault();
                      select_(n.id);
                    }
                  }}
                >
                  {n.target && <circle className="ring" r={n.r + 6} />}
                  <circle className="dot" r={n.r} />
                  {showLabel && (
                    <text className="glabel" y={n.r + 4} dy="0.9em">
                      {n.label}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        </g>
      </svg>

      {graph.nodes.length === 0 && <p className="gempty">No titles match the current filters.</p>}

      {selectedTitle && (
        <GraphPanel
          title={selectedTitle}
          state={state}
          catalog={catalog}
          list={list}
          onSelect={onSelect}
          onShowInTimeline={() => onShowInTimeline(selectedTitle.id)}
          onClose={() => set({ sel: null })}
        />
      )}
    </div>
  );
}
