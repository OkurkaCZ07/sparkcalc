'use client';

import { useState } from 'react';
import InputField from '@/components/InputField';
import ResultBox from '@/components/ResultBox';
import AIPanel from '@/components/AIPanel';
import { formatResistance, formatValue } from '@/lib/utils';

export default function OhmsLawCalc() {
  const [mode, setMode] = useState('findR'); // findR, findV, findI
  const [v, setV] = useState('5');
  const [i, setI] = useState('100');
  const [r, setR] = useState('');

  const modes = [
    { id: 'findR', label: 'Find R', desc: 'From V and I' },
    { id: 'findV', label: 'Find V', desc: 'From I and R' },
    { id: 'findI', label: 'Find I', desc: 'From V and R' },
  ];

  let voltage, currentA, resistance, power;

  if (mode === 'findR' && v && i) {
    voltage = parseFloat(v);
    currentA = parseFloat(i) / 1000;
    resistance = currentA > 0 ? voltage / currentA : null;
    power = voltage * currentA;
  } else if (mode === 'findV' && i && r) {
    currentA = parseFloat(i) / 1000;
    resistance = parseFloat(r);
    voltage = currentA * resistance;
    power = voltage * currentA;
  } else if (mode === 'findI' && v && r) {
    voltage = parseFloat(v);
    resistance = parseFloat(r);
    currentA = resistance > 0 ? voltage / resistance : null;
    power = currentA ? voltage * currentA : null;
  }

  return (
    <div className="flex gap-5 flex-wrap">
      <div className="flex-1 min-w-[340px] bg-sc-surface rounded-2xl p-5 border border-sc-border">
        {/* Mode selector */}
        <div className="flex gap-2 mb-5">
          {modes.map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`flex-1 py-2.5 rounded-lg text-center transition-all cursor-pointer border ${
                mode === m.id
                  ? 'bg-sc-accent/10 border-sc-accent'
                  : 'bg-sc-surface2 border-sc-border hover:border-sc-accent/40'
              }`}
            >
              <div className={`text-xs font-bold ${mode === m.id ? 'text-sc-accent' : 'text-sc-text'}`}>
                {m.label}
              </div>
              <div className="text-[9px] text-sc-dim mt-0.5">{m.desc}</div>
            </button>
          ))}
        </div>

        {/* Ohm's law triangle */}
        <div className="flex justify-center mb-5">
          <svg viewBox="0 0 200 140" className="w-full max-w-[180px]">
            <polygon points="100,10 30,130 170,130" fill="none" stroke="#252a3a" strokeWidth="2" />
            <text x="100" y="55" textAnchor="middle" fill={mode === 'findV' ? '#00d4ff' : '#e2e8f0'} fontSize="24" fontFamily="monospace" fontWeight="700">V</text>
            <line x1="55" y1="85" x2="145" y2="85" stroke="#252a3a" strokeWidth="1.5" />
            <text x="65" y="118" textAnchor="middle" fill={mode === 'findI' ? '#00d4ff' : '#e2e8f0'} fontSize="24" fontFamily="monospace" fontWeight="700">I</text>
            <text x="100" y="118" textAnchor="middle" fill="#7a8599" fontSize="18" fontFamily="monospace">×</text>
            <text x="137" y="118" textAnchor="middle" fill={mode === 'findR' ? '#00d4ff' : '#e2e8f0'} fontSize="24" fontFamily="monospace" fontWeight="700">R</text>
          </svg>
        </div>

        {/* Inputs based on mode */}
        {mode !== 'findV' && (
          <InputField label="Voltage" value={v} onChange={setV} unit="V" />
        )}
        {mode !== 'findI' && (
          <InputField label="Current" value={i} onChange={setI} unit="mA" />
        )}
        {mode !== 'findR' && (
          <InputField label="Resistance" value={r} onChange={setR} unit="Ω" />
        )}

        {/* Results */}
        <div className="grid grid-cols-2 gap-2.5 mt-5">
          {mode === 'findR' && resistance !== null && (
            <ResultBox label="Resistance" value={formatResistance(Math.round(resistance))} />
          )}
          {mode === 'findV' && voltage !== undefined && (
            <ResultBox label="Voltage" value={`${voltage.toFixed(3)} V`} />
          )}
          {mode === 'findI' && currentA !== null && (
            <ResultBox label="Current" value={formatValue(currentA, 'A')} />
          )}
          {power !== null && power !== undefined && (
            <ResultBox label="Power" value={formatValue(power, 'W')} color="warn" />
          )}
        </div>
      </div>

      <div className="flex-1 min-w-[300px]">
        <AIPanel
          context={{
            mode,
            voltage: voltage?.toFixed(3),
            current_mA: currentA ? (currentA * 1000).toFixed(2) : null,
            resistance: resistance?.toFixed(1),
            power: power?.toFixed(4),
          }}
          toolId="ohms-law"
        />
      </div>
    </div>
  );
}
