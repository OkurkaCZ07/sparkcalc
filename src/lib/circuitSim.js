/**
 * SparkCalc Circuit Simulation Engine
 * - Breadboard connectivity model (rows connected internally)
 * - Circuit path tracing from power source
 * - Component validation and error detection
 * - Current/voltage estimation for visual simulation
 */

// ─── Breadboard Model ───
// Standard breadboard: 63 columns (a-j across, 1-63 down)
// Rows a-e connected internally (top half)
// Rows f-j connected internally (bottom half)  
// Power rails: + and - on top and bottom edges
export const BB = {
  COLS: 30,        // number of column groups
  TOP_ROWS: 5,     // rows a-e (0-4)
  BOT_ROWS: 5,     // rows f-j (5-9)
  GAP_ROW: -1,     // center channel (between row 4 and 5)
  TOTAL_ROWS: 10,
};

// Get the electrical "net" (connected group) for a hole position
// On a real breadboard, all holes in the same column on the same side of the channel are connected
export function getNet(col, row) {
  if (row < 5) return `top-${col}`;   // top half: rows 0-4 in same column are connected
  if (row >= 5) return `bot-${col}`;  // bottom half: rows 5-9 in same column are connected
  return `isolated-${col}-${row}`;
}

// Component definitions with pin offsets (relative to placement position)
export const COMP_DEFS = {
  'resistor':     { name:'Resistor',        cat:'passive', color:'#c9935a', pins:[{dx:0,dy:0},{dx:4,dy:0}], defaultVal:'10kΩ', symbol:'R' },
  'resistor-sm':  { name:'Small Resistor',  cat:'passive', color:'#c9935a', pins:[{dx:0,dy:0},{dx:2,dy:0}], defaultVal:'220Ω', symbol:'R' },
  'capacitor':    { name:'Ceramic Cap',     cat:'passive', color:'#2563eb', pins:[{dx:0,dy:0},{dx:1,dy:0}], defaultVal:'100nF', symbol:'C' },
  'cap-elec':     { name:'Electrolytic',    cat:'passive', color:'#1e40af', pins:[{dx:0,dy:0},{dx:1,dy:0}], defaultVal:'100µF', symbol:'C+', polar:true },
  'led-red':      { name:'LED Red',         cat:'led',     color:'#ef4444', pins:[{dx:0,dy:0},{dx:1,dy:0}], defaultVal:'2V 20mA', vF:2.0, maxI:0.025, polar:true, emissive:true },
  'led-green':    { name:'LED Green',       cat:'led',     color:'#22c55e', pins:[{dx:0,dy:0},{dx:1,dy:0}], defaultVal:'2.2V 20mA', vF:2.2, maxI:0.025, polar:true, emissive:true },
  'led-blue':     { name:'LED Blue',        cat:'led',     color:'#3b82f6', pins:[{dx:0,dy:0},{dx:1,dy:0}], defaultVal:'3.2V 20mA', vF:3.2, maxI:0.025, polar:true, emissive:true },
  'led-yellow':   { name:'LED Yellow',      cat:'led',     color:'#eab308', pins:[{dx:0,dy:0},{dx:1,dy:0}], defaultVal:'2.1V 20mA', vF:2.1, maxI:0.025, polar:true, emissive:true },
  'led-white':    { name:'LED White',       cat:'led',     color:'#e5e5e5', pins:[{dx:0,dy:0},{dx:1,dy:0}], defaultVal:'3.4V 20mA', vF:3.4, maxI:0.025, polar:true, emissive:true },
  'diode':        { name:'Diode 1N4148',    cat:'active',  color:'#f97316', pins:[{dx:0,dy:0},{dx:2,dy:0}], defaultVal:'1N4148', polar:true },
  'npn':          { name:'NPN 2N2222',      cat:'active',  color:'#a855f7', pins:[{dx:0,dy:0},{dx:1,dy:0},{dx:2,dy:0}], defaultVal:'2N2222', pinLabels:['E','B','C'] },
  'mosfet-n':     { name:'N-MOSFET',        cat:'active',  color:'#ef4444', pins:[{dx:0,dy:0},{dx:1,dy:0},{dx:2,dy:0}], defaultVal:'IRFZ44N', pinLabels:['S','G','D'] },
  'ic555':        { name:'555 Timer',       cat:'ic',      color:'#ec4899', pins:[{dx:0,dy:0},{dx:1,dy:0},{dx:2,dy:0},{dx:3,dy:0},{dx:0,dy:6},{dx:1,dy:6},{dx:2,dy:6},{dx:3,dy:6}], defaultVal:'NE555', pinLabels:['GND','TRIG','OUT','RST','VCC','DIS','THR','CV'], crossesChannel:true },
  'battery':      { name:'9V Battery',      cat:'power',   color:'#16a34a', pins:[{dx:0,dy:0},{dx:2,dy:0}], defaultVal:'9V', voltage:9, isSource:true, pinLabels:['+','−'] },
  'dc5v':         { name:'5V DC Supply',    cat:'power',   color:'#ff8c42', pins:[{dx:0,dy:0},{dx:2,dy:0}], defaultVal:'5V', voltage:5, isSource:true, pinLabels:['+','−'] },
  'button':       { name:'Push Button',     cat:'switch',  color:'#94a3b8', pins:[{dx:0,dy:0},{dx:0,dy:6}], defaultVal:'Momentary', crossesChannel:true, isClosed:false },
  'switch':       { name:'Toggle Switch',   cat:'switch',  color:'#64748b', pins:[{dx:0,dy:0},{dx:2,dy:0}], defaultVal:'SPST', isClosed:true },
  'pot':          { name:'Potentiometer',   cat:'passive', color:'#f59e0b', pins:[{dx:0,dy:0},{dx:1,dy:0},{dx:2,dy:0}], defaultVal:'10kΩ', pinLabels:['1','W','2'] },
  'buzzer':       { name:'Buzzer',          cat:'output',  color:'#22c55e', pins:[{dx:0,dy:0},{dx:1,dy:0}], defaultVal:'5V Active', polar:true },
  'motor':        { name:'DC Motor',        cat:'output',  color:'#3b82f6', pins:[{dx:0,dy:0},{dx:2,dy:0}], defaultVal:'6V DC' },
};

