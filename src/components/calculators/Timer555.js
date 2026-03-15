'use client';
import { useState } from 'react';
import InputField from '@/components/InputField';
import ResultBox from '@/components/ResultBox';
import AIPanel from '@/components/AIPanel';
import { formatValue, formatResistance } from '@/lib/utils';

export default function Timer555Calc() {
  const [r1, setR1] = useState('10000');
  const [r2, setR2] = useState('10000');
  const [c, setC] = useState('100');

  const r1F = parseFloat(r1) || 0;
  const r2F = parseFloat(r2) || 0;
  const cF = (parseFloat(c) || 0) * 1e-9;

  const tHigh = cF > 0 ? 0.693 * (r1F + r2F) * cF : null;
  const tLow = cF > 0 ? 0.693 * r2F * cF : null;
  const period = tHigh && tLow ? tHigh + tLow : null;
  const freq = period ? 1 / period : null;
  const duty = tHigh && period ? (tHigh / period) * 100 : null;

  return (
    <div className="flex gap-5 flex-wrap">
      <div className="flex-1 min-w-[340px] bg-sc-surface rounded-2xl p-5 border border-sc-border">
        {/* 555 pin diagram */}
        <div className="flex justify-center mb-5">
          <svg viewBox="0 0 200 140" className="w-full max-w-[180px]">
            <rect x="50" y="20" width="100" height="100" rx="6" fill="#1a1b28" stroke="#ff8c42" strokeWidth="2" />
            <text x="100" y="75" textAnchor="middle" fill="#ff8c42" fontSize="16" fontFamily="monospace" fontWeight="700">555</text>
            {/* Pins left */}
            <text x="42" y="42" textAnchor="end" fill="#6b7089" fontSize="8" fontFamily="monospace">GND 1</text>
            <text x="42" y="62" textAnchor="end" fill="#6b7089" fontSize="8" fontFamily="monospace">TRIG 2</text>
            <text x="42" y="82" textAnchor="end" fill="#6b7089" fontSize="8" fontFamily="monospace">OUT 3</text>
            <text x="42" y="102" textAnchor="end" fill="#6b7089" fontSize="8" fontFamily="monospace">RST 4</text>
            {/* Pins right */}
            <text x="158" y="42" fill="#6b7089" fontSize="8" fontFamily="monospace">8 Vcc</text>
            <text x="158" y="62" fill="#6b7089" fontSize="8" fontFamily="monospace">7 DIS</text>
            <text x="158" y="82" fill="#6b7089" fontSize="8" fontFamily="monospace">6 THR</text>
            <text x="158" y="102" fill="#6b7089" fontSize="8" fontFamily="monospace">5 CV</text>
            {/* Mode label */}
            <text x="100" y="135" textAnchor="middle" fill="#ff8c42" fontSize="9" fontFamily="monospace" fontWeight="600">ASTABLE MODE</text>
          </svg>
        </div>

        <InputField label="Resistor R1" value={r1} onChange={setR1} unit="Ω" />
        <InputField label="Resistor R2" value={r2} onChange={setR2} unit="Ω" />
        <InputField label="Capacitor C" value={c} onChange={setC} unit="nF" />

        {freq && (
          <div className="grid grid-cols-2 gap-2.5 mt-5">
            <ResultBox label="Frequency" value={formatValue(freq, 'Hz')} />
            <ResultBox label="Period" value={formatValue(period, 's')} color="cyan" />
            <ResultBox label="Duty Cycle" value={`${duty?.toFixed(1)}%`} color={Math.abs(duty - 50) < 5 ? 'green' : 'warn'} />
            <ResultBox label="Time High" value={formatValue(tHigh, 's')} color="green" />
            <ResultBox label="Time Low" value={formatValue(tLow, 's')} color="green" />
            <ResultBox label="50% Duty?" value={duty > 55 ? 'Add diode across R2' : 'Close enough'} color={duty > 55 ? 'warn' : 'green'} />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-[300px]">
        <AIPanel context={{ R1: r1, R2: r2, C_nF: c, frequency: freq?.toFixed(2), dutyCycle: duty?.toFixed(1) }} toolId="555-timer" />
      </div>
    </div>
  );
}
