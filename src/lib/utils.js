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
const E24=[1.0,1.1,1.2,1.3,1.5,1.6,1.8,2.0,2.2,2.4,2.7,3.0,3.3,3.6,3.9,4.3,4.7,5.1,5.6,6.2,6.8,7.5,8.2,9.1];
export function nearestStandardResistor(ohms) {
  if (ohms<=0) return 0;
  const decade=Math.pow(10,Math.floor(Math.log10(ohms)));
  const n=ohms/decade;
  let closest=E24[0],minD=Math.abs(n-E24[0]);
  for(const v of E24){const d=Math.abs(n-v);if(d<minD){minD=d;closest=v;}}
  if(Math.abs(n-10)<minD) return 10*decade;
  return closest*decade;
}
export const BAND_COLORS=[
  {name:'Black',value:0,mult:1,hex:'#1a1a1a'},{name:'Brown',value:1,mult:10,hex:'#8B4513'},
  {name:'Red',value:2,mult:100,hex:'#DC2626'},{name:'Orange',value:3,mult:1000,hex:'#EA580C'},
  {name:'Yellow',value:4,mult:10000,hex:'#EAB308'},{name:'Green',value:5,mult:100000,hex:'#16A34A'},
  {name:'Blue',value:6,mult:1000000,hex:'#2563EB'},{name:'Violet',value:7,mult:10000000,hex:'#7C3AED'},
  {name:'Grey',value:8,mult:100000000,hex:'#6B7280'},{name:'White',value:9,mult:1000000000,hex:'#E5E7EB'},
];

export const CATEGORIES = [
  { id: 'basic', name: 'Basic & Fundamentals', icon: '⚡', desc: 'Essential electronics calculations' },
  { id: 'filters', name: 'Filters & Signals', icon: '〰️', desc: 'Filter design and signal processing' },
  { id: 'power', name: 'Power & Thermal', icon: '🔥', desc: 'Power dissipation and thermal management' },
  { id: 'pcb', name: 'PCB & Design', icon: '📐', desc: 'PCB layout and component design' },
  { id: 'converters', name: 'Converters & Tools', icon: '🔃', desc: 'Unit converters and utility tools' },
];

export const CALCULATORS = [
  { id:'voltage-divider', name:'Voltage Divider', icon:'⚡', category:'basic', desc:'Calculate output voltage, R1 or R2 in a resistive voltage divider circuit.', keywords:'voltage divider resistor ratio output vout' },
  { id:'ohms-law', name:"Ohm's Law", icon:'Ω', category:'basic', desc:"Calculate voltage, current, resistance and power using Ohm's law.", keywords:'ohms law voltage current resistance power watt' },
  { id:'led-resistor', name:'LED Resistor', icon:'💡', category:'basic', desc:'Find the right series resistor and wattage for driving LEDs.', keywords:'led resistor current limiting forward voltage diode' },
  { id:'resistor-code', name:'Resistor Code', icon:'🎨', category:'basic', desc:'Decode 4-band resistor color codes to find resistance value.', keywords:'resistor color code band decoder' },
  { id:'rc-filter', name:'RC Filter', icon:'〰️', category:'filters', desc:'Calculate cutoff frequency and time constant for RC filters.', keywords:'rc filter low pass high pass cutoff frequency' },
  { id:'lc-resonance', name:'LC Resonance', icon:'🔄', category:'filters', desc:'Calculate resonant frequency for LC circuits and tank circuits.', keywords:'lc resonance tank circuit frequency' },
  { id:'555-timer', name:'555 Timer', icon:'⏱️', category:'filters', desc:'Calculate frequency and duty cycle for 555 timer astable mode.', keywords:'555 timer ne555 astable frequency duty cycle' },
  { id:'mosfet-power', name:'MOSFET Power', icon:'🔥', category:'power', desc:'Calculate MOSFET power dissipation and junction temperature.', keywords:'mosfet power dissipation junction temperature heatsink' },
  { id:'battery-life', name:'Battery Life', icon:'🔋', category:'power', desc:'Estimate battery runtime from capacity and load current.', keywords:'battery life runtime capacity mah current' },
  { id:'pcb-trace', name:'PCB Trace Width', icon:'📐', category:'pcb', desc:'Calculate minimum PCB trace width for a given current.', keywords:'pcb trace width current ipc 2221 copper' },
];

