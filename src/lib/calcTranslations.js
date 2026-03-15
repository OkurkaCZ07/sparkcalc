// Shared labels used across calculators
export const CALC_LABELS = {
  // Common
  inputVoltage: { en:'Input Voltage', cs:'Vstupní napětí', de:'Eingangsspannung', es:'Voltaje de entrada', fr:"Tension d'entrée", ja:'入力電圧' },
  outputVoltage: { en:'Output Voltage', cs:'Výstupní napětí', de:'Ausgangsspannung', es:'Voltaje de salida', fr:'Tension de sortie', ja:'出力電圧' },
  resistance: { en:'Resistance', cs:'Odpor', de:'Widerstand', es:'Resistencia', fr:'Résistance', ja:'抵抗' },
  current: { en:'Current', cs:'Proud', de:'Strom', es:'Corriente', fr:'Courant', ja:'電流' },
  voltage: { en:'Voltage', cs:'Napětí', de:'Spannung', es:'Voltaje', fr:'Tension', ja:'電圧' },
  power: { en:'Power', cs:'Výkon', de:'Leistung', es:'Potencia', fr:'Puissance', ja:'電力' },
  frequency: { en:'Frequency', cs:'Frekvence', de:'Frequenz', es:'Frecuencia', fr:'Fréquence', ja:'周波数' },
  capacitance: { en:'Capacitance', cs:'Kapacita', de:'Kapazität', es:'Capacitancia', fr:'Capacité', ja:'容量' },
  inductance: { en:'Inductance', cs:'Indukčnost', de:'Induktivität', es:'Inductancia', fr:'Inductance', ja:'インダクタンス' },
  powerDissipation: { en:'Power Dissipation', cs:'Ztrátový výkon', de:'Verlustleistung', es:'Disipación de potencia', fr:'Dissipation', ja:'電力損失' },

  // Voltage Divider
  resistorR1: { en:'Resistor R1', cs:'Rezistor R1', de:'Widerstand R1', es:'Resistor R1', fr:'Résistance R1', ja:'抵抗R1' },
  resistorR2: { en:'Resistor R2', cs:'Rezistor R2', de:'Widerstand R2', es:'Resistor R2', fr:'Résistance R2', ja:'抵抗R2' },

  // LED
  supplyVoltage: { en:'Supply Voltage', cs:'Napájecí napětí', de:'Versorgungsspannung', es:'Voltaje de alimentación', fr:"Tension d'alimentation", ja:'電源電圧' },
  ledForwardVoltage: { en:'LED Forward Voltage (Vf)', cs:'Propustné napětí LED (Vf)', de:'LED Flussspannung (Vf)', es:'Voltaje directo LED (Vf)', fr:'Tension directe LED (Vf)', ja:'LED順方向電圧 (Vf)' },
  desiredCurrent: { en:'Desired LED Current', cs:'Požadovaný proud LED', de:'Gewünschter LED-Strom', es:'Corriente LED deseada', fr:'Courant LED souhaité', ja:'LED電流' },
  exactResistor: { en:'Exact Resistor', cs:'Přesný rezistor', de:'Exakter Widerstand', es:'Resistor exacto', fr:'Résistance exacte', ja:'正確な抵抗値' },
  nearestE24: { en:'Nearest E24', cs:'Nejbližší E24', de:'Nächster E24', es:'E24 más cercano', fr:'E24 le plus proche', ja:'最寄りのE24' },
  actualCurrent: { en:'Actual Current', cs:'Skutečný proud', de:'Tatsächlicher Strom', es:'Corriente real', fr:'Courant réel', ja:'実際の電流' },

  // RC Filter
  cutoffFrequency: { en:'Cutoff Frequency', cs:'Mezní frekvence', de:'Grenzfrequenz', es:'Frecuencia de corte', fr:'Fréquence de coupure', ja:'遮断周波数' },
  timeConstant: { en:'Time Constant (τ)', cs:'Časová konstanta (τ)', de:'Zeitkonstante (τ)', es:'Constante de tiempo (τ)', fr:'Constante de temps (τ)', ja:'時定数 (τ)' },
  filterType: { en:'Filter Type', cs:'Typ filtru', de:'Filtertyp', es:'Tipo de filtro', fr:'Type de filtre', ja:'フィルタタイプ' },
  lowPass: { en:'↓ Low Pass', cs:'↓ Dolní propust', de:'↓ Tiefpass', es:'↓ Pasa bajo', fr:'↓ Passe-bas', ja:'↓ ローパス' },
  highPass: { en:'↑ High Pass', cs:'↑ Horní propust', de:'↑ Hochpass', es:'↑ Pasa alto', fr:'↑ Passe-haut', ja:'↑ ハイパス' },

  // Ohm's Law
  findR: { en:'Find R', cs:'Najdi R', de:'R finden', es:'Encontrar R', fr:'Trouver R', ja:'Rを求める' },
  findV: { en:'Find V', cs:'Najdi V', de:'V finden', es:'Encontrar V', fr:'Trouver V', ja:'Vを求める' },
  findI: { en:'Find I', cs:'Najdi I', de:'I finden', es:'Encontrar I', fr:'Trouver I', ja:'Iを求める' },
  fromVI: { en:'From V and I', cs:'Z V a I', de:'Aus V und I', es:'De V e I', fr:'De V et I', ja:'VとIから' },
  fromIR: { en:'From I and R', cs:'Z I a R', de:'Aus I und R', es:'De I y R', fr:'De I et R', ja:'IとRから' },
  fromVR: { en:'From V and R', cs:'Z V a R', de:'Aus V und R', es:'De V y R', fr:'De V et R', ja:'VとRから' },

  // Resistor Code
  band1: { en:'1st Band (1st Digit)', cs:'1. pásmo (1. číslice)', de:'1. Band (1. Ziffer)', es:'1ª Banda (1er dígito)', fr:'1re Bande (1er chiffre)', ja:'第1バンド (第1桁)' },
  band2: { en:'2nd Band (2nd Digit)', cs:'2. pásmo (2. číslice)', de:'2. Band (2. Ziffer)', es:'2ª Banda (2do dígito)', fr:'2e Bande (2e chiffre)', ja:'第2バンド (第2桁)' },
  bandMult: { en:'3rd Band (Multiplier)', cs:'3. pásmo (násobitel)', de:'3. Band (Multiplikator)', es:'3ª Banda (Multiplicador)', fr:'3e Bande (Multiplicateur)', ja:'第3バンド (乗数)' },
  resistanceValue: { en:'Resistance Value', cs:'Hodnota odporu', de:'Widerstandswert', es:'Valor de resistencia', fr:'Valeur de résistance', ja:'抵抗値' },

  // MOSFET
  rdson: { en:'Rds(on) — On-State Resistance', cs:'Rds(on) — Odpor v sepnutém stavu', de:'Rds(on) — Einschaltwiderstand', es:'Rds(on) — Resistencia en conducción', fr:'Rds(on) — Résistance à l\'état passant', ja:'Rds(on) — オン抵抗' },
  drainCurrent: { en:'Drain Current (Id)', cs:'Proud drainem (Id)', de:'Drain-Strom (Id)', es:'Corriente de drenaje (Id)', fr:'Courant de drain (Id)', ja:'ドレイン電流 (Id)' },
  ambientTemp: { en:'Ambient Temperature', cs:'Teplota okolí', de:'Umgebungstemperatur', es:'Temperatura ambiente', fr:'Température ambiante', ja:'周囲温度' },
  thermalRes: { en:'Thermal Resistance Rθjc', cs:'Tepelný odpor Rθjc', de:'Thermischer Widerstand Rθjc', es:'Resistencia térmica Rθjc', fr:'Résistance thermique Rθjc', ja:'熱抵抗 Rθjc' },
  junctionTemp: { en:'Junction Temp', cs:'Teplota přechodu', de:'Sperrschichttemp.', es:'Temp. de unión', fr:'Temp. jonction', ja:'接合部温度' },
  heatsinkNeeded: { en:'Heatsink Needed?', cs:'Potřeba chladiče?', de:'Kühlkörper nötig?', es:'¿Disipador necesario?', fr:'Dissipateur nécessaire ?', ja:'ヒートシンク必要？' },
  safetyMargin: { en:'Safety Margin', cs:'Bezpečnostní rezerva', de:'Sicherheitsmarge', es:'Margen de seguridad', fr:'Marge de sécurité', ja:'安全マージン' },
  yes: { en:'YES', cs:'ANO', de:'JA', es:'SÍ', fr:'OUI', ja:'必要' },
  no: { en:'No', cs:'Ne', de:'Nein', es:'No', fr:'Non', ja:'不要' },
  recommended: { en:'Recommended', cs:'Doporučeno', de:'Empfohlen', es:'Recomendado', fr:'Recommandé', ja:'推奨' },
  notNeeded: { en:'Not needed', cs:'Není potřeba', de:'Nicht nötig', es:'No necesario', fr:'Non nécessaire', ja:'不要' },

  // LC Resonance
  resonantFrequency: { en:'Resonant Frequency', cs:'Rezonanční frekvence', de:'Resonanzfrequenz', es:'Frecuencia de resonancia', fr:'Fréquence de résonance', ja:'共振周波数' },
  characteristicImpedance: { en:'Characteristic Impedance', cs:'Charakteristická impedance', de:'Kennimpedanz', es:'Impedancia característica', fr:'Impédance caractéristique', ja:'特性インピーダンス' },
  angularFrequency: { en:'Angular Frequency (ω)', cs:'Úhlová frekvence (ω)', de:'Kreisfrequenz (ω)', es:'Frecuencia angular (ω)', fr:'Pulsation (ω)', ja:'角周波数 (ω)' },
  wavelength: { en:'Wavelength', cs:'Vlnová délka', de:'Wellenlänge', es:'Longitud de onda', fr:"Longueur d'onde", ja:'波長' },

  // 555 Timer
  capacitorC: { en:'Capacitor C', cs:'Kondenzátor C', de:'Kondensator C', es:'Capacitor C', fr:'Condensateur C', ja:'コンデンサ C' },
  dutyCycle: { en:'Duty Cycle', cs:'Střída', de:'Tastverhältnis', es:'Ciclo de trabajo', fr:'Rapport cyclique', ja:'デューティ比' },
  timeHigh: { en:'Time High', cs:'Čas v log. 1', de:'High-Zeit', es:'Tiempo alto', fr:'Temps haut', ja:'High時間' },
  timeLow: { en:'Time Low', cs:'Čas v log. 0', de:'Low-Zeit', es:'Tiempo bajo', fr:'Temps bas', ja:'Low時間' },
  period: { en:'Period', cs:'Perioda', de:'Periode', es:'Período', fr:'Période', ja:'周期' },

  // PCB Trace
  traceWidth: { en:'Min Trace Width', cs:'Min. šířka spoje', de:'Min. Leiterbahnbreite', es:'Ancho mínimo de pista', fr:'Largeur min. piste', ja:'最小トレース幅' },
  copperThickness: { en:'Copper Thickness', cs:'Tloušťka mědi', de:'Kupferdicke', es:'Espesor del cobre', fr:'Épaisseur du cuivre', ja:'銅厚' },
  tempRise: { en:'Allowed Temperature Rise', cs:'Povolený nárůst teploty', de:'Zulässiger Temperaturanstieg', es:'Aumento de temperatura permitido', fr:'Hausse de température admise', ja:'許容温度上昇' },
  externalLayer: { en:'↑ External Layer', cs:'↑ Vnější vrstva', de:'↑ Außenlage', es:'↑ Capa externa', fr:'↑ Couche externe', ja:'↑ 外層' },
  internalLayer: { en:'↓ Internal Layer', cs:'↓ Vnitřní vrstva', de:'↓ Innenlage', es:'↓ Capa interna', fr:'↓ Couche interne', ja:'↓ 内層' },

  // Battery Life
  batteryType: { en:'Battery Type', cs:'Typ baterie', de:'Batterietyp', es:'Tipo de batería', fr:'Type de batterie', ja:'バッテリータイプ' },
  batteryCapacity: { en:'Battery Capacity', cs:'Kapacita baterie', de:'Batteriekapazität', es:'Capacidad de batería', fr:'Capacité batterie', ja:'バッテリー容量' },
  batteryVoltage: { en:'Battery Voltage', cs:'Napětí baterie', de:'Batteriespannung', es:'Voltaje de batería', fr:'Tension batterie', ja:'バッテリー電圧' },
  loadCurrent: { en:'Average Load Current', cs:'Průměrný odebíraný proud', de:'Mittlerer Laststrom', es:'Corriente de carga promedio', fr:'Courant de charge moyen', ja:'平均負荷電流' },
  efficiency: { en:'Efficiency (regulator losses)', cs:'Účinnost (ztráty regulátoru)', de:'Effizienz (Regler-Verluste)', es:'Eficiencia (pérdidas del regulador)', fr:'Efficacité (pertes régulateur)', ja:'効率（レギュレータ損失）' },
  estimatedRuntime: { en:'Estimated Runtime', cs:'Odhadovaná výdrž', de:'Geschätzte Laufzeit', es:'Tiempo estimado', fr:'Autonomie estimée', ja:'推定動作時間' },
  energyAvailable: { en:'Energy Available', cs:'Dostupná energie', de:'Verfügbare Energie', es:'Energía disponible', fr:'Énergie disponible', ja:'利用可能エネルギー' },
  powerDraw: { en:'Power Draw', cs:'Příkon', de:'Leistungsaufnahme', es:'Consumo', fr:'Consommation', ja:'消費電力' },
};

