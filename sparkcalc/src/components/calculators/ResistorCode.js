'use client';

import { useState } from 'react';
import ResultBox from '@/components/ResultBox';
import AIPanel from '@/components/AIPanel';
import { BAND_COLORS, formatResistance } from '@/lib/utils';

export default function ResistorCodeCalc() {
  const [bands, setBands] = useState([1, 0, 2]); // Brown, Black, Red = 1kΩ

  const value = (bands[0] * 10 + bands[1]) * BAND_COLORS[bands[2]].mult;

  const bandLabels = ['1st Band (1st Digit)', '2nd Band (2nd Digit)', '3rd Band (Multiplier)'];

  return (
    <div className="flex gap-5 flex-wrap">
      <div className="flex-1 min-w-[340px] bg-sc-surface rounded-2xl p-5 border border-sc-border">
        {/* Resistor visual */}
        <div className="flex justify-center mb-6">
          <svg viewBox="0 0 320 90" className="w-full max-w-[300px]">
            {/* Leads */}
            <line x1="0" y1="45" x2="65" y2="45" stroke="#94a3b8" strokeWidth="2.5" />
            <line x1="255" y1="45" x2="320" y2="45" stroke="#94a3b8" strokeWidth="2.5" />
            {/* Body */}
            <rect x="65" y="15" width="190" height="60" rx="12" fill="#c9935a" />
            <rect x="65" y="15" width="190" height="60" rx="12" fill="url(#bodyGrad)" opacity="0.3" />
            <defs>
              <linearGradient id="bodyGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="white" />
                <stop offset="100%" stopColor="black" />
              </linearGradient>
            </defs>
            {/* Band 1 */}
            <rect x="95" y="12" width="24" height="66" rx="3" fill={BAND_COLORS[bands[0]].hex} stroke="rgba(0,0,0,0.15)" strokeWidth="1" />
            {/* Band 2 */}
            <rect x="132" y="12" width="24" height="66" rx="3" fill={BAND_COLORS[bands[1]].hex} stroke="rgba(0,0,0,0.15)" strokeWidth="1" />
            {/* Band 3 (multiplier) */}
            <rect x="169" y="12" width="24" height="66" rx="3" fill={BAND_COLORS[bands[2]].hex} stroke="rgba(0,0,0,0.15)" strokeWidth="1" />
            {/* Tolerance band (gold = 5%) */}
            <rect x="215" y="12" width="24" height="66" rx="3" fill="#CFB53B" stroke="rgba(0,0,0,0.15)" strokeWidth="1" />
          </svg>
        </div>

        {/* Band selectors */}
        {bandLabels.map((label, idx) => (
          <div key={idx} className="mb-4">
            <label className="block text-[11px] font-semibold text-sc-dim uppercase tracking-wider mb-2">
              {label}
            </label>
            <div className="flex gap-1.5 flex-wrap">
              {BAND_COLORS.map((color, ci) => (
                <button
                  key={ci}
                  onClick={() => {
                    const nb = [...bands];
                    nb[idx] = ci;
                    setBands(nb);
                  }}
                  className="relative group cursor-pointer transition-all"
                  title={`${color.name} — ${idx < 2 ? color.value : '×' + color.mult.toLocaleString()}`}
                >
                  <div
                    className={`w-8 h-8 rounded-md transition-all ${
                      bands[idx] === ci
                        ? 'ring-2 ring-sc-accent ring-offset-2 ring-offset-sc-surface scale-110'
                        : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: color.hex, border: ci === 0 ? '1px solid #374151' : 'none' }}
                  />
                  <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[8px] text-sc-dim opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {idx < 2 ? color.value : `×${color.mult >= 1e6 ? (color.mult / 1e6) + 'M' : color.mult >= 1e3 ? (color.mult / 1e3) + 'k' : color.mult}`}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* Result */}
        <div className="mt-6">
          <ResultBox label="Resistance Value" value={formatResistance(value)} />
        </div>

        {/* Reading breakdown */}
        <div className="mt-3 bg-sc-surface2 rounded-lg p-3 text-xs font-mono text-sc-dim">
          ({BAND_COLORS[bands[0]].name} {BAND_COLORS[bands[0]].value})
          ({BAND_COLORS[bands[1]].name} {BAND_COLORS[bands[1]].value})
          × {BAND_COLORS[bands[2]].mult.toLocaleString()} = <span className="text-sc-accent font-bold">{value.toLocaleString()}Ω</span>
          <span className="text-sc-dim/50"> ±5% (Gold)</span>
        </div>
      </div>

      <div className="flex-1 min-w-[300px]">
        <AIPanel
          context={{
            band1: BAND_COLORS[bands[0]].name,
            band2: BAND_COLORS[bands[1]].name,
            multiplier: BAND_COLORS[bands[2]].name,
            resistance_ohms: value,
            tolerance: '5%',
          }}
          toolId="resistor-code"
        />
      </div>
    </div>
  );
}
