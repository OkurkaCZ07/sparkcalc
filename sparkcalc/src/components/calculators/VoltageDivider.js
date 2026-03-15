'use client';

import { useState } from 'react';
import InputField from '@/components/InputField';
import ResultBox from '@/components/ResultBox';
import AIPanel from '@/components/AIPanel';
import { formatResistance, formatValue } from '@/lib/utils';

function VoltageDividerSVG({ vin, r1, r2, vout }) {
  return (
    <svg viewBox="0 0 260 280" className="w-full max-w-[220px]">
      <defs>
        <marker id="arr" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#00d4ff" />
        </marker>
      </defs>
      {/* Wires */}
      <line x1="130" y1="20" x2="130" y2="60" stroke="#94a3b8" strokeWidth="2" />
      <line x1="130" y1="110" x2="130" y2="140" stroke="#94a3b8" strokeWidth="2" />
      <line x1="130" y1="190" x2="130" y2="250" stroke="#94a3b8" strokeWidth="2" />
      <line x1="130" y1="140" x2="210" y2="140" stroke="#94a3b8" strokeWidth="2" />
      <line x1="130" y1="250" x2="210" y2="250" stroke="#94a3b8" strokeWidth="2" />
      {/* GND */}
      <line x1="115" y1="260" x2="145" y2="260" stroke="#94a3b8" strokeWidth="2" />
      <line x1="120" y1="265" x2="140" y2="265" stroke="#94a3b8" strokeWidth="1.5" />
      <line x1="125" y1="270" x2="135" y2="270" stroke="#94a3b8" strokeWidth="1" />
      <line x1="130" y1="250" x2="130" y2="260" stroke="#94a3b8" strokeWidth="2" />
      {/* R1 */}
      <rect x="120" y="60" width="20" height="50" rx="3" fill="none" stroke="#00d4ff" strokeWidth="2" />
      <text x="100" y="90" textAnchor="end" fill="#00d4ff" fontSize="11" fontFamily="monospace" fontWeight="700">R1</text>
      <text x="100" y="103" textAnchor="end" fill="#7a8599" fontSize="9" fontFamily="monospace">
        {r1 ? formatResistance(parseFloat(r1)) : '?'}
      </text>
      {/* R2 */}
      <rect x="120" y="140" width="20" height="50" rx="3" fill="none" stroke="#22c55e" strokeWidth="2" />
      <text x="100" y="170" textAnchor="end" fill="#22c55e" fontSize="11" fontFamily="monospace" fontWeight="700">R2</text>
      <text x="100" y="183" textAnchor="end" fill="#7a8599" fontSize="9" fontFamily="monospace">
        {r2 ? formatResistance(parseFloat(r2)) : '?'}
      </text>
      {/* Vin */}
      <text x="130" y="14" textAnchor="middle" fill="#f59e0b" fontSize="11" fontFamily="monospace" fontWeight="700">
        Vin = {vin || '?'}V
      </text>
      {/* Vout arrow */}
      <line x1="210" y1="145" x2="210" y2="245" stroke="#00d4ff" strokeWidth="1.5" markerStart="url(#arr)" markerEnd="url(#arr)" />
      <text x="235" y="200" textAnchor="middle" fill="#00d4ff" fontSize="11" fontFamily="monospace" fontWeight="700">Vout</text>
      <text x="235" y="214" textAnchor="middle" fill="#7a8599" fontSize="10" fontFamily="monospace">
        {vout ? `${vout}V` : '?'}
      </text>
      {/* Junction dots */}
      <circle cx="130" cy="140" r="3" fill="#94a3b8" />
      <circle cx="130" cy="250" r="3" fill="#94a3b8" />
    </svg>
  );
}

export default function VoltageDividerCalc() {
  const [vin, setVin] = useState('12');
  const [r1, setR1] = useState('10000');
  const [r2, setR2] = useState('10000');

  const vinF = parseFloat(vin) || 0;
  const r1F = parseFloat(r1) || 0;
  const r2F = parseFloat(r2) || 0;

  const vout = r1F + r2F > 0 ? (vinF * r2F / (r1F + r2F)).toFixed(3) : null;
  const current = r1F + r2F > 0 ? vinF / (r1F + r2F) : null;
  const p1 = current ? current * current * r1F : null;
  const p2 = current ? current * current * r2F : null;

  return (
    <div className="flex gap-5 flex-wrap">
      <div className="flex-1 min-w-[340px] bg-sc-surface rounded-2xl p-5 border border-sc-border">
        <div className="grid grid-cols-[auto_1fr] gap-5 items-start">
          <div className="bg-sc-surface2 rounded-xl p-3 border border-sc-border">
            <VoltageDividerSVG vin={vin} r1={r1} r2={r2} vout={vout} />
          </div>
          <div>
            <InputField label="Input Voltage (Vin)" value={vin} onChange={setVin} unit="V" />
            <InputField label="Resistor R1" value={r1} onChange={setR1} unit="Ω" />
            <InputField label="Resistor R2" value={r2} onChange={setR2} unit="Ω" />
          </div>
        </div>

        {vout && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mt-5">
            <ResultBox label="Output Voltage" value={`${vout} V`} />
            <ResultBox label="Current" value={current ? formatValue(current, 'A') : '—'} color="green" />
            <ResultBox label="P(R1)" value={p1 ? formatValue(p1, 'W') : '—'} color="warn" />
            <ResultBox label="P(R2)" value={p2 ? formatValue(p2, 'W') : '—'} color="warn" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-[300px]">
        <AIPanel
          context={{ vin, r1, r2, vout, current: current?.toFixed(6) }}
          toolId="voltage-divider"
        />
      </div>
    </div>
  );
}
