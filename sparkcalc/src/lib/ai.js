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
  'voltage-divider': [
    'Are these resistor values practical? What standard E24 values should I use?',
    'What\'s the power dissipation? Do I need high-wattage resistors?',
    'How will a 10mA load current affect the output voltage?',
  ],
  'led-resistor': [
    'What wattage resistor do I need? Is 1/4W enough?',
    'Can I drive multiple LEDs in series with one resistor?',
    'What happens if I use the next standard resistor value?',
  ],
  'rc-filter': [
    'Is this a good filter design for audio applications?',
    'What\'s the attenuation at twice the cutoff frequency?',
    'Should I use a second-order filter for better rolloff?',
  ],
  'ohms-law': [
    'Is this current safe for a standard breadboard trace?',
    'What AWG wire gauge do I need for this current?',
    'How can I reduce power dissipation in this circuit?',
  ],
  'resistor-code': [
    'What are the nearest standard E24/E96 values to my target?',
    'When should I use 1% vs 5% tolerance resistors?',
  ],
  'mosfet-power': [
    'Do I need a heatsink? What size?',
    'Which specific MOSFET would you recommend for these parameters?',
    'Is my junction temperature safe for continuous operation?',
  ],
  'lc-resonance': [
    'What are good L and C values for this frequency?',
    'What\'s the Q factor with a given series resistance?',
    'Is this suitable for a bandpass filter?',
  ],
  '555-timer': [
    'How can I get closer to 50% duty cycle?',
    'What capacitor type should I use for timing?',
    'How stable will this frequency be with temperature changes?',
  ],
  'pcb-trace': [
    'Should I use internal or external layers for this trace?',
    'Do I need thermal relief on this trace?',
    'What copper weight should I specify?',
  ],
  'battery-life': [
    'How can I extend the battery life of this design?',
    'What battery chemistry is best for this application?',
    'Should I use a voltage regulator or direct battery connection?',
  ],
};
