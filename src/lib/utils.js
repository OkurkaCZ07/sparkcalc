// ─── Formatting ───
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
  if(ohms<=0) return 0;
  const d=Math.pow(10,Math.floor(Math.log10(ohms))),n=ohms/d;
  let c=E24[0],m=Math.abs(n-E24[0]);
  for(const v of E24){const diff=Math.abs(n-v);if(diff<m){m=diff;c=v;}}
  if(Math.abs(n-10)<m) return 10*d;
  return c*d;
}
export const BAND_COLORS=[
  {name:'Black',value:0,mult:1,hex:'#1a1a1a'},{name:'Brown',value:1,mult:10,hex:'#8B4513'},
  {name:'Red',value:2,mult:100,hex:'#DC2626'},{name:'Orange',value:3,mult:1000,hex:'#EA580C'},
  {name:'Yellow',value:4,mult:10000,hex:'#EAB308'},{name:'Green',value:5,mult:100000,hex:'#16A34A'},
  {name:'Blue',value:6,mult:1000000,hex:'#2563EB'},{name:'Violet',value:7,mult:10000000,hex:'#7C3AED'},
  {name:'Grey',value:8,mult:100000000,hex:'#6B7280'},{name:'White',value:9,mult:1000000000,hex:'#E5E7EB'},
];

// ─── Languages ───
export const LANGUAGES = [
  { code:'en', name:'English', flag:'🇬🇧' },
  { code:'cs', name:'Čeština', flag:'🇨🇿' },
  { code:'de', name:'Deutsch', flag:'🇩🇪' },
  { code:'es', name:'Español', flag:'🇪🇸' },
  { code:'fr', name:'Français', flag:'🇫🇷' },
  { code:'ja', name:'日本語', flag:'🇯🇵' },
];

// ─── Categories with translations ───
export const CATEGORIES = [
  { id: 'basic', icon: '⚡',
    name: { en:'Basic & Fundamentals', cs:'Základy', de:'Grundlagen', es:'Fundamentos', fr:'Fondamentaux', ja:'基礎' },
    desc: { en:'Essential electronics calculations', cs:'Základní elektronické výpočty', de:'Grundlegende Elektronikberechnungen', es:'Cálculos electrónicos esenciales', fr:'Calculs électroniques essentiels', ja:'基本的な電子計算' },
  },
  { id: 'filters', icon: '〰️',
    name: { en:'Filters & Signals', cs:'Filtry a signály', de:'Filter & Signale', es:'Filtros y señales', fr:'Filtres et signaux', ja:'フィルタと信号' },
    desc: { en:'Filter design and signal processing', cs:'Návrh filtrů a zpracování signálů', de:'Filterdesign und Signalverarbeitung', es:'Diseño de filtros y procesamiento', fr:'Conception de filtres et traitement', ja:'フィルタ設計と信号処理' },
  },
  { id: 'power', icon: '🔥',
    name: { en:'Power & Thermal', cs:'Výkon a teplo', de:'Leistung & Thermik', es:'Potencia y térmico', fr:'Puissance et thermique', ja:'電力と熱' },
    desc: { en:'Power dissipation and thermal management', cs:'Tepelný výkon a chlazení', de:'Verlustleistung und Wärmemanagement', es:'Disipación de potencia y gestión térmica', fr:'Dissipation et gestion thermique', ja:'電力損失と熱管理' },
  },
  { id: 'pcb', icon: '📐',
    name: { en:'PCB & Design', cs:'PCB a návrh', de:'PCB & Design', es:'PCB y diseño', fr:'PCB et conception', ja:'PCBと設計' },
    desc: { en:'PCB layout and component design', cs:'Návrh plošných spojů', de:'Leiterplattenlayout und Bauteildesign', es:'Diseño de PCB y componentes', fr:'Conception de circuits imprimés', ja:'PCBレイアウトと部品設計' },
  },
  { id: 'converters', icon: '🔃',
    name: { en:'Converters & Tools', cs:'Převodníky a nástroje', de:'Umrechner & Werkzeuge', es:'Conversores y herramientas', fr:'Convertisseurs et outils', ja:'変換ツール' },
    desc: { en:'Unit converters and utility tools', cs:'Převodníky jednotek a užitečné nástroje', de:'Einheitenumrechner und Hilfsmittel', es:'Conversores de unidades y utilidades', fr:'Convertisseurs et utilitaires', ja:'単位変換とユーティリティ' },
  },
];

