export function formatResistance(ohms) {
  if (ohms >= 1e6) return `${(ohms / 1e6).toFixed(ohms % 1e6 === 0 ? 0 : 1)}MΩ`;
  if (ohms >= 1e3) return `${(ohms / 1e3).toFixed(ohms % 1e3 === 0 ? 0 : 1)}kΩ`;
  return `${ohms}Ω`;
}

export function formatValue(val, unit) {
  if (val === 0) return `0 ${unit}`;
  const abs = Math.abs(val);
  if (abs >= 1e9) return `${(val / 1e9).toFixed(2)} G${unit}`;
  if (abs >= 1e6) return `${(val / 1e6).toFixed(2)} M${unit}`;
  if (abs >= 1e3) return `${(val / 1e3).toFixed(2)} k${unit}`;
  if (abs >= 1) return `${val.toFixed(2)} ${unit}`;
  if (abs >= 1e-3) return `${(val * 1e3).toFixed(2)} m${unit}`;
  if (abs >= 1e-6) return `${(val * 1e6).toFixed(2)} µ${unit}`;
  if (abs >= 1e-9) return `${(val * 1e9).toFixed(2)} n${unit}`;
  return `${(val * 1e12).toFixed(2)} p${unit}`;
}

const E24 = [1.0,1.1,1.2,1.3,1.5,1.6,1.8,2.0,2.2,2.4,2.7,3.0,3.3,3.6,3.9,4.3,4.7,5.1,5.6,6.2,6.8,7.5,8.2,9.1];

export function nearestStandardResistor(ohms) {
  if (ohms <= 0) return 0;
  const decade = Math.pow(10, Math.floor(Math.log10(ohms)));
  const normalized = ohms / decade;
  let closest = E24[0], minDiff = Math.abs(normalized - E24[0]);
  for (const val of E24) { const diff = Math.abs(normalized - val); if (diff < minDiff) { minDiff = diff; closest = val; } }
  if (Math.abs(normalized - 10) < minDiff) return 10 * decade;
  return closest * decade;
}

export const BAND_COLORS = [
  { name: 'Black', value: 0, mult: 1, hex: '#1a1a1a' },
  { name: 'Brown', value: 1, mult: 10, hex: '#8B4513' },
  { name: 'Red', value: 2, mult: 100, hex: '#DC2626' },
  { name: 'Orange', value: 3, mult: 1000, hex: '#EA580C' },
  { name: 'Yellow', value: 4, mult: 10000, hex: '#EAB308' },
  { name: 'Green', value: 5, mult: 100000, hex: '#16A34A' },
  { name: 'Blue', value: 6, mult: 1000000, hex: '#2563EB' },
  { name: 'Violet', value: 7, mult: 10000000, hex: '#7C3AED' },
  { name: 'Grey', value: 8, mult: 100000000, hex: '#6B7280' },
  { name: 'White', value: 9, mult: 1000000000, hex: '#E5E7EB' },
];

export const CALCULATORS = [
  { id: 'voltage-divider', name: 'Voltage Divider', icon: '⚡', desc: 'Calculate output voltage, R1 or R2 in a resistive voltage divider circuit.', shortDesc: 'Calculate R1, R2 or Vout' },
  { id: 'led-resistor', name: 'LED Resistor', icon: '💡', desc: 'Find the right series resistor value and wattage for driving LEDs.', shortDesc: 'Series resistor for LEDs' },
  { id: 'ohms-law', name: "Ohm's Law", icon: 'Ω', desc: "Calculate voltage, current, resistance and power using Ohm's law.", shortDesc: 'V, I, R, P calculator' },
  { id: 'rc-filter', name: 'RC Filter', icon: '〰️', desc: 'Calculate cutoff frequency and time constant for RC filters.', shortDesc: 'Low/high pass cutoff' },
  { id: 'resistor-code', name: 'Resistor Code', icon: '🎨', desc: 'Decode 4-band resistor color codes to find resistance value.', shortDesc: 'Color band decoder' },
  { id: 'mosfet-power', name: 'MOSFET Power', icon: '🔥', desc: 'Calculate MOSFET power dissipation and junction temperature.', shortDesc: 'Power dissipation & thermal' },
  { id: 'lc-resonance', name: 'LC Resonance', icon: '🔄', desc: 'Calculate resonant frequency for LC circuits and tank circuits.', shortDesc: 'Resonant frequency calc' },
  { id: '555-timer', name: '555 Timer', icon: '⏱️', desc: 'Calculate frequency and duty cycle for 555 timer astable mode.', shortDesc: 'Astable mode calculator' },
  { id: 'pcb-trace', name: 'PCB Trace Width', icon: '📐', desc: 'Calculate minimum PCB trace width for a given current.', shortDesc: 'Current capacity calc' },
  { id: 'battery-life', name: 'Battery Life', icon: '🔋', desc: 'Estimate battery runtime from capacity and load current.', shortDesc: 'Runtime estimator' },
];
