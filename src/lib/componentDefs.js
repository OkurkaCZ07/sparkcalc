export const DEFAULT_COMPONENT_DEFS = {
  // Passive
  'resistor':     { name: 'Resistor', cat: 'passive', color: '#c9935a', pins: [{ dx: 0, dy: 0 }, { dx: 4, dy: 0 }], defaultVal: '10kΩ' },
  'resistor-sm':  { name: 'Small Resistor', cat: 'passive', color: '#c9935a', pins: [{ dx: 0, dy: 0 }, { dx: 2, dy: 0 }], defaultVal: '220Ω' },
  'capacitor':    { name: 'Ceramic Cap', cat: 'passive', color: '#2563eb', pins: [{ dx: 0, dy: 0 }, { dx: 1, dy: 0 }], defaultVal: '100nF' },
  'cap-elec':     { name: 'Electrolytic Cap', cat: 'passive', color: '#1e40af', pins: [{ dx: 0, dy: 0 }, { dx: 1, dy: 0 }], defaultVal: '100µF', polar: true },
  'inductor':     { name: 'Inductor', cat: 'passive', color: '#7c3aed', pins: [{ dx: 0, dy: 0 }, { dx: 3, dy: 0 }], defaultVal: '10µH' },
  'pot':          { name: 'Potentiometer', cat: 'passive', color: '#f59e0b', pins: [{ dx: 0, dy: 0 }, { dx: 1, dy: 0 }, { dx: 2, dy: 0 }], defaultVal: '10kΩ' },
  'photo-res':    { name: 'Photoresistor', cat: 'passive', color: '#fbbf24', pins: [{ dx: 0, dy: 0 }, { dx: 1, dy: 0 }], defaultVal: '10kΩ' },

  // LEDs
  'led-red':      { name: 'LED Red', cat: 'led', color: '#ef4444', pins: [{ dx: 0, dy: 0 }, { dx: 1, dy: 0 }], defaultVal: '2V 20mA', vF: 2.0, maxI: 0.03, emissive: true, polar: true },
  'led-green':    { name: 'LED Green', cat: 'led', color: '#22c55e', pins: [{ dx: 0, dy: 0 }, { dx: 1, dy: 0 }], defaultVal: '2.2V 20mA', vF: 2.2, maxI: 0.03, emissive: true, polar: true },
  'led-blue':     { name: 'LED Blue', cat: 'led', color: '#3b82f6', pins: [{ dx: 0, dy: 0 }, { dx: 1, dy: 0 }], defaultVal: '3.2V 20mA', vF: 3.2, maxI: 0.03, emissive: true, polar: true },
  'led-yellow':   { name: 'LED Yellow', cat: 'led', color: '#eab308', pins: [{ dx: 0, dy: 0 }, { dx: 1, dy: 0 }], defaultVal: '2.1V 20mA', vF: 2.1, maxI: 0.03, emissive: true, polar: true },
  'led-white':    { name: 'LED White', cat: 'led', color: '#e5e5e5', pins: [{ dx: 0, dy: 0 }, { dx: 1, dy: 0 }], defaultVal: '3.4V 20mA', vF: 3.4, maxI: 0.03, emissive: true, polar: true },

  // Semiconductors
  'diode':        { name: 'Diode 1N4148', cat: 'active', color: '#f97316', pins: [{ dx: 0, dy: 0 }, { dx: 2, dy: 0 }], defaultVal: '1N4148', polar: true },
  'zener':        { name: 'Zener Diode', cat: 'active', color: '#fb7185', pins: [{ dx: 0, dy: 0 }, { dx: 2, dy: 0 }], defaultVal: '5.1V', polar: true, zV: 5.1 },
  'npn':          { name: 'NPN 2N2222', cat: 'active', color: '#a855f7', pins: [{ dx: 0, dy: 0 }, { dx: 1, dy: 0 }, { dx: 2, dy: 0 }], defaultVal: '2N2222' },
  'pnp':          { name: 'PNP 2N3906', cat: 'active', color: '#c084fc', pins: [{ dx: 0, dy: 0 }, { dx: 1, dy: 0 }, { dx: 2, dy: 0 }], defaultVal: '2N3906' },
  'mosfet-n':     { name: 'N-MOSFET IRFZ44N', cat: 'active', color: '#ef4444', pins: [{ dx: 0, dy: 0 }, { dx: 1, dy: 0 }, { dx: 2, dy: 0 }], defaultVal: 'IRFZ44N' },

  // ICs
  'ic555':        { name: '555 Timer NE555', cat: 'ic', color: '#ec4899', pins: [{ dx: 0, dy: 0 }, { dx: 1, dy: 0 }, { dx: 2, dy: 0 }, { dx: 3, dy: 0 }, { dx: 0, dy: 6 }, { dx: 1, dy: 6 }, { dx: 2, dy: 6 }, { dx: 3, dy: 6 }], defaultVal: 'NE555', crossesChannel: true },
  'ic-opamp':     { name: 'Op-Amp LM358', cat: 'ic', color: '#60a5fa', pins: [{ dx: 0, dy: 0 }, { dx: 1, dy: 0 }, { dx: 2, dy: 0 }, { dx: 3, dy: 0 }, { dx: 0, dy: 6 }, { dx: 1, dy: 6 }, { dx: 2, dy: 6 }, { dx: 3, dy: 6 }], defaultVal: 'LM358', crossesChannel: true },

  // Power
  'battery-9v':   { name: '9V Battery', cat: 'power', color: '#16a34a', pins: [{ dx: 0, dy: 0 }, { dx: 2, dy: 0 }], defaultVal: '9V', isSource: true, voltage: 9 },
  'dc-5v':        { name: '5V DC Supply', cat: 'power', color: '#ff8c42', pins: [{ dx: 0, dy: 0 }, { dx: 2, dy: 0 }], defaultVal: '5V', isSource: true, voltage: 5 },
  'dc-3v3':       { name: '3.3V DC Supply', cat: 'power', color: '#38bdf8', pins: [{ dx: 0, dy: 0 }, { dx: 2, dy: 0 }], defaultVal: '3.3V', isSource: true, voltage: 3.3 },

  // Switches & Input
  'button':       { name: 'Push Button', cat: 'switch', color: '#94a3b8', pins: [{ dx: 0, dy: 0 }, { dx: 2, dy: 0 }, { dx: 0, dy: 6 }, { dx: 2, dy: 6 }], defaultVal: 'Momentary', crossesChannel: true },
  'switch':       { name: 'Toggle Switch', cat: 'switch', color: '#64748b', pins: [{ dx: 0, dy: 0 }, { dx: 2, dy: 0 }], defaultVal: 'SPST' },

  // Output
  'buzzer':       { name: 'Piezo Buzzer', cat: 'output', color: '#22c55e', pins: [{ dx: 0, dy: 0 }, { dx: 1, dy: 0 }], defaultVal: '5V Active' },
  'motor-dc':     { name: 'DC Motor', cat: 'output', color: '#3b82f6', pins: [{ dx: 0, dy: 0 }, { dx: 2, dy: 0 }], defaultVal: '6V DC' },
};

