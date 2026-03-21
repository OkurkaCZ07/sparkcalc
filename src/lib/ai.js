export async function askAI(question, toolId, context) {
  const systemPrompt = `You are SparkCalc AI — a concise electronics design assistant embedded in an online calculator tool.
The user is currently using the "${toolId}" calculator.
Current values: ${JSON.stringify(context)}

RULES:
- Give practical, actionable advice in 2-4 short paragraphs
- Mention specific component values and real part numbers when relevant
- Use plain language. Format important values with **bold**
- If recommending components, suggest real parts from Mouser/Digikey
- Always consider safety margins and real-world considerations
- Reply in the same language the user uses (default: English)`;

  const response = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, systemPrompt }),
  });
  if (!response.ok) throw new Error(`AI request failed: ${response.status}`);
  const data = await response.json();
  return data.text;
}

export const AI_SUGGESTIONS = {
  'voltage-divider': {
    en: ['Are these resistor values practical? What standard E24 values should I use?','What\'s the power dissipation? Do I need high-wattage resistors?','How will a 10mA load current affect the output voltage?'],
    cs: ['Jsou tyto hodnoty rezistorů praktické? Jaké standardní hodnoty E24 použít?','Jaký je ztrátový výkon? Potřebuji výkonové rezistory?','Jak ovlivní zatěžovací proud 10mA výstupní napětí?'],
    de: ['Sind diese Widerstandswerte praktisch? Welche E24-Standardwerte soll ich verwenden?','Wie hoch ist die Verlustleistung? Brauche ich Hochlast-Widerstände?','Wie beeinflusst ein 10mA-Laststrom die Ausgangsspannung?'],
    es: ['¿Son prácticos estos valores de resistencia? ¿Qué valores E24 debo usar?','¿Cuál es la disipación de potencia? ¿Necesito resistores de alta potencia?','¿Cómo afectará una corriente de carga de 10mA al voltaje de salida?'],
    fr: ['Ces valeurs de résistance sont-elles pratiques ? Quelles valeurs E24 utiliser ?','Quelle est la dissipation ? Ai-je besoin de résistances haute puissance ?','Comment un courant de charge de 10mA affectera-t-il la tension de sortie ?'],
    ja: ['この抵抗値は実用的ですか？E24標準値はどれを使うべきですか？','電力損失はどれくらいですか？高ワット抵抗が必要ですか？','10mAの負荷電流は出力電圧にどう影響しますか？'],
  },
  'led-resistor': {
    en: ['What wattage resistor do I need? Is 1/4W enough?','Can I drive multiple LEDs in series with one resistor?','What happens if I use the next standard resistor value?'],
    cs: ['Jaký výkon rezistoru potřebuji? Stačí 1/4W?','Mohu napájet více LED v sérii jedním rezistorem?','Co se stane, když použiji nejbližší standardní hodnotu?'],
    de: ['Welche Belastbarkeit braucht der Widerstand? Reichen 1/4W?','Kann ich mehrere LEDs in Reihe mit einem Widerstand betreiben?','Was passiert mit dem nächsten Standardwert?'],
    es: ['¿Qué potencia de resistor necesito? ¿Es suficiente 1/4W?','¿Puedo alimentar varios LEDs en serie con un resistor?','¿Qué pasa si uso el siguiente valor estándar?'],
    fr: ['Quelle puissance de résistance me faut-il ? 1/4W suffit-il ?','Puis-je alimenter plusieurs LEDs en série avec une résistance ?','Que se passe-t-il avec la valeur standard suivante ?'],
    ja: ['何ワットの抵抗が必要ですか？1/4Wで十分ですか？','1つの抵抗で複数のLEDを直列駆動できますか？','次の標準値を使うとどうなりますか？'],
  },
  'rc-filter': {
    en: ['Is this a good filter design for audio applications?','What\'s the attenuation at twice the cutoff frequency?','Should I use a second-order filter for better rolloff?'],
    cs: ['Je tento filtr vhodný pro audio aplikace?','Jaký je útlum na dvojnásobku mezní frekvence?','Měl bych použít filtr druhého řádu pro lepší strmost?'],
    de: ['Ist dieses Filterdesign für Audioanwendungen geeignet?','Wie groß ist die Dämpfung bei der doppelten Grenzfrequenz?','Sollte ich ein Filter 2. Ordnung verwenden?'],
    es: ['¿Es un buen diseño de filtro para aplicaciones de audio?','¿Cuál es la atenuación al doble de la frecuencia de corte?','¿Debería usar un filtro de segundo orden?'],
    fr: ['Ce filtre convient-il aux applications audio ?','Quelle est l\'atténuation au double de la fréquence de coupure ?','Devrais-je utiliser un filtre du second ordre ?'],
    ja: ['このフィルタ設計はオーディオ用途に適していますか？','カットオフ周波数の2倍での減衰量は？','より良い減衰のために2次フィルタを使うべきですか？'],
  },
  'ohms-law': {
    en: ['Is this current safe for a standard breadboard trace?','What AWG wire gauge do I need for this current?','How can I reduce power dissipation in this circuit?'],
    cs: ['Je tento proud bezpečný pro standardní nepájivé pole?','Jaký průřez vodiče (AWG) potřebuji pro tento proud?','Jak mohu snížit ztrátový výkon v tomto obvodu?'],
    de: ['Ist dieser Strom sicher für ein Standard-Breadboard?','Welchen Drahtquerschnitt (AWG) brauche ich?','Wie kann ich die Verlustleistung reduzieren?'],
    es: ['¿Es segura esta corriente para una protoboard estándar?','¿Qué calibre de cable (AWG) necesito?','¿Cómo puedo reducir la disipación de potencia?'],
    fr: ['Ce courant est-il sûr pour une breadboard standard ?','Quel calibre de fil (AWG) me faut-il ?','Comment réduire la dissipation dans ce circuit ?'],
    ja: ['この電流はブレッドボードで安全ですか？','この電流に必要なワイヤーゲージ（AWG）は？','この回路の電力損失を減らすには？'],
  },
  'resistor-code': {
    en: ['What are the nearest standard E24/E96 values to my target?','When should I use 1% vs 5% tolerance resistors?'],
    cs: ['Jaké jsou nejbližší standardní hodnoty E24/E96?','Kdy použít rezistory s tolerancí 1% vs 5%?'],
    de: ['Was sind die nächsten E24/E96-Standardwerte?','Wann sollte ich 1% vs. 5% Toleranz verwenden?'],
    es: ['¿Cuáles son los valores estándar E24/E96 más cercanos?','¿Cuándo usar resistores de 1% vs 5% de tolerancia?'],
    fr: ['Quelles sont les valeurs E24/E96 les plus proches ?','Quand utiliser des résistances à 1% vs 5% ?'],
    ja: ['最寄りのE24/E96標準値は？','1%と5%の許容差はどう使い分けますか？'],
  },
  'mosfet-power': {
    en: ['Do I need a heatsink? What size?','Which specific MOSFET would you recommend?','Is my junction temperature safe for continuous operation?'],
    cs: ['Potřebuji chladič? Jakou velikost?','Který konkrétní MOSFET byste doporučili?','Je teplota přechodu bezpečná pro trvalý provoz?'],
    de: ['Brauche ich einen Kühlkörper? Welche Größe?','Welchen MOSFET empfehlen Sie?','Ist die Sperrschichttemperatur für Dauerbetrieb sicher?'],
    es: ['¿Necesito un disipador? ¿Qué tamaño?','¿Qué MOSFET específico recomendaría?','¿Es segura la temperatura de unión para operación continua?'],
    fr: ['Ai-je besoin d\'un dissipateur ? Quelle taille ?','Quel MOSFET recommandez-vous ?','La température de jonction est-elle sûre en continu ?'],
    ja: ['ヒートシンクは必要ですか？サイズは？','おすすめのMOSFETは？','接合部温度は連続動作に安全ですか？'],
  },
  'lc-resonance': {
    en: ['What are good L and C values for this frequency?','What\'s the Q factor with a given series resistance?','Is this suitable for a bandpass filter?'],
    cs: ['Jaké hodnoty L a C jsou vhodné pro tuto frekvenci?','Jaký je činitel jakosti Q při daném sériovém odporu?','Je to vhodné pro pásmový filtr?'],
    de: ['Welche L- und C-Werte eignen sich für diese Frequenz?','Wie hoch ist der Gütefaktor Q bei einem Serienwiderstand?','Eignet sich das für einen Bandpassfilter?'],
    es: ['¿Qué valores de L y C son buenos para esta frecuencia?','¿Cuál es el factor Q con una resistencia en serie?','¿Es adecuado para un filtro pasa banda?'],
    fr: ['Quelles valeurs de L et C pour cette fréquence ?','Quel est le facteur Q avec une résistance série ?','Convient-il pour un filtre passe-bande ?'],
    ja: ['この周波数に適したLとCの値は？','直列抵抗でのQ値は？','バンドパスフィルタに適していますか？'],
  },
  '555-timer': {
    en: ['How can I get closer to 50% duty cycle?','What capacitor type should I use for timing?','How stable will this frequency be with temperature changes?'],
    cs: ['Jak se přiblížit ke střídě 50%?','Jaký typ kondenzátoru použít pro časování?','Jak stabilní bude frekvence při změnách teploty?'],
    de: ['Wie komme ich näher an 50% Tastverhältnis?','Welchen Kondensatortyp für die Zeitgebung?','Wie stabil ist die Frequenz bei Temperaturänderungen?'],
    es: ['¿Cómo acercarme a un ciclo de trabajo del 50%?','¿Qué tipo de capacitor usar para temporización?','¿Qué tan estable será la frecuencia con cambios de temperatura?'],
    fr: ['Comment approcher un rapport cyclique de 50% ?','Quel type de condensateur pour la temporisation ?','Quelle stabilité en fréquence avec la température ?'],
    ja: ['デューティ比50%に近づけるには？','タイミング用にどのタイプのコンデンサを使うべきですか？','温度変化での周波数安定性は？'],
  },
  'pcb-trace': {
    en: ['Should I use internal or external layers for this trace?','Do I need thermal relief on this trace?','What copper weight should I specify?'],
    cs: ['Mám použít vnitřní nebo vnější vrstvu?','Potřebuji tepelnou úlevu na tomto spoji?','Jakou tloušťku mědi mám specifikovat?'],
    de: ['Soll ich Innen- oder Außenlagen verwenden?','Brauche ich Thermal-Relief an dieser Leiterbahn?','Welche Kupferdicke soll ich angeben?'],
    es: ['¿Debo usar capas internas o externas?','¿Necesito alivio térmico en esta pista?','¿Qué peso de cobre debo especificar?'],
    fr: ['Couche interne ou externe pour cette piste ?','Ai-je besoin de relief thermique ?','Quelle épaisseur de cuivre spécifier ?'],
    ja: ['このトレースは内層と外層どちらを使うべきですか？','サーマルリリーフは必要ですか？','銅の厚さはどう指定すべきですか？'],
  },
  'battery-life': {
    en: ['How can I extend the battery life of this design?','What battery chemistry is best for this application?','Should I use a voltage regulator or direct battery connection?'],
    cs: ['Jak mohu prodloužit výdrž baterie tohoto návrhu?','Jaká chemie baterie je nejlepší pro tuto aplikaci?','Mám použít regulátor napětí nebo přímé připojení baterie?'],
    de: ['Wie kann ich die Akkulaufzeit verlängern?','Welche Batteriechemie eignet sich am besten?','Soll ich einen Spannungsregler oder direkten Anschluss verwenden?'],
    es: ['¿Cómo puedo extender la duración de la batería?','¿Qué química de batería es mejor para esta aplicación?','¿Debo usar un regulador de voltaje o conexión directa?'],
    fr: ['Comment prolonger l\'autonomie de la batterie ?','Quelle chimie de batterie est la meilleure ?','Régulateur de tension ou connexion directe ?'],
    ja: ['バッテリー寿命を延ばすには？','この用途に最適なバッテリーの種類は？','電圧レギュレータを使うべきですか？'],
  },
};

