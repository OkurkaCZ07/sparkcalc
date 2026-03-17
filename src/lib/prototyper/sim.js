import { BB, nodeIdOfHole } from './breadboard';
import { buildConnectivity, normalizeComponent, normalizeWire } from './connectivity';
import { solveDC } from './mna';
import { COMP_DEFS as LEGACY_COMP_DEFS } from '../circuitSim';

export const COMP_DEFS = LEGACY_COMP_DEFS;

function parseOhms(val) {
  if (val == null) return NaN;
  const s = String(val).toLowerCase().replace(/[ωΩohm\s]/g, '');
  if (!s) return NaN;
  if (s.includes('m') && !s.includes('ma')) return parseFloat(s) * 1e6;
  if (s.includes('k')) return parseFloat(s) * 1e3;
  return parseFloat(s);
}

function parseVolts(val) {
  if (val == null) return NaN;
  const s = String(val).toLowerCase().replace(/v|\s/g, '');
  return parseFloat(s);
}

function getPinsAbs(comp, def) {
  // Pin offsets are defined in COMP_DEFS as dx/dy in grid units for rot=0.
  // Rotation applies around anchor.
  const rot = ((comp.rot || 0) % 360 + 360) % 360;
  const rotate = (dx, dy) => {
    if (rot === 0) return { dx, dy };
    if (rot === 90) return { dx: -dy, dy: dx };
    if (rot === 180) return { dx: -dx, dy: -dy };
    if (rot === 270) return { dx: dy, dy: -dx };
    return { dx, dy };
  };

  return def.pins.map((p) => {
    const r = rotate(p.dx, p.dy);
    if (comp.anchor.kind !== 'main') return comp.anchor;
    return { kind: 'main', col: comp.anchor.col + r.dx, row: comp.anchor.row + r.dy };
  });
}

