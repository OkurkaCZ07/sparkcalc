import { BB, holeKey, mainHole, inBounds } from './breadboard';
import { COMP_DEFS as LEGACY_COMP_DEFS } from '../circuitSim';

export const COMP_DEFS = LEGACY_COMP_DEFS;

class DSU {
  constructor() {
    this.p = new Map();
    this.r = new Map();
  }
  make(x) {
    if (this.p.has(x)) return;
    this.p.set(x, x);
    this.r.set(x, 0);
  }
  find(x) {
    if (!this.p.has(x)) this.make(x);
    const px = this.p.get(x);
    if (px !== x) {
      const root = this.find(px);
      this.p.set(x, root);
      return root;
    }
    return x;
  }
  union(a, b) {
    const ra = this.find(a);
    const rb = this.find(b);
    if (ra === rb) return ra;
    const rka = this.r.get(ra) || 0;
    const rkb = this.r.get(rb) || 0;
    if (rka < rkb) {
      this.p.set(ra, rb);
      return rb;
    }
    if (rka > rkb) {
      this.p.set(rb, ra);
      return ra;
    }
    this.p.set(rb, ra);
    this.r.set(ra, rka + 1);
    return ra;
  }
}

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

function computePinsAbs(anchor, rot, def) {
  if (!anchor || anchor.kind !== 'main' || !def?.pins) return [];
  const rr = ((rot || 0) % 360 + 360) % 360;
  const rotate = (dx, dy) => {
    if (rr === 0) return { dx, dy };
    if (rr === 90) return { dx: -dy, dy: dx };
    if (rr === 180) return { dx: -dx, dy: -dy };
    if (rr === 270) return { dx: dy, dy: -dx };
    return { dx, dy };
  };
  return def.pins.map((p) => {
    const r = rotate(p.dx, p.dy);
    return mainHole(anchor.col + r.dx, anchor.row + r.dy);
  });
}

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

function addIssue(issues, severity, message, target) {
  issues.push(target ? { severity, message, target } : { severity, message });
}

