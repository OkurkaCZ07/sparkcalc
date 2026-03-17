import { DisjointSet } from './disjointSet';
import { nodeIdOfHole, holeKey, parseHoleKey, isHoleRef } from './breadboard';

/**
 * Normalize legacy endpoints:
 * - old wire: {sc,sr,ec,er} -> {a: mainHole, b: mainHole}
 * - new wire: {a:holeRef|holeKey, b:holeRef|holeKey}
 */
export function normalizeWire(w) {
  if (!w) return null;
  if (w.a && w.b) {
    const a = typeof w.a === 'string' ? parseHoleKey(w.a) : w.a;
    const b = typeof w.b === 'string' ? parseHoleKey(w.b) : w.b;
    if (isHoleRef(a) && isHoleRef(b)) return { ...w, a, b };
  }
  if (Number.isFinite(w.sc) && Number.isFinite(w.sr) && Number.isFinite(w.ec) && Number.isFinite(w.er)) {
    return {
      ...w,
      a: { kind: 'main', col: w.sc, row: w.sr },
      b: { kind: 'main', col: w.ec, row: w.er },
    };
  }
  return null;
}

export function normalizeComponent(comp) {
  if (!comp) return null;
  // legacy: {col,row} anchor on main
  const anchor =
    comp.anchor ? (typeof comp.anchor === 'string' ? parseHoleKey(comp.anchor) : comp.anchor) : { kind: 'main', col: comp.col, row: comp.row };
  return {
    ...comp,
    anchor,
    rot: Number.isFinite(comp.rot) ? comp.rot : 0,
  };
}

/**
 * Build connectivity (Union-Find) over breadboard logical nodes:
 * - main holes collapse by design to H:col:top/bot (no unions required)
 * - rails collapse by design to R:top+/top-/bot+/bot-
 * - wires union the two endpoint nodeIds
 */
export function buildConnectivity(components, wires) {
  const ds = new DisjointSet();

  const ensureNode = (nodeId) => ds.makeSet(nodeId);

  // Ensure nodes for all referenced holes so find() is stable.
  const touchHole = (h) => {
    if (!h) return;
    const node = nodeIdOfHole(h);
    ensureNode(node);
  };

  const normComps = (components || []).map(normalizeComponent);
  const normWires = (wires || []).map(normalizeWire).filter(Boolean);

  normWires.forEach((w) => {
    touchHole(w.a);
    touchHole(w.b);
    const na = nodeIdOfHole(w.a);
    const nb = nodeIdOfHole(w.b);
    ds.union(na, nb);
  });

  // Components don't union nets themselves (they are elements between nets),
  // but we still touch nodes so they exist in DS.
  normComps.forEach((c) => {
    if (c.pinsAbs) {
      c.pinsAbs.forEach(touchHole);
    }
  });

  const netIdOfHole = (h) => ds.find(nodeIdOfHole(h));

  return { ds, netIdOfHole, normWires, normComps };
}

export function wireToSerializable(w) {
  const nw = normalizeWire(w);
  if (!nw) return null;
  return {
    id: nw.id,
    a: holeKey(nw.a),
    b: holeKey(nw.b),
    color: nw.color,
  };
}