// AI Panel translations
export const AI_LABELS = {
  title: { en:'SPARKCALC AI', cs:'SPARKCALC AI', de:'SPARKCALC KI', es:'SPARKCALC IA', fr:'SPARKCALC IA', ja:'SPARKCALC AI' },
  askAbout: { en:'Ask AI about your circuit:', cs:'Zeptejte se AI na váš obvod:', de:'Fragen Sie die KI zu Ihrer Schaltung:', es:'Pregunte a la IA sobre su circuito:', fr:'Demandez à l\'IA à propos de votre circuit :', ja:'回路についてAIに質問：' },
  analyzing: { en:'Analyzing your circuit...', cs:'Analyzuji váš obvod...', de:'Ihre Schaltung wird analysiert...', es:'Analizando su circuito...', fr:'Analyse de votre circuit...', ja:'回路を分析中...' },
  askAnother: { en:'← Ask another question', cs:'← Položit další otázku', de:'← Weitere Frage stellen', es:'← Hacer otra pregunta', fr:'← Poser une autre question', ja:'← 別の質問をする' },
  placeholder: { en:'Ask anything about your circuit...', cs:'Zeptejte se na cokoliv o vašem obvodu...', de:'Fragen Sie alles über Ihre Schaltung...', es:'Pregunte cualquier cosa sobre su circuito...', fr:'Demandez n\'importe quoi sur votre circuit...', ja:'回路について何でも聞いてください...' },
  leftToday: { en:'left today', cs:'zbývá dnes', de:'heute übrig', es:'restantes hoy', fr:'restants aujourd\'hui', ja:'本日残り' },
  limitReached: { en:'Daily AI limit reached. Calculators still work — AI resets tomorrow!', cs:'Denní limit AI dosažen. Kalkulačky fungují dál — AI se resetuje zítra!', de:'Tägliches KI-Limit erreicht. Rechner funktionieren weiter — KI wird morgen zurückgesetzt!', es:'Límite diario de IA alcanzado. Las calculadoras siguen funcionando — la IA se reinicia mañana.', fr:'Limite IA quotidienne atteinte. Les calculateurs fonctionnent encore — l\'IA se réinitialise demain !', ja:'AIの1日の制限に達しました。計算ツールは引き続き使えます — AIは明日リセットされます！' },
  error: { en:'Could not reach AI assistant. Check your connection.', cs:'Nelze se spojit s AI asistentem. Zkontrolujte připojení.', de:'KI-Assistent nicht erreichbar. Prüfen Sie Ihre Verbindung.', es:'No se pudo contactar al asistente IA. Verifique su conexión.', fr:'Impossible de joindre l\'assistant IA. Vérifiez votre connexion.', ja:'AIアシスタントに接続できません。接続を確認してください。' },
  back: { en:'← Back', cs:'← Zpět', de:'← Zurück', es:'← Volver', fr:'← Retour', ja:'← 戻る' },
};

export function cl(key, lang) { return CALC_LABELS[key]?.[lang] || CALC_LABELS[key]?.en || key; }
export function al(key, lang) { return AI_LABELS[key]?.[lang] || AI_LABELS[key]?.en || key; }

// Additional UI translations
export const UI_EXTRA = {
  headerSubtitle: { en:'AI-POWERED ELECTRONICS TOOLKIT', cs:'ELEKTRONICKÁ SADA S UMĚLOU INTELIGENCÍ', de:'KI-GESTÜTZTES ELEKTRONIK-TOOLKIT', es:'HERRAMIENTAS ELECTRÓNICAS CON IA', fr:"BOÎTE À OUTILS ÉLECTRONIQUE IA", ja:'AI搭載エレクトロニクスツールキット' },
  calculator: { en:'Calculator', cs:'Kalkulačka', de:'Rechner', es:'Calculadora', fr:'Calculateur', ja:'計算ツール' },
  decoder: { en:'Decoder', cs:'Dekodér', de:'Dekodierer', es:'Decodificador', fr:'Décodeur', ja:'デコーダ' },
};
export function ui(key, lang) { return UI_EXTRA[key]?.[lang] || UI_EXTRA[key]?.en || key; }