export const CATEGORIES = [
  { id:'passive', name:'Passive', icon:'▮' },
  { id:'led', name:'LEDs', icon:'◉' },
  { id:'active', name:'Semiconductors', icon:'⊳' },
  { id:'ic', name:'ICs', icon:'■' },
  { id:'power', name:'Power', icon:'⚡' },
  { id:'switch', name:'Switches', icon:'⊡' },
  { id:'output', name:'Output', icon:'♪' },
];

// ─── Parse resistance value ───
function parseR(val) {
  if (!val) return 0;
  const s = val.toString().toLowerCase().replace(/[ωΩohm\s]/g, '');
  if (s.includes('m') && !s.includes('ma')) return parseFloat(s) * 1e6;
  if (s.includes('k')) return parseFloat(s) * 1e3;
  return parseFloat(s) || 0;
}

// ─── Build connectivity graph ───
export function buildNetlist(components, wires) {
  // Each hole belongs to a "net" - breadboard rows + wire connections
  const nets = new Map(); // net_id -> Set of {col, row} positions

  // Step 1: Breadboard internal connections
  // Holes in same column, same side of channel are connected
  // We track which nets exist based on placed component pins and wire endpoints

  const allPositions = new Set();
  
  // Collect all pin positions
  components.forEach(comp => {
    const def = COMP_DEFS[comp.type];
    if (!def) return;
    def.pins.forEach(pin => {
      const col = comp.col + pin.dx;
      const row = comp.row + pin.dy;
      allPositions.add(`${col},${row}`);
    });
  });
  
  // Collect wire endpoints
  wires.forEach(w => {
    allPositions.add(`${w.sc},${w.sr}`);
    allPositions.add(`${w.ec},${w.er}`);
  });

  // Step 2: Union-Find for net merging
  const parent = {};
  const find = (x) => { if (parent[x] !== x) parent[x] = find(parent[x]); return parent[x]; };
  const union = (a, b) => { parent[find(a)] = find(b); };

  allPositions.forEach(pos => { parent[pos] = pos; });

  // Breadboard rows: same column, same side → connected
  allPositions.forEach(posA => {
    const [colA, rowA] = posA.split(',').map(Number);
    allPositions.forEach(posB => {
      const [colB, rowB] = posB.split(',').map(Number);
      if (posA === posB) return;
      if (colA === colB) {
        const sameHalf = (rowA < 5 && rowB < 5) || (rowA >= 5 && rowB >= 5);
        if (sameHalf) union(posA, posB);
      }
    });
  });

  // Wires connect their endpoints
  wires.forEach(w => {
    const a = `${w.sc},${w.sr}`;
    const b = `${w.ec},${w.er}`;
    if (parent[a] !== undefined && parent[b] !== undefined) {
      union(a, b);
    }
  });

  return { find, parent, allPositions };
}