export function simulate(components, wires, { simRunning = false } = {}) {
  const result = {
    issues: [], // {severity:'error'|'warn'|'info', message, target?:{kind:'component'|'wire', id}}
    score: 100,
    nodeV: new Map(),
    elementI: new Map(),
    ledStates: new Map(), // compId -> { powered, brightness, currentA, burned }
  };

  const comps = (components || []).map((c) => normalizeComponent(c));
  const ws = (wires || []).map((w) => normalizeWire(w)).filter(Boolean);

  // Compute pinsAbs once for sim + hit testing.
  const compsWithPins = comps.map((c) => {
    const def = COMP_DEFS[c.type];
    const pinsAbs = def ? getPinsAbs(c, def) : [];
    return { ...c, pinsAbs };
  });

  const { ds, netIdOfHole } = buildConnectivity(
    compsWithPins,
    ws
  );

  // Collect nodes referenced by any pin or wire endpoint
  const nodes = new Set();
  const touchNet = (h) => nodes.add(ds.find(nodeIdOfHole(h)));
  ws.forEach((w) => {
    touchNet(w.a);
    touchNet(w.b);
  });
  compsWithPins.forEach((c) => c.pinsAbs.forEach(touchNet));

  const nodeList = [...nodes];

  // Choose ground: prefer net connected to negative pin of first source, else first node.
  let ground = nodeList[0] || 'GND';
  let firstSource = null;
  for (const c of compsWithPins) {
    const def = COMP_DEFS[c.type];
    if (def?.isSource) {
      firstSource = { c, def };
      const minusHole = c.pinsAbs[1];
      ground = ds.find(nodeIdOfHole(minusHole));
      break;
    }
  }

  const sources = [];
  const linearResistors = [];
  const loads = [];
  const switches = [];
  const transistors = [];
  const diodes = [];
  const ics = [];

  for (const c of compsWithPins) {
    const def = COMP_DEFS[c.type];
    if (!def) continue;
    if (def.isSource) sources.push(c);
    else if (c.type.startsWith('resistor')) linearResistors.push(c);
    else if (c.type === 'switch' || c.type === 'button') switches.push(c);
    else if (c.type === 'motor' || c.type === 'buzzer') loads.push(c);
    else if (c.type === 'npn' || c.type === 'pnp' || c.type === 'mosfet-n') transistors.push(c);
    else if (c.type === 'diode' || c.type === 'zener' || def.emissive) diodes.push(c);
    else if (c.type === 'ic555' || c.type === 'lm358') ics.push(c);
  }

  if (sources.length === 0) {
    result.issues.push({ severity: 'error', message: 'No power source! Add a battery or DC supply.' });
    result.score -= 30;
  }

  // Iterative solve to approximate transistor on/off as a resistor.
  const txState = new Map(transistors.map((t) => [t.id, false]));
  let nodeV = new Map([[ground, 0]]);
  let elementI = new Map();

  const netOfPin = (c, pinIdx) => ds.find(nodeIdOfHole(c.pinsAbs[pinIdx]));
  const V = (net) => nodeV.get(net) ?? 0;

  for (let iter = 0; iter < 3; iter++) {
    const resistors = [];
    const vSources = [];

    // Sources
    for (const c of sources) {
      const def = COMP_DEFS[c.type];
      const parsed = parseVolts(c.value);
      const v = Number.isFinite(parsed) ? parsed : (Number.isFinite(def.voltage) ? def.voltage : 5);
      vSources.push({ id: c.id, a: netOfPin(c, 0), b: netOfPin(c, 1), v: Number.isFinite(v) ? v : 5 });
    }

    // Linear resistors
    for (const c of linearResistors) {
      const r = parseOhms(c.value);
      resistors.push({ id: c.id, a: netOfPin(c, 0), b: netOfPin(c, 1), r: Number.isFinite(r) && r > 0 ? r : 1000 });
    }

    // Switches / buttons
    for (const c of switches) {
      const def = COMP_DEFS[c.type];
      const closed = c.props?.closed ?? def.isClosed ?? false;
      if (closed) resistors.push({ id: c.id, a: netOfPin(c, 0), b: netOfPin(c, 1), r: 0.05 });
    }

    // Loads
    for (const c of loads) {
      resistors.push({ id: c.id, a: netOfPin(c, 0), b: netOfPin(c, 1), r: c.type === 'motor' ? 10 : 30 });
    }

    // Transistors (as controlled resistors)
    for (const t of transistors) {
      const on = txState.get(t.id);
      if (!on) continue;
      if (t.type === 'npn' || t.type === 'pnp') {
        const e = netOfPin(t, 0);
        const c = netOfPin(t, 2);
        resistors.push({ id: t.id, a: c, b: e, r: 25 });
      } else if (t.type === 'mosfet-n') {
        const s = netOfPin(t, 0);
        const d = netOfPin(t, 2);
        resistors.push({ id: t.id, a: d, b: s, r: 10 });
      }
    }

    if (nodeList.length > 0 && (vSources.length > 0 || resistors.length > 0)) {
      const sol = solveDC({ nodes: nodeList, ground, resistors, vSources });
      nodeV = sol.nodeV;
      elementI = new Map();
      sol.resistorI.forEach((i, id) => elementI.set(id, i));
      sol.vSourceI.forEach((i, id) => elementI.set(id, i));
    }

    // Update transistor states based on the solved node voltages
    let changed = false;
    for (const t of transistors) {
      if (t.type === 'npn') {
        const ve = V(netOfPin(t, 0));
        const vb = V(netOfPin(t, 1));
        const nextOn = (vb - ve) > 0.7;
        if (txState.get(t.id) !== nextOn) { txState.set(t.id, nextOn); changed = true; }
      } else if (t.type === 'pnp') {
        const ve = V(netOfPin(t, 0));
        const vb = V(netOfPin(t, 1));
        const nextOn = (ve - vb) > 0.7;
        if (txState.get(t.id) !== nextOn) { txState.set(t.id, nextOn); changed = true; }
      } else if (t.type === 'mosfet-n') {
        const vs = V(netOfPin(t, 0));
        const vg = V(netOfPin(t, 1));
        const nextOn = (vg - vs) > 2.5;
        if (txState.get(t.id) !== nextOn) { txState.set(t.id, nextOn); changed = true; }
      }
    }
    if (!changed) break;
  }

  result.nodeV = nodeV;
  result.elementI = elementI;

  // LED/diode evaluation (post-solve approximate)
  for (const c of diodes) {
    const def = COMP_DEFS[c.type];
    if (!def) continue;
    const aNet = netOfPin(c, 0);
    const bNet = netOfPin(c, 1);
    const va = result.nodeV.get(aNet) ?? 0;
    const vb = result.nodeV.get(bNet) ?? 0;
    const v = va - vb;
    if (def.emissive) {
      const vf = def.vF ?? 2.0;
      const ron = 10;
      const currentA = v > vf ? (v - vf) / ron : 0;
      const brightness = Math.max(0, Math.min(1, currentA / 0.02));
      const burned = currentA > (def.maxI ?? 0.025);
      const powered = simRunning && currentA > 0;
      result.ledStates.set(c.id, { powered, brightness, currentA, burned });
      if (burned) {
        result.issues.push({ severity: 'warn', message: `LED overcurrent: ${(currentA * 1000).toFixed(1)}mA`, target: { kind: 'component', id: c.id } });
        result.score -= 5;
      }
    } else if (c.type === 'zener') {
      const zV = Number.isFinite(def.zV) ? def.zV : parseVolts(c.value);
      if (Number.isFinite(zV) && (-v) > zV + 0.2) {
        result.issues.push({ severity: 'info', message: `Zener clamping (~${zV}V)`, target: { kind: 'component', id: c.id } });
      }
    } else if (c.type === 'diode') {
      if (v < -0.2) {
        result.issues.push({ severity: 'info', message: 'Diode reverse-biased', target: { kind: 'component', id: c.id } });
      }
    }
  }

  // 555/LM358: basic behavioral hints
  for (const ic of ics) {
    if (ic.type === 'ic555') {
      result.issues.push({ severity: 'info', message: '555: behavioral sim is simplified (DC only).', target: { kind: 'component', id: ic.id } });
    } else if (ic.type === 'lm358') {
      result.issues.push({ severity: 'info', message: 'LM358: behavioral sim is simplified (no closed-loop solving).', target: { kind: 'component', id: ic.id } });
    }
  }

  // Floating component warning
  if (ws.length > 0) {
    const connected = new Set();
    ws.forEach((w) => {
      connected.add(nodeIdOfHole(w.a));
      connected.add(nodeIdOfHole(w.b));
    });
    let floating = 0;
    for (const c of compsWithPins) {
      if (!c.pinsAbs?.length) continue;
      const any = c.pinsAbs.some((p) => connected.has(nodeIdOfHole(p)));
      if (!any) floating++;
    }
    if (floating > 0) {
      result.issues.push({ severity: 'warn', message: `${floating} component(s) not connected by any wire.` });
      result.score -= Math.min(25, floating * 3);
    }
  }

  result.score = Math.max(0, Math.min(100, result.score));
  return { result, comps: compsWithPins, wires: ws, ground, ds, netIdOfHole };
}

