/**
 * SparkCalc Circuit Simulator
 * Rule-based circuit analysis with error detection
 */

// Component electrical properties
const COMP_PROPS = {
  'resistor': { type: 'passive', hasPolarity: false, maxVoltage: 50, parseValue: (v) => parseResistance(v) },
  'capacitor': { type: 'passive', hasPolarity: false, maxVoltage: 50 },
  'cap-elec': { type: 'passive', hasPolarity: true, maxVoltage: 25 },
  'led-red': { type: 'active', hasPolarity: true, vForward: 2.0, maxCurrent: 0.02, needsResistor: true },
  'led-green': { type: 'active', hasPolarity: true, vForward: 2.2, maxCurrent: 0.02, needsResistor: true },
  'led-blue': { type: 'active', hasPolarity: true, vForward: 3.2, maxCurrent: 0.02, needsResistor: true },
  'led-white': { type: 'active', hasPolarity: true, vForward: 3.4, maxCurrent: 0.02, needsResistor: true },
  'led-yellow': { type: 'active', hasPolarity: true, vForward: 2.1, maxCurrent: 0.02, needsResistor: true },
  'diode': { type: 'active', hasPolarity: true, vForward: 0.7 },
  'zener': { type: 'active', hasPolarity: true, vForward: 5.1 },
  'npn': { type: 'active', pins: 3, pinNames: ['C', 'B', 'E'] },
  'pnp': { type: 'active', pins: 3, pinNames: ['C', 'B', 'E'] },
  'mosfet-n': { type: 'active', pins: 3, pinNames: ['D', 'G', 'S'] },
  'mosfet-p': { type: 'active', pins: 3, pinNames: ['D', 'G', 'S'] },
  'ic555': { type: 'ic', pins: 8, pinNames: ['GND','TRIG','OUT','RST','CV','THR','DIS','VCC'] },
  'ic-opamp': { type: 'ic', pins: 5, pinNames: ['OUT','-IN','+IN','V-','V+'] },
  'battery': { type: 'source', voltage: 9, hasPolarity: true },
  'dc-supply': { type: 'source', voltage: 5, hasPolarity: true },
  'usb-power': { type: 'source', voltage: 5, hasPolarity: true },
  'button': { type: 'switch', hasPolarity: false },
  'switch': { type: 'switch', hasPolarity: false },
  'pot': { type: 'passive', pins: 3, hasPolarity: false },
  'inductor': { type: 'passive', hasPolarity: false },
  'fuse': { type: 'passive', hasPolarity: false },
  'buzzer': { type: 'active', hasPolarity: true },
  'motor-dc': { type: 'active', hasPolarity: true },
  'relay': { type: 'active', pins: 4, hasPolarity: true },
  'seven-seg': { type: 'active', pins: 10, hasPolarity: true },
  'photo-res': { type: 'passive', hasPolarity: false },
};

function parseResistance(val) {
  if (!val) return 0;
  const s = val.toString().toLowerCase().replace('ω', '').replace('ohm', '').trim();
  if (s.includes('m')) return parseFloat(s) * 1e6;
  if (s.includes('k')) return parseFloat(s) * 1e3;
  return parseFloat(s) || 0;
}

/**
 * Analyze a circuit and return errors, warnings, and info
 */