// ─── Simulate circuit ───
export function simulate(components, wires) {
  const result = {
    errors: [],
    warnings: [],
    info: [],
    score: 100,
    ledStates: {}, // comp_index -> { brightness: 0-1, current: number }
    powered: new Set(), // net IDs that have power
  };

  if (components.length === 0) {
    result.info.push('Place components on the breadboard to start.');
    result.score = 0;
    return result;
  }

  const { find } = buildNetlist(components, wires);

  // Find power sources
  const sources = [];
  components.forEach((comp, idx) => {
    const def = COMP_DEFS[comp.type];
    if (def?.isSource) sources.push({ comp, idx, def });
  });

  // ─── Checks ───
  
  // No power source
  if (sources.length === 0) {
    result.errors.push('🔴 No power source! Add a battery or DC supply.');
    result.score -= 30;
  }

  // LED checks
  const leds = [];
  const resistors = [];
  components.forEach((comp, idx) => {
    const def = COMP_DEFS[comp.type];
    if (def?.emissive) leds.push({ comp, idx, def });
    if (comp.type.startsWith('resistor')) resistors.push({ comp, idx, def });
  });

  if (leds.length > 0 && resistors.length === 0) {
    result.errors.push(`🔴 ${leds.length} LED(s) without current-limiting resistor! They will burn out.`);
    result.score -= 20;
  }

  // Check wire connections
  if (wires.length === 0 && components.length > 1) {
    result.errors.push('🔴 No wires! Components must be connected to form a circuit.');
    result.score -= 25;
  }

  // Check if LEDs are connected to power (simplified path check)
  if (sources.length > 0 && leds.length > 0 && wires.length > 0) {
    const sourceComp = sources[0].comp;
    const sourceDef = sources[0].def;
    const sourcePin0 = `${sourceComp.col + sourceDef.pins[0].dx},${sourceComp.row + sourceDef.pins[0].dy}`;
    const sourcePin1 = `${sourceComp.col + sourceDef.pins[1].dx},${sourceComp.row + sourceDef.pins[1].dy}`;
    const sourceNet0 = find(sourcePin0);
    const sourceNet1 = find(sourcePin1);

    leds.forEach(({ comp, idx, def }) => {
      const pin0 = `${comp.col + def.pins[0].dx},${comp.row + def.pins[0].dy}`;
      const pin1 = `${comp.col + def.pins[1].dx},${comp.row + def.pins[1].dy}`;
      const net0 = find(pin0);
      const net1 = find(pin1);

      // LED is powered if one pin connects to source + and other to source - (through some path)
      const connectedToPlus = (net0 === sourceNet0 || net1 === sourceNet0);
      const connectedToMinus = (net0 === sourceNet1 || net1 === sourceNet1);

      if (connectedToPlus && connectedToMinus) {
        // Check if there's a resistor in the path
        let hasResistorInPath = false;
        resistors.forEach(({ comp: rc, def: rd }) => {
          const rpin0 = `${rc.col + rd.pins[0].dx},${rc.row + rd.pins[0].dy}`;
          const rpin1 = `${rc.col + rd.pins[1].dx},${rc.row + rd.pins[1].dy}`;
          const rnet0 = find(rpin0);
          const rnet1 = find(rpin1);
          // Resistor is in path if it bridges between two different nets that connect to the LED circuit
          if (rnet0 !== rnet1) hasResistorInPath = true;
        });

        const voltage = sourceDef.voltage || 5;
        const rVal = resistors.length > 0 ? parseR(resistors[0].comp.value) : 0;
        const vDrop = def.vF || 2;
        const current = rVal > 0 ? (voltage - vDrop) / rVal : (hasResistorInPath ? 0.02 : 1.0);

        const brightness = Math.min(1, Math.max(0, current / 0.02));
        result.ledStates[idx] = { brightness, current, powered: true };

        if (!hasResistorInPath && resistors.length === 0) {
          result.warnings.push(`🟡 LED ${def.name} has no series resistor — excessive current (${(current*1000).toFixed(0)}mA)!`);
          result.score -= 10;
        } else if (current > (def.maxI || 0.025)) {
          result.warnings.push(`🟡 LED current (${(current*1000).toFixed(1)}mA) exceeds max rating. Increase resistor value.`);
          result.score -= 5;
        }
      } else {
        result.ledStates[idx] = { brightness: 0, current: 0, powered: false };
        if (wires.length > 2) {
          result.info.push(`💡 LED ${def.name} is not connected to the power source.`);
        }
      }
    });
  }

  // Check for floating components
  if (wires.length > 0) {
    const connectedPositions = new Set();
    wires.forEach(w => {
      connectedPositions.add(`${w.sc},${w.sr}`);
      connectedPositions.add(`${w.ec},${w.er}`);
    });
    
    let floating = 0;
    components.forEach(comp => {
      const def = COMP_DEFS[comp.type];
      if (!def) return;
      const anyPinConnected = def.pins.some(p => connectedPositions.has(`${comp.col + p.dx},${comp.row + p.dy}`));
      if (!anyPinConnected) floating++;
    });
    
    if (floating > 0) {
      result.warnings.push(`🟡 ${floating} component(s) not connected by any wire.`);
      result.score -= floating * 5;
    }
  }

  // 555 timer checks
  const has555 = components.some(c => c.type === 'ic555');
  if (has555) {
    if (resistors.length < 2) result.info.push('💡 555 timer needs 2 resistors (R1, R2) for astable mode.');
    const hasCap = components.some(c => c.type === 'capacitor' || c.type === 'cap-elec');
    if (!hasCap) result.info.push('💡 555 timer needs a timing capacitor.');
    result.info.push('💡 Add 100nF decoupling cap between VCC and GND pins of 555.');
  }

  // Motor without flyback diode
  const hasMotor = components.some(c => c.type === 'motor');
  const hasDiode = components.some(c => c.type === 'diode');
  if (hasMotor && !hasDiode) {
    result.warnings.push('🟡 DC motor without flyback diode can damage transistors when switched off.');
    result.score -= 10;
  }

  // MOSFET gate check
  const hasMosfet = components.some(c => c.type === 'mosfet-n');
  if (hasMosfet) result.info.push('💡 Add 10kΩ pull-down on MOSFET gate to prevent floating.');

  result.info.push(`📊 Circuit: ${components.length} components, ${wires.length} wires.`);
  result.score = Math.max(0, Math.min(100, result.score));

  return result;
}