export function getSuggestions(toolId, lang) {
  const s = AI_SUGGESTIONS[toolId];
  if (!s) return [];
  return s[lang] || s.en || [];
}

// Add to AI_SUGGESTIONS
AI_SUGGESTIONS['prototyper'] = {
  en: ['Will this circuit work? Check for any issues.', 'What components am I missing for a complete circuit?', 'Suggest improvements to my design.'],
  cs: ['Bude tento obvod fungovat? Zkontroluj případné problémy.', 'Jaké součástky mi chybí pro kompletní obvod?', 'Navrhni vylepšení mého návrhu.'],
  de: ['Wird diese Schaltung funktionieren? Prüfe auf Probleme.', 'Welche Bauteile fehlen für einen vollständigen Schaltkreis?', 'Schlage Verbesserungen vor.'],
  es: ['¿Funcionará este circuito? Verifica problemas.', '¿Qué componentes me faltan para un circuito completo?', 'Sugiere mejoras para mi diseño.'],
  fr: ['Ce circuit fonctionnera-t-il ? Vérifiez les problèmes.', 'Quels composants manquent pour un circuit complet ?', 'Suggérez des améliorations.'],
  ja: ['この回路は動作しますか？問題をチェックしてください。', '完全な回路に必要な部品は何ですか？', '設計の改善を提案してください。'],
};