export function analyzeCircuit(components, wires) {
  const results = { errors: [], warnings: [], info: [], score: 100 };

  if (components.length === 0) {
    results.info.push({ msg: 'Place components on the breadboard to start building your circuit.' });
    results.score = 0;
    return results;
  }

  // ─── Check 1: Power source ───
  const sources = components.filter(c => {
    const props = COMP_PROPS[c.type];
    return props?.type === 'source';
  });
  if (sources.length === 0) {
    results.errors.push({ msg: 'No power source found! Add a battery or DC supply to power your circuit.', severity: 'high' });
    results.score -= 30;
  } else if (sources.length > 1) {
    results.warnings.push({ msg: `Multiple power sources (${sources.length}) detected. Make sure they are properly connected and voltage levels match.` });
    results.score -= 5;
  }

  // ─── Check 2: LEDs without resistors ───
  const leds = components.filter(c => c.type.startsWith('led-'));
  const resistors = components.filter(c => c.type === 'resistor');
  if (leds.length > 0 && resistors.length === 0) {
    results.errors.push({ msg: `${leds.length} LED(s) found but no current-limiting resistor! LEDs will burn out without a series resistor.`, severity: 'high' });
    results.score -= 20;
  } else if (leds.length > resistors.length) {
    results.warnings.push({ msg: `${leds.length} LEDs but only ${resistors.length} resistor(s). Each LED typically needs its own series resistor (unless in series chain).` });
    results.score -= 10;
  }

  // ─── Check 3: LED resistor value check ───
  if (leds.length > 0 && resistors.length > 0 && sources.length > 0) {
    const supplyV = sources[0].type === 'battery' ? 9 : 5;
    leds.forEach(led => {
      const props = COMP_PROPS[led.type];
      if (props) {
        const vDrop = props.vForward || 2;
        const idealR = (supplyV - vDrop) / 0.02; // 20mA
        const minR = (supplyV - vDrop) / 0.03; // 30mA absolute max
        
        resistors.forEach(r => {
          const rVal = parseResistance(r.value);
          if (rVal > 0 && rVal < minR) {
            results.warnings.push({ msg: `Resistor ${r.value} may be too low for ${led.type.replace('led-', '')} LED. Minimum recommended: ${Math.round(idealR)}Ω for 20mA with ${supplyV}V supply.` });
            results.score -= 5;
          }
        });
      }
    });
  }

  // ─── Check 4: Component connections (wires) ───
  if (wires.length === 0 && components.length > 1) {
    results.errors.push({ msg: 'No wires found! Components need to be connected with wires to form a circuit.', severity: 'high' });
    results.score -= 25;
  }

  // ─── Check 5: Floating components ───
  const connectedPositions = new Set();
  wires.forEach(w => {
    connectedPositions.add(`${w.startCol},${w.startRow}`);
    connectedPositions.add(`${w.endCol},${w.endRow}`);
  });

  const floatingComps = components.filter(c => {
    const pos = `${c.col},${c.row}`;
    return !connectedPositions.has(pos) && wires.length > 0;
  });

  if (floatingComps.length > 0 && wires.length > 0) {
    results.warnings.push({ msg: `${floatingComps.length} component(s) appear unconnected (no wires attached). Check your connections.` });
    results.score -= floatingComps.length * 3;
  }

  // ─── Check 6: Short circuit detection ───
  if (sources.length > 0 && wires.length > 0) {
    // Simple check: if power source pins are directly connected with no load
    // This is a simplified check
    const sourceComp = sources[0];
    const directWires = wires.filter(w =>
      (w.startCol === sourceComp.col && w.startRow === sourceComp.row) ||
      (w.endCol === sourceComp.col && w.endRow === sourceComp.row)
    );
    
    if (directWires.length >= 2 && components.length <= 2) {
      results.errors.push({ msg: 'Possible short circuit! Power source terminals may be directly connected without a load.', severity: 'critical' });
      results.score -= 30;
    }
  }

  // ─── Check 7: 555 Timer checks ───
  const ic555s = components.filter(c => c.type === 'ic555');
  if (ic555s.length > 0) {
    const hasCapForTiming = components.some(c => c.type === 'capacitor' || c.type === 'cap-elec');
    if (!hasCapForTiming) {
      results.warnings.push({ msg: '555 Timer found but no timing capacitor. The 555 needs an RC timing network (resistors + capacitor) to oscillate.' });
      results.score -= 10;
    }
    if (resistors.length < 2) {
      results.warnings.push({ msg: '555 Timer in astable mode needs at least 2 resistors (R1 and R2) for the timing network.' });
      results.score -= 10;
    }
    // Check for decoupling cap
    results.info.push({ msg: 'Tip: Add a 100nF decoupling capacitor between VCC (pin 8) and GND (pin 1) for stable 555 operation.' });
  }

  // ─── Check 8: Op-amp checks ───
  const opamps = components.filter(c => c.type === 'ic-opamp');
  if (opamps.length > 0 && sources.length > 0) {
    const hasDualSupply = sources.length >= 2;
    if (!hasDualSupply) {
      results.info.push({ msg: 'Op-amp with single supply: Make sure to bias the non-inverting input to half the supply voltage for proper operation.' });
    }
  }

  // ─── Check 9: MOSFET gate resistor ───
  const mosfets = components.filter(c => c.type.startsWith('mosfet'));
  if (mosfets.length > 0) {
    results.info.push({ msg: 'MOSFET tip: Consider adding a 10kΩ pull-down resistor on the gate to prevent floating gate issues.' });
  }

  // ─── Check 10: Motor/relay flyback diode ───
  const inductiveLoads = components.filter(c => c.type === 'motor-dc' || c.type === 'relay');
  const diodes = components.filter(c => c.type === 'diode');
  if (inductiveLoads.length > 0 && diodes.length === 0) {
    results.warnings.push({ msg: `Inductive load (motor/relay) found without a flyback diode! This can damage transistors/MOSFETs when the load is switched off.` });
    results.score -= 15;
  }

  // ─── Check 11: Capacitor polarity ───
  const elecCaps = components.filter(c => c.type === 'cap-elec');
  if (elecCaps.length > 0) {
    results.info.push({ msg: 'Electrolytic capacitors are polarized — make sure the positive lead goes to the higher voltage side.' });
  }

  // ─── Check 12: Breadboard row connections ───
  // On a real breadboard, holes in the same row (same side of channel) are connected
  results.info.push({ msg: `Circuit has ${components.length} components and ${wires.length} wire connections.` });

  // Clamp score
  results.score = Math.max(0, Math.min(100, results.score));

  return results;
}
