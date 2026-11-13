import { forceCollide, forceLink, forceManyBody, forceSimulation, forceX, forceY } from 'd3-force';
import { displayName } from './catalog.js';

/** Hub threshold: titles with at least this many visible connections always show their label. */
export const HUB_DEGREE = 5;
const TIME_SPACING = 17; // px between consecutive releases in the timeline layout

export const nodeRadius = (degree) => 5 + Math.sqrt(degree) * 2.6;

/**
 * Nodes are the given (already filtered) titles; edges are the connections whose
 * both ends are visible. `rank` is release order, used by the timeline layout.
 */
export function buildGraph(titles, list) {
  const ids = new Set(titles.map((t) => t.id));
  const edges = [];
  for (const t of titles) {
    for (const l of t.links) {
      if (ids.has(l.to)) edges.push({ id: `${t.id}>${l.to}`, source: t.id, target: l.to, rel: l.rel, text: l.text });
    }
  }
  const degree = new Map(titles.map((t) => [t.id, 0]));
  const neighbors = new Map(titles.map((t) => [t.id, new Set()]));
  for (const e of edges) {
    degree.set(e.source, degree.get(e.source) + 1);
    degree.set(e.target, degree.get(e.target) + 1);
    neighbors.get(e.source).add(e.target);
    neighbors.get(e.target).add(e.source);
  }
  const nodes = titles.map((t, rank) => ({
    id: t.id,
    label: displayName(t),
    kind: t.kind,
    adjacent: !!t.adjacent,
    rank,
    degree: degree.get(t.id),
    r: nodeRadius(degree.get(t.id)),
    hub: degree.get(t.id) >= HUB_DEGREE,
    member: !!list?.memberSet.has(t.id),
    target: list?.target === t.id,
  }));
  return { nodes, edges, neighbors };
}

/**
 * Runs the force simulation to completion (no animation loop) and returns id → {x, y}.
 * layout "time": x is pinned near release order so the web still reads left to right.
 * layout "free": a plain force layout where tightly linked titles cluster together.
 * `previous` positions seed nodes that were already on screen so filtering doesn't scramble them.
 */
export function layoutGraph({ nodes, edges }, { layout = 'time', previous = new Map(), ticks = 300, aspect = 1.6 } = {}) {
  const simNodes = nodes.map((n) => {
    const p = previous.get(n.id);
    const homeX = n.rank * TIME_SPACING;
    return { id: n.id, r: n.r, homeX, x: p?.x ?? (layout === 'time' ? homeX : undefined), y: p?.y };
  });
  const simEdges = edges.map((e) => ({ source: e.source, target: e.target }));
  const sim = forceSimulation(simNodes)
    .force('link', forceLink(simEdges).id((d) => d.id).distance(layout === 'time' ? 70 : 55).strength(layout === 'time' ? 0.12 : 0.35))
    .force('charge', forceManyBody().strength(layout === 'time' ? -150 : -160).distanceMax(400))
    .force('collide', forceCollide((d) => d.r + 4))
    .stop();
  if (layout === 'time') {
    sim.force('x', forceX((d) => d.homeX).strength(0.9)).force('y', forceY(0).strength(0.025));
  } else {
    sim.force('x', forceX(0).strength(0.04)).force('y', forceY(0).strength(0.06));
  }
  sim.tick(ticks);
  if (layout === 'time' && simNodes.length > 1) {
    // Release order makes the web long and flat; stretch it vertically toward the canvas shape.
    const ys = simNodes.map((n) => n.y);
    const xs = simNodes.map((n) => n.x);
    const height = Math.max(...ys) - Math.min(...ys) || 1;
    const width = Math.max(...xs) - Math.min(...xs) || 1;
    const stretch = Math.min(Math.max(width / aspect / height, 1), 4);
    for (const n of simNodes) n.y *= stretch;
  }
  return new Map(simNodes.map((n) => [n.id, { x: n.x, y: n.y }]));
}

/** Bounding box of laid-out nodes, including their radius. */
export function bounds(nodes, positions) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const n of nodes) {
    const p = positions.get(n.id);
    if (!p) continue;
    x0 = Math.min(x0, p.x - n.r);
    y0 = Math.min(y0, p.y - n.r);
    x1 = Math.max(x1, p.x + n.r);
    y1 = Math.max(y1, p.y + n.r);
  }
  return Number.isFinite(x0) ? { x0, y0, x1, y1 } : { x0: 0, y0: 0, x1: 0, y1: 0 };
}
