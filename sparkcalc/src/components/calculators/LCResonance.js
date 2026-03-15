'use client';
import { useState } from 'react';
import InputField from '@/components/InputField';
import ResultBox from '@/components/ResultBox';
import AIPanel from '@/components/AIPanel';
import { formatValue } from '@/lib/utils';

export default function LCResonanceCalc() {
  const [l, setL] = useState('100');
  const [c, setC] = useState('100');

  const lH = parseFloat(l) * 1e-6 || 0;
  const cF = parseFloat(c) * 1e-12 || 0;

  const freq = lH > 0 && cF > 0 ? 1 / (2 * Math.PI * Math.sqrt(lH * cF)) : null;
  const impedanceAtRes = lH > 0 && cF > 0 ? Math.sqrt(lH / cF) : null;
  const wavelength = freq ? (3e8 / freq) : null;

  return (
    <div className="flex gap-5 flex-wrap">
      <div className="flex-1 min-w-[340px] bg-sc-surface rounded-2xl p-5 border border-sc-border">
        {/* LC Circuit schematic */}
        <div className="flex justify-center mb-5">
          <svg viewBox="0 0 240 120" className="w-full max-w-[220px]">
            <line x1="40" y1="30" x2="120" y2="30" stroke="#94a3b8" strokeWidth="2" />
            <line x1="120" y1="30" x2="120" y2="40" stroke="#94a3b8" strokeWidth="2" />
            {/* Inductor */}
            <path d="M 40 30 L 40 45 C 40 50 50 50 50 45 C 50 40 60 40 60 45 C 60 50 70 50 70 45 C 70 40 80 40 80 45 L 80 90" fill="none" stroke="#ff8c42" strokeWidth="2" />
            <text x="20" y="65" fill="#ff8c42" fontSize="11" fontFamily="monospace" fontWeight="700">L</text>
            <text x="12" y="78" fill="#6b7089" fontSize="9" fontFamily="monospace">{l}µH</text>
            {/* Capacitor */}
            <line x1="120" y1="40" x2="120" y2="52" stroke="#94a3b8" strokeWidth="2" />
            <line x1="108" y1="52" x2="132" y2="52" stroke="#22c55e" strokeWidth="2.5" />
            <line x1="108" y1="60" x2="132" y2="60" stroke="#22c55e" strokeWidth="2.5" />
            <line x1="120" y1="60" x2="120" y2="90" stroke="#94a3b8" strokeWidth="2" />
            <text x="140" y="60" fill="#22c55e" fontSize="11" fontFamily="monospace" fontWeight="700">C</text>
            <text x="140" y="73" fill="#6b7089" fontSize="9" fontFamily="monospace">{c}pF</text>
            {/* Bottom wire */}
            <line x1="80" y1="90" x2="120" y2="90" stroke="#94a3b8" strokeWidth="2" />
            {/* Dots */}
            <circle cx="40" cy="30" r="3" fill="#94a3b8" />
            <circle cx="120" cy="30" r="3" fill="#94a3b8" />
            {/* Freq label */}
            {freq && (
              <text x="160" y="30" fill="#ff8c42" fontSize="10" fontFamily="monospace" fontWeight="700">
                f₀ = {formatValue(freq, 'Hz')}
              </text>
            )}
          </svg>
        </div>

        <InputField label="Inductance (L)" value={l} onChange={setL} unit="µH" />
        <InputField label="Capacitance (C)" value={c} onChange={setC} unit="pF" />

        {freq && (
          <div className="grid grid-cols-2 gap-2.5 mt-5">
            <ResultBox label="Resonant Frequency" value={formatValue(freq, 'Hz')} />
            <ResultBox label="Characteristic Impedance" value={formatValue(impedanceAtRes, 'Ω')} color="cyan" />
            <ResultBox label="Angular Frequency (ω)" value={formatValue(freq * 2 * Math.PI, 'rad/s')} color="green" />
            <ResultBox label="Wavelength" value={wavelength > 1 ? formatValue(wavelength, 'm') : formatValue(wavelength * 100, 'cm')} color="warn" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-[300px]">
        <AIPanel context={{ inductance_uH: l, capacitance_pF: c, resonantFreq_Hz: freq?.toFixed(2), impedance: impedanceAtRes?.toFixed(2) }} toolId="lc-resonance" />
      </div>
    </div>
  );
}