// ─── Calculators with translations ───
export const CALCULATORS = [
  { id:'voltage-divider', icon:'⚡', category:'basic',
    name:{ en:'Voltage Divider', cs:'Dělič napětí', de:'Spannungsteiler', es:'Divisor de voltaje', fr:'Diviseur de tension', ja:'分圧器' },
    desc:{ en:'Calculate output voltage, R1 or R2 in a resistive voltage divider circuit.', cs:'Vypočítejte výstupní napětí, R1 nebo R2 v odporovém děliči napětí.', de:'Berechnen Sie die Ausgangsspannung, R1 oder R2 eines Spannungsteilers.', es:'Calcule el voltaje de salida, R1 o R2 en un divisor de voltaje resistivo.', fr:'Calculez la tension de sortie, R1 ou R2 d\'un diviseur de tension.', ja:'抵抗分圧回路の出力電圧、R1またはR2を計算します。' },
    keywords:'voltage divider resistor ratio output vout' },
  { id:'ohms-law', icon:'Ω', category:'basic',
    name:{ en:"Ohm's Law", cs:'Ohmův zákon', de:'Ohmsches Gesetz', es:'Ley de Ohm', fr:"Loi d'Ohm", ja:'オームの法則' },
    desc:{ en:"Calculate voltage, current, resistance and power using Ohm's law.", cs:'Vypočítejte napětí, proud, odpor a výkon pomocí Ohmova zákona.', de:'Berechnen Sie Spannung, Strom, Widerstand und Leistung.', es:'Calcule voltaje, corriente, resistencia y potencia con la Ley de Ohm.', fr:"Calculez tension, courant, résistance et puissance avec la loi d'Ohm.", ja:'オームの法則で電圧・電流・抵抗・電力を計算します。' },
    keywords:'ohms law voltage current resistance power watt' },
  { id:'led-resistor', icon:'💡', category:'basic',
    name:{ en:'LED Resistor', cs:'Rezistor pro LED', de:'LED-Widerstand', es:'Resistor para LED', fr:'Résistance LED', ja:'LED抵抗' },
    desc:{ en:'Find the right series resistor and wattage for driving LEDs.', cs:'Najděte správný předřadný rezistor a jeho výkon pro napájení LED.', de:'Finden Sie den richtigen Vorwiderstand und seine Leistung für LEDs.', es:'Encuentre la resistencia en serie correcta para alimentar LEDs.', fr:'Trouvez la bonne résistance série et sa puissance pour alimenter des LEDs.', ja:'LEDの直列抵抗とワット数を計算します。' },
    keywords:'led resistor current limiting forward voltage diode' },
  { id:'resistor-code', icon:'🎨', category:'basic',
    name:{ en:'Resistor Code', cs:'Kód rezistoru', de:'Widerstandscode', es:'Código de resistor', fr:'Code résistance', ja:'抵抗カラーコード' },
    desc:{ en:'Decode 4-band resistor color codes to find resistance value.', cs:'Dekódujte 4-pásmový barevný kód rezistoru.', de:'Dekodieren Sie den 4-Band-Farbcode eines Widerstands.', es:'Decodifique el código de colores de resistores de 4 bandas.', fr:'Décodez le code couleur des résistances à 4 bandes.', ja:'4バンド抵抗のカラーコードを解読します。' },
    keywords:'resistor color code band decoder' },
  { id:'rc-filter', icon:'〰️', category:'filters',
    name:{ en:'RC Filter', cs:'RC filtr', de:'RC-Filter', es:'Filtro RC', fr:'Filtre RC', ja:'RCフィルタ' },
    desc:{ en:'Calculate cutoff frequency and time constant for RC filters.', cs:'Vypočítejte mezní frekvenci a časovou konstantu RC filtru.', de:'Berechnen Sie Grenzfrequenz und Zeitkonstante eines RC-Filters.', es:'Calcule la frecuencia de corte y constante de tiempo del filtro RC.', fr:'Calculez la fréquence de coupure et la constante de temps du filtre RC.', ja:'RCフィルタの遮断周波数と時定数を計算します。' },
    keywords:'rc filter low pass high pass cutoff frequency' },
  { id:'lc-resonance', icon:'🔄', category:'filters',
    name:{ en:'LC Resonance', cs:'LC rezonance', de:'LC-Resonanz', es:'Resonancia LC', fr:'Résonance LC', ja:'LC共振' },
    desc:{ en:'Calculate resonant frequency for LC circuits and tank circuits.', cs:'Vypočítejte rezonanční frekvenci LC obvodů.', de:'Berechnen Sie die Resonanzfrequenz von LC-Schaltungen.', es:'Calcule la frecuencia de resonancia de circuitos LC.', fr:'Calculez la fréquence de résonance des circuits LC.', ja:'LC回路の共振周波数を計算します。' },
    keywords:'lc resonance tank circuit frequency' },
  { id:'555-timer', icon:'⏱️', category:'filters',
    name:{ en:'555 Timer', cs:'Časovač 555', de:'555 Timer', es:'Temporizador 555', fr:'Temporisateur 555', ja:'555タイマー' },
    desc:{ en:'Calculate frequency and duty cycle for 555 timer astable mode.', cs:'Vypočítejte frekvenci a střídu časovače 555 v astabilním režimu.', de:'Berechnen Sie Frequenz und Tastverhältnis des 555-Timers im astabilen Modus.', es:'Calcule frecuencia y ciclo de trabajo del temporizador 555 en modo astable.', fr:'Calculez la fréquence et le rapport cyclique du 555 en mode astable.', ja:'555タイマーの非安定モードの周波数とデューティ比を計算します。' },
    keywords:'555 timer ne555 astable frequency duty cycle' },
  { id:'mosfet-power', icon:'🔥', category:'power',
    name:{ en:'MOSFET Power', cs:'Výkon MOSFET', de:'MOSFET-Leistung', es:'Potencia MOSFET', fr:'Puissance MOSFET', ja:'MOSFET電力' },
    desc:{ en:'Calculate MOSFET power dissipation and junction temperature.', cs:'Vypočítejte ztrátový výkon a teplotu přechodu MOSFET.', de:'Berechnen Sie die Verlustleistung und Sperrschichttemperatur.', es:'Calcule la disipación de potencia y temperatura de unión del MOSFET.', fr:'Calculez la dissipation et la température de jonction du MOSFET.', ja:'MOSFETの電力損失と接合部温度を計算します。' },
    keywords:'mosfet power dissipation junction temperature heatsink' },
  { id:'battery-life', icon:'🔋', category:'power',
    name:{ en:'Battery Life', cs:'Výdrž baterie', de:'Akkulaufzeit', es:'Duración de batería', fr:'Autonomie batterie', ja:'バッテリー寿命' },
    desc:{ en:'Estimate battery runtime from capacity and load current.', cs:'Odhadněte výdrž baterie z kapacity a odebíraného proudu.', de:'Schätzen Sie die Akkulaufzeit aus Kapazität und Laststrom.', es:'Estime la duración de la batería a partir de la capacidad y corriente de carga.', fr:"Estimez l'autonomie à partir de la capacité et du courant de charge.", ja:'容量と負荷電流からバッテリー駆動時間を推定します。' },
    keywords:'battery life runtime capacity mah current' },
  { id:'pcb-trace', icon:'📐', category:'pcb',
    name:{ en:'PCB Trace Width', cs:'Šířka spoje PCB', de:'PCB-Leiterbahnbreite', es:'Ancho de pista PCB', fr:'Largeur piste PCB', ja:'PCBトレース幅' },
    desc:{ en:'Calculate minimum PCB trace width for a given current.', cs:'Vypočítejte minimální šířku spoje PCB pro daný proud.', de:'Berechnen Sie die minimale Leiterbahnbreite für einen bestimmten Strom.', es:'Calcule el ancho mínimo de pista PCB para una corriente dada.', fr:"Calculez la largeur minimale de piste pour un courant donné.", ja:'指定電流のPCBトレース最小幅を計算します。' },
    keywords:'pcb trace width current ipc 2221 copper' },
];

