'use client';

import { useState } from 'react';
import InputField from '@/components/InputField';
import ResultBox from '@/components/ResultBox';
import AIPanel from '@/components/AIPanel';
import { formatValue } from '@/lib/utils';

export default function RCFilterCalc() {
  const [r, setR] = useState('10000');
  const [c, setC] = useState('100');
  const [filterType, setFilterType] = useState('low');

  const rF = parseFloat(r) || 0;
  const cF = parseFloat(c) || 0;
  const cFarads = cF * 1e-9;

  const fc = rF > 0 && cF > 0 ? 1 / (2 * Math.PI * rF * cFarads) : null;
  const tau = rF > 0 && cF > 0 ? rF * cFarads : null;

  return (
    <div className="flex gap-5 flex-wrap">
      <div className="flex-1 min-w-[340px] bg-sc-surface rounded-2xl p-5 border border-sc-border">
        {/* Filter type selector */}
        <div className="flex gap-2 mb-5">
          {['low', 'high'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer border ${
                filterType === type
                  ? 'bg-sc-accent/10 border-sc-accent text-sc-accent'
                  : 'bg-sc-surface2 border-sc-border text-sc-dim hover:border-sc-accent/40'
              }`}
            >
              {type === 'low' ? '↓ Low Pass' : '↑ High Pass'}
            </button>
          ))}
        </div>

        {/* Schematic */}
        <div className="flex justify-center mb-5">
          <svg viewBox="0 0 300 120" className="w-full max-w-[280px]">
            <text x="10" y="45" fill="#7a8599" fontSize="10" fontFamily="monospace">Vin</text>
            <line x1="40" y1="40" x2="75" y2="40" stroke="#94a3b8" strokeWidth="2" />

            {filterType === 'low' ? (
              <>
                {/* Low pass: R in series, C to ground */}
                <rect x="75" y="28" width="50" height="24" rx="3" fill="none" stroke="#00d4ff" strokeWidth="2" />
                <text x="100" y="44" textAnchor="middle" fill="#00d4ff" fontSize="9" fontFamily="monospace" fontWeight="700">R</text>
                <line x1="125" y1="40" x2="200" y2="40" stroke="#94a3b8" strokeWidth="2" />
                {/* Capacitor */}
                <line x1="185" y1="50" x2="185" y2="55" stroke="#94a3b8" strokeWidth="2" />
                <line x1="175" y1="55" x2="195" y2="55" stroke="#22c55e" strokeWidth="2.5" />
                <line x1="175" y1="62" x2="195" y2="62" stroke="#22c55e" strokeWidth="2.5" />
                <line x1="185" y1="62" x2="185" y2="80" stroke="#94a3b8" strokeWidth="2" />
                <text x="205" y="62" fill="#22c55e" fontSize="9" fontFamily="monospace" fontWeight="700">C</text>
              </>
            ) : (
              <>
                {/* High pass: C in series, R to ground */}
                <line x1="75" y1="40" x2="85" y2="40" stroke="#94a3b8" strokeWidth="2" />
                <line x1="85" y1="28" x2="85" y2="52" stroke="#22c55e" strokeWidth="2.5" />
                <line x1="92" y1="28" x2="92" y2="52" stroke="#22c55e" strokeWidth="2.5" />
                <text x="88" y="22" textAnchor="middle" fill="#22c55e" fontSize="9" fontFamily="monospace" fontWeight="700">C</text>
                <line x1="92" y1="40" x2="130" y2="40" stroke="#94a3b8" strokeWidth="2" />
                <line x1="130" y1="40" x2="200" y2="40" stroke="#94a3b8" strokeWidth="2" />
                {/* R to ground */}
                <rect x="145" y="50" width="20" height="35" rx="3" fill="none" stroke="#00d4ff" strokeWidth="2" />
                <text x="175" y="72" fill="#00d4ff" fontSize="9" fontFamily="monospace" fontWeight="700">R</text>
                <line x1="155" y1="40" x2="155" y2="50" stroke="#94a3b8" strokeWidth="2" />
                <line x1="155" y1="85" x2="155" y2="95" stroke="#94a3b8" strokeWidth="2" />
              </>
            )}

            {/* GND */}
            <line x1="180" y1="90" x2="190" y2="90" stroke="#94a3b8" strokeWidth="2" />
            <line x1="182" y1="94" x2="188" y2="94" stroke="#94a3b8" strokeWidth="1.5" />
            <line x1="184" y1="98" x2="186" y2="98" stroke="#94a3b8" strokeWidth="1" />
            <line x1="185" y1="80" x2="185" y2="90" stroke="#94a3b8" strokeWidth="2" />

            <text x="220" y="45" fill="#f59e0b" fontSize="10" fontFamily="monospace" fontWeight="700">Vout</text>
            <circle cx="185" cy="40" r="3" fill="#94a3b8" />
          </svg>
        </div>

        <InputField label="Resistance (R)" value={r} onChange={setR} unit="Ω" />
        <InputField label="Capacitance (C)" value={c} onChange={setC} unit="nF" />

        {fc && (
          <div className="grid grid-cols-2 gap-2.5 mt-5">
            <ResultBox label="Cutoff Frequency (fc)" value={formatValue(fc, 'Hz')} />
            <ResultBox label="Time Constant (τ)" value={formatValue(tau, 's')} color="green" />
            <ResultBox label="-3dB Attenuation" value="0.707× (−3dB)" color="warn" />
            <ResultBox label="Filter Type" value={filterType === 'low' ? 'Low Pass' : 'High Pass'} color="green" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-[300px]">
        <AIPanel
          context={{ resistance: r, capacitance_nF: c, cutoff_Hz: fc?.toFixed(2), timeConstant: tau, filterType }}
          toolId="rc-filter"
        />
      </div>
    </div>
  );
}
