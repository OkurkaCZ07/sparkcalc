'use client';

import { useState } from 'react';
import InputField from '@/components/InputField';
import ResultBox from '@/components/ResultBox';
import AIPanel from '@/components/AIPanel';
import { formatResistance, formatValue, nearestStandardResistor } from '@/lib/utils';

export default function LEDResistorCalc() {
  const [vs, setVs] = useState('5');
  const [vf, setVf] = useState('2');
  const [current, setCurrent] = useState('20');

  const vsF = parseFloat(vs) || 0;
  const vfF = parseFloat(vf) || 0;
  const curF = parseFloat(current) || 0;

  const r = curF > 0 ? (vsF - vfF) / (curF / 1000) : null;
  const p = r && r > 0 ? Math.pow(curF / 1000, 2) * r : null;
  const nearestR = r && r > 0 ? nearestStandardResistor(r) : null;
  const actualCurrent = nearestR ? (vsF - vfF) / nearestR : null;

  return (
    <div className="flex gap-5 flex-wrap">
      <div className="flex-1 min-w-[340px] bg-sc-surface rounded-2xl p-5 border border-sc-border">
        {/* LED Schematic */}
        <div className="flex justify-center mb-5">
          <svg viewBox="0 0 300 100" className="w-full max-w-[280px]">
            {/* Supply */}
            <text x="10" y="38" fill="#f59e0b" fontSize="11" fontFamily="monospace" fontWeight="700">
              +{vs || '?'}V
            </text>
            <line x1="45" y1="35" x2="80" y2="35" stroke="#94a3b8" strokeWidth="2" />
            {/* Resistor */}
            <rect x="80" y="22" width="50" height="26" rx="4" fill="none" stroke="#00d4ff" strokeWidth="2" />
            <text x="105" y="38" textAnchor="middle" fill="#00d4ff" fontSize="9" fontFamily="monospace" fontWeight="700">
              {nearestR ? formatResistance(nearestR) : 'R'}
            </text>
            {/* Wire */}
            <line x1="130" y1="35" x2="165" y2="35" stroke="#94a3b8" strokeWidth="2" />
            {/* LED triangle */}
            <polygon points="165,22 165,48 190,35" fill="none" stroke="#22c55e" strokeWidth="2" />
            <line x1="190" y1="22" x2="190" y2="48" stroke="#22c55e" strokeWidth="2" />
            {/* LED arrows */}
            <line x1="175" y1="18" x2="185" y2="10" stroke="#22c55e" strokeWidth="1.5" />
            <line x1="182" y1="10" x2="185" y2="10" stroke="#22c55e" strokeWidth="1.5" />
            <line x1="185" y1="10" x2="185" y2="13" stroke="#22c55e" strokeWidth="1.5" />
            <line x1="180" y1="22" x2="190" y2="14" stroke="#22c55e" strokeWidth="1.5" />
            {/* Wire to GND */}
            <line x1="190" y1="35" x2="240" y2="35" stroke="#94a3b8" strokeWidth="2" />
            {/* GND */}
            <line x1="240" y1="25" x2="240" y2="45" stroke="#94a3b8" strokeWidth="2" />
            <line x1="245" y1="28" x2="245" y2="42" stroke="#94a3b8" strokeWidth="1.5" />
            <line x1="250" y1="31" x2="250" y2="39" stroke="#94a3b8" strokeWidth="1" />
            {/* Current arrow */}
            <text x="148" y="58" textAnchor="middle" fill="#7a8599" fontSize="9" fontFamily="monospace">
              → {current || '?'}mA
            </text>
          </svg>
        </div>

        <InputField label="Supply Voltage (Vs)" value={vs} onChange={setVs} unit="V" />
        <InputField label="LED Forward Voltage (Vf)" value={vf} onChange={setVf} unit="V" />
        <InputField label="Desired LED Current" value={current} onChange={setCurrent} unit="mA" />

        {r !== null && r > 0 && (
          <div className="grid grid-cols-2 gap-2.5 mt-5">
            <ResultBox label="Exact Resistor" value={formatResistance(Math.round(r))} />
            <ResultBox label="Nearest E24" value={formatResistance(nearestR)} color="green" />
            <ResultBox label="Actual Current" value={actualCurrent ? `${(actualCurrent * 1000).toFixed(1)} mA` : '—'} color="green" />
            <ResultBox label="Power Dissipation" value={p ? formatValue(p, 'W') : '—'} color="warn" />
          </div>
        )}

        {r !== null && r <= 0 && (
          <div className="mt-4 bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-sm text-red-400">
            ⚠️ Supply voltage must be higher than LED forward voltage!
          </div>
        )}
      </div>

      <div className="flex-1 min-w-[300px]">
        <AIPanel
          context={{ supply: vs, vForward: vf, current, resistor: r?.toFixed(1), nearestE24: nearestR }}
          toolId="led-resistor"
        />
      </div>
    </div>
  );
}