// ─── Helpers ───
export function getCatName(cat, lang) { return cat.name[lang] || cat.name.en; }
export function getCatDesc(cat, lang) { return cat.desc[lang] || cat.desc.en; }
export function getCalcName(calc, lang) { return calc.name[lang] || calc.name.en; }
export function getCalcDesc(calc, lang) { return calc.desc[lang] || calc.desc.en; }

export function getCalculatorsByCategory(catId) { return CALCULATORS.filter(c => c.category === catId); }
export function searchCalculators(query, lang = 'en') {
  if (!query?.trim()) return CALCULATORS;
  const q = query.toLowerCase().trim();
  return CALCULATORS.filter(c => {
    const name = (c.name[lang] || c.name.en).toLowerCase();
    const desc = (c.desc[lang] || c.desc.en).toLowerCase();
    return name.includes(q) || desc.includes(q) || c.keywords.toLowerCase().includes(q) || c.name.en.toLowerCase().includes(q);
  });
}

// ─── UI Translations ───
export const TRANSLATIONS = {
  en: { heroTitle:'Electronics Calculators,', heroHighlight:'Supercharged with AI', heroDesc:'Free, fast, and accurate calculators for circuit design. Ask the AI assistant for component recommendations — no registration needed.', searchPlaceholder:'Search calculators... (e.g. "voltage divider", "555 timer", "PCB")', allCalculators:'All Calculators', categories:'Categories', aiAvailable:'AI Assistant Available', noResults:'No calculators found. Try a different search term.', whyTitle:'Why SparkCalc?', whyText:'SparkCalc offers free, browser-based electronics calculators for hobbyists, students, and engineers. Our AI assistant provides real-world design guidance — recommending standard component values, checking safety margins, and helping optimize your circuits.', whyText2:'All calculators work instantly with no registration. Available in multiple languages with AI assistance free daily.' },
  cs: { heroTitle:'Elektronické kalkulačky,', heroHighlight:'Poháněné umělou inteligencí', heroDesc:'Bezplatné, rychlé a přesné kalkulačky pro návrh obvodů. Zeptejte se AI asistenta na doporučení součástek — bez registrace.', searchPlaceholder:'Hledat kalkulačky... (např. "dělič napětí", "časovač 555", "PCB")', allCalculators:'Všechny kalkulačky', categories:'Kategorie', aiAvailable:'AI asistent k dispozici', noResults:'Žádné kalkulačky nenalezeny. Zkuste jiný výraz.', whyTitle:'Proč SparkCalc?', whyText:'SparkCalc nabízí bezplatné elektronické kalkulačky pro bastlíře, studenty a inženýry. Náš AI asistent poskytuje praktické rady — doporučuje standardní hodnoty součástek, kontroluje bezpečnostní rezervy a pomáhá optimalizovat vaše obvody.', whyText2:'Všechny kalkulačky fungují okamžitě bez registrace. K dispozici ve více jazycích s bezplatnou AI asistencí.' },
  de: { heroTitle:'Elektronik-Rechner,', heroHighlight:'Mit KI aufgeladen', heroDesc:'Kostenlose, schnelle und genaue Rechner für Schaltungsdesign. Fragen Sie den KI-Assistenten — keine Registrierung nötig.', searchPlaceholder:'Rechner suchen... (z.B. "Spannungsteiler", "555 Timer", "PCB")', allCalculators:'Alle Rechner', categories:'Kategorien', aiAvailable:'KI-Assistent verfügbar', noResults:'Keine Rechner gefunden. Versuchen Sie einen anderen Begriff.', whyTitle:'Warum SparkCalc?', whyText:'SparkCalc bietet kostenlose Elektronik-Rechner für Bastler, Studenten und Ingenieure. Unser KI-Assistent gibt praxisnahe Empfehlungen zu Bauteilwerten und Sicherheitsmargen.', whyText2:'Alle Rechner funktionieren sofort ohne Registrierung. Verfügbar in mehreren Sprachen mit kostenloser KI-Unterstützung.' },
  es: { heroTitle:'Calculadoras electrónicas,', heroHighlight:'Potenciadas con IA', heroDesc:'Calculadoras gratuitas y precisas para diseño de circuitos. Pregunte al asistente IA por recomendaciones — sin registro.', searchPlaceholder:'Buscar calculadoras... (ej. "divisor de voltaje", "555 timer")', allCalculators:'Todas las calculadoras', categories:'Categorías', aiAvailable:'Asistente IA disponible', noResults:'No se encontraron calculadoras. Intente otro término.', whyTitle:'¿Por qué SparkCalc?', whyText:'SparkCalc ofrece calculadoras electrónicas gratuitas para aficionados, estudiantes e ingenieros. Nuestro asistente IA proporciona orientación práctica de diseño.', whyText2:'Todas las calculadoras funcionan al instante sin registro. Disponible en varios idiomas con asistencia IA gratuita.' },
  fr: { heroTitle:'Calculateurs électroniques,', heroHighlight:"Boostés par l'IA", heroDesc:"Calculateurs gratuits et précis pour la conception de circuits. Demandez à l'assistant IA — sans inscription.", searchPlaceholder:'Rechercher... (ex. "diviseur de tension", "555")', allCalculators:'Tous les calculateurs', categories:'Catégories', aiAvailable:'Assistant IA disponible', noResults:'Aucun calculateur trouvé. Essayez un autre terme.', whyTitle:'Pourquoi SparkCalc ?', whyText:"SparkCalc propose des calculateurs électroniques gratuits pour les amateurs, étudiants et ingénieurs. Notre assistant IA fournit des conseils de conception pratiques.", whyText2:"Tous les calculateurs fonctionnent instantanément sans inscription. Disponible en plusieurs langues avec assistance IA gratuite." },
  ja: { heroTitle:'電子計算ツール、', heroHighlight:'AIで強化', heroDesc:'回路設計のための無料・高速・正確な計算ツール。AIアシスタントに聞けます — 登録不要。', searchPlaceholder:'計算ツールを検索...', allCalculators:'すべての計算ツール', categories:'カテゴリー', aiAvailable:'AIアシスタント利用可能', noResults:'見つかりません。別の検索語をお試しください。', whyTitle:'SparkCalcとは？', whyText:'SparkCalcは、趣味・学生・エンジニア向けの無料電子計算ツールです。AIアシスタントが部品値の推奨や安全マージンの確認など、実践的なアドバイスを提供します。', whyText2:'すべての計算ツールは登録不要ですぐに使えます。多言語対応、AI支援は毎日無料で利用できます。' },
};
export function t(lang, key) { return TRANSLATIONS[lang]?.[key] || TRANSLATIONS.en[key] || key; }