export function simulate(components, wires, { simRunning = false } = {}) {
  const comps = (components || []).map((c) => ({ ...c }));
  const ws = (wires || []).map((w) => ({ ...w }));
  const issues = [];
  let score = 100;
  const ledStates = new Map();
  const nodeV = new Map();

  const compsWithPins = comps.map((c) => {
    const def = COMP_DEFS[c.type];
    const pinsAbs = def ? computePinsAbs(c.anchor, c.rot, def).filter(inBounds) : [];
    return { ...c, pinsAbs };
  });

  // Union-Find connectivity: board columns/halves, rails, and wires.
  const ds = new DSU();
  const nodeIdOfHole = (hole) => {
    if (!hole) return '';
    if (hole.kind === 'rail') return `R:${hole.rail}`;
    const half = hole.row < BB.TOP_ROWS ? 'top' : 'bot';
    return `H:${hole.col}:${half}`;
  };

  const netIdOfHole = (hole) => ds.find(nodeIdOfHole(hole));

  // Initialize all main-board hole groups and rails.
  for (let col = 0; col < BB.COLS; col++) {
    const topNode = `H:${col}:top`;
    const botNode = `H:${col}:bot`;
    ds.make(topNode);
    ds.make(botNode);
  }
  for (const rail of BB.RAILS) ds.make(`R:${rail}`);

  // Wires connect endpoints; use holeKey to skip duplicate wire entries.
  const seenWirePairs = new Set();
  for (const w of ws) {
    if (!w?.a || !w?.b) continue;
    const ka = holeKey(w.a);
    const kb = holeKey(w.b);
    const pair = ka < kb ? `${ka}|${kb}` : `${kb}|${ka}`;
    if (seenWirePairs.has(pair)) continue;
    seenWirePairs.add(pair);
    ds.union(nodeIdOfHole(w.a), nodeIdOfHole(w.b));
  }

  // Component pins touching same physical hole are naturally same net via node IDs above.
  const compPinsNets = new Map();
  for (const c of compsWithPins) {
    compPinsNets.set(c.id, (c.pinsAbs || []).map((h) => netIdOfHole(h)));
  }

  const sources = compsWithPins.filter((c) => COMP_DEFS[c.type]?.isSource);
  const leds = compsWithPins.filter((c) => COMP_DEFS[c.type]?.emissive);
  const resistors = compsWithPins.filter((c) => c.type?.startsWith('resistor'));

  if (sources.length === 0) {
    addIssue(issues, 'error', 'No power source! Add a battery or DC supply.');
    score -= 30;
  }

  // Detect short on each source (+ and - on same net)
  for (const s of sources) {
    const nets = compPinsNets.get(s.id) || [];
    if (nets.length >= 2 && nets[0] && nets[1] && nets[0] === nets[1]) {
      addIssue(issues, 'error', 'Short circuit: source + and - are directly connected.', { kind: 'component', id: s.id });
      score -= 30;
    }
  }

  const primarySource = sources[0];
  let plusNet = null;
  let minusNet = null;
  let sourceV = 5;
  if (primarySource) {
    const def = COMP_DEFS[primarySource.type] || {};
    const nets = compPinsNets.get(primarySource.id) || [];
    plusNet = nets[0] || null;
    minusNet = nets[1] || null;
    const parsed = parseVolts(primarySource.value);
    sourceV = Number.isFinite(parsed) ? parsed : (Number.isFinite(def.voltage) ? def.voltage : 5);
  }

  // Approximate node voltages for meter: + net => sourceV, - net => 0, others NaN.
  const allNets = new Set();
  for (const w of ws) {
    if (w?.a) allNets.add(netIdOfHole(w.a));
    if (w?.b) allNets.add(netIdOfHole(w.b));
  }
  for (const c of compsWithPins) {
    for (const p of c.pinsAbs || []) allNets.add(netIdOfHole(p));
  }
  for (const n of allNets) nodeV.set(n, Number.NaN);
  if (plusNet) nodeV.set(plusNet, sourceV);
  if (minusNet) nodeV.set(minusNet, 0);

  if (leds.length > 0 && resistors.length === 0) {
    addIssue(issues, 'error', `${leds.length} LED(s) without current-limiting resistor!`);
    score -= 20;
  }

  const resistorNets = resistors.map((r) => {
    const nets = compPinsNets.get(r.id) || [];
    return { id: r.id, a: nets[0], b: nets[1], r: parseOhms(r.value) };
  });

  for (const led of leds) {
    const def = COMP_DEFS[led.type] || {};
    const nets = compPinsNets.get(led.id) || [];
    const a = nets[0];
    const b = nets[1];
    const touchesPlus = plusNet && (a === plusNet || b === plusNet);
    const touchesMinus = minusNet && (a === minusNet || b === minusNet);
    const connected = Boolean(touchesPlus && touchesMinus);

    let current = 0;
    if (connected) {
      const vf = Number.isFinite(def.vF) ? def.vF : 2.0;
      const candidateRs = resistorNets
        .filter((r) => (r.a === plusNet || r.b === plusNet || r.a === minusNet || r.b === minusNet))
        .map((r) => r.r)
        .filter((r) => Number.isFinite(r) && r > 0);
      const seriesR = candidateRs.length ? candidateRs[0] : NaN;
      if (Number.isFinite(seriesR) && seriesR > 0) current = Math.max(0, (sourceV - vf) / seriesR);
      else current = Math.max(0, sourceV - vf) / 10; // bare LED approximation
    }

    const brightness = clamp(current / 0.02, 0, 1);
    const maxI = Number.isFinite(def.maxI) ? def.maxI : 0.025;
    const burned = current > maxI;
    const powered = Boolean(simRunning && connected && current > 0);
    ledStates.set(led.id, { powered, brightness, current, burned });

    if (connected && resistorNets.length === 0) {
      addIssue(issues, 'warn', 'LED appears powered without a valid series resistor.', { kind: 'component', id: led.id });
      score -= 10;
    }
    if (burned) {
      addIssue(issues, 'warn', `LED overcurrent (${(current * 1000).toFixed(1)}mA).`, { kind: 'component', id: led.id });
      score -= 8;
    }
  }

  // Floating components: no pin connected to any wire endpoint net.
  const wiredNets = new Set();
  for (const w of ws) {
    if (w?.a) wiredNets.add(netIdOfHole(w.a));
    if (w?.b) wiredNets.add(netIdOfHole(w.b));
  }
  let floatingCount = 0;
  for (const c of compsWithPins) {
    const nets = compPinsNets.get(c.id) || [];
    const anyWired = nets.some((n) => wiredNets.has(n));
    if (nets.length > 0 && !anyWired) floatingCount++;
  }
  if (floatingCount > 0) {
    addIssue(issues, 'warn', `${floatingCount} component(s) are floating (not connected by wires).`);
    score -= Math.min(20, floatingCount * 4);
  }

  // Educational tips
  const has555 = compsWithPins.some((c) => c.type === 'ic555');
  if (has555) {
    const rCount = resistors.length;
    const hasCap = compsWithPins.some((c) => c.type === 'capacitor' || c.type === 'cap-elec');
    if (rCount < 2) addIssue(issues, 'info', '555 tip: add R1 and R2 for astable operation.');
    if (!hasCap) addIssue(issues, 'info', '555 tip: add timing capacitor.');
    addIssue(issues, 'info', '555 tip: add 100nF decoupling cap between VCC and GND.');
  }

  const hasMosfet = compsWithPins.some((c) => c.type === 'mosfet-n');
  if (hasMosfet) addIssue(issues, 'info', 'MOSFET tip: add 10k pull-down resistor on gate.');

  const hasMotor = compsWithPins.some((c) => c.type === 'motor');
  const hasDiode = compsWithPins.some((c) => c.type === 'diode' || c.type === 'zener');
  if (hasMotor && !hasDiode) {
    addIssue(issues, 'warn', 'Motor without flyback diode may damage switching transistor.');
    score -= 10;
  }

  score = clamp(score, 0, 100);

  return {
    result: {
      score,
      issues,
      ledStates,
      nodeV,
    },
    comps: compsWithPins,
    wires: ws,
    ds,
    netIdOfHole: (hole) => (hole ? ds.find(nodeIdOfHole(hole)) : ''),
  };
}