export function getCalculatorsByCategory(catId) { return CALCULATORS.filter(c => c.category === catId); }
export function searchCalculators(query) {
  if (!query?.trim()) return CALCULATORS;
  const q = query.toLowerCase().trim();
  return CALCULATORS.filter(c => c.name.toLowerCase().includes(q) || c.desc.toLowerCase().includes(q) || c.keywords.toLowerCase().includes(q));
}

export const LANGUAGES = [
  { code:'en', name:'English', flag:'🇬🇧' },
  { code:'cs', name:'Čeština', flag:'🇨🇿' },
  { code:'de', name:'Deutsch', flag:'🇩🇪' },
  { code:'es', name:'Español', flag:'🇪🇸' },
  { code:'fr', name:'Français', flag:'🇫🇷' },
  { code:'ja', name:'日本語', flag:'🇯🇵' },
];

export const TRANSLATIONS = {
  en: { heroTitle:'Electronics Calculators,', heroHighlight:'Supercharged with AI', heroDesc:'Free, fast, and accurate calculators for circuit design. Ask the AI assistant for component recommendations — no registration needed.', searchPlaceholder:'Search calculators... (e.g. "voltage divider", "555 timer", "PCB")', allCalculators:'All Calculators', categories:'Categories', aiAvailable:'AI Assistant Available', viewAll:'View all', noResults:'No calculators found. Try a different search term.' },
  cs: { heroTitle:'Elektronické kalkulačky,', heroHighlight:'Poháněné umělou inteligencí', heroDesc:'Bezplatné, rychlé a přesné kalkulačky pro návrh obvodů. Zeptejte se AI asistenta na doporučení součástek — bez registrace.', searchPlaceholder:'Hledat kalkulačky... (např. "dělič napětí", "555 časovač")', allCalculators:'Všechny kalkulačky', categories:'Kategorie', aiAvailable:'AI asistent k dispozici', viewAll:'Zobrazit vše', noResults:'Žádné kalkulačky nenalezeny.' },
  de: { heroTitle:'Elektronik-Rechner,', heroHighlight:'Mit KI aufgeladen', heroDesc:'Kostenlose, schnelle und genaue Rechner für Schaltungsdesign. Fragen Sie den KI-Assistenten — keine Registrierung nötig.', searchPlaceholder:'Rechner suchen... (z.B. "Spannungsteiler", "555 Timer")', allCalculators:'Alle Rechner', categories:'Kategorien', aiAvailable:'KI-Assistent verfügbar', viewAll:'Alle anzeigen', noResults:'Keine Rechner gefunden.' },
  es: { heroTitle:'Calculadoras electrónicas,', heroHighlight:'Potenciadas con IA', heroDesc:'Calculadoras gratuitas y precisas para diseño de circuitos. Pregunte al asistente IA — sin registro.', searchPlaceholder:'Buscar calculadoras... (ej. "divisor de voltaje")', allCalculators:'Todas las calculadoras', categories:'Categorías', aiAvailable:'Asistente IA disponible', viewAll:'Ver todo', noResults:'No se encontraron calculadoras.' },
  fr: { heroTitle:'Calculateurs électroniques,', heroHighlight:"Boostés par l'IA", heroDesc:"Calculateurs gratuits et précis pour la conception de circuits. Demandez à l'assistant IA — sans inscription.", searchPlaceholder:'Rechercher... (ex. "diviseur de tension")', allCalculators:'Tous les calculateurs', categories:'Catégories', aiAvailable:'Assistant IA disponible', viewAll:'Voir tout', noResults:'Aucun calculateur trouvé.' },
  ja: { heroTitle:'電子計算ツール、', heroHighlight:'AIで強化', heroDesc:'回路設計のための無料・高速・正確な計算ツール。AIアシスタントに聞けます — 登録不要。', searchPlaceholder:'計算ツールを検索...', allCalculators:'すべての計算ツール', categories:'カテゴリー', aiAvailable:'AIアシスタント利用可能', viewAll:'すべて表示', noResults:'見つかりません。' },
};
export function t(lang, key) { return TRANSLATIONS[lang]?.[key] || TRANSLATIONS.en[key] || key; }
