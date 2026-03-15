'use client';
import { useState } from 'react';
import InputField from '@/components/InputField';
import ResultBox from '@/components/ResultBox';
import AIPanel from '@/components/AIPanel';

export default function PCBTraceCalc() {
  const [current, setCurrent] = useState('1');
  const [tempRise, setTempRise] = useState('10');
  const [thickness, setThickness] = useState('1');
  const [layer, setLayer] = useState('external');

  const iF = parseFloat(current) || 0;
  const dtF = parseFloat(tempRise) || 0;
  const ozF = parseFloat(thickness) || 0;
  const thickMil = ozF * 1.378;

  // IPC-2221 formula: A = (I / (k * dT^b))^(1/c)
  const k = layer === 'external' ? 0.048 : 0.024;
  const b = 0.44;
  const c = 0.725;

  let area = null, widthMil = null, widthMm = null;
  if (iF > 0 && dtF > 0 && thickMil > 0) {
    area = Math.pow(iF / (k * Math.pow(dtF, b)), 1 / c);
    widthMil = area / thickMil;
    widthMm = widthMil * 0.0254;
  }

  return (
    <div className="flex gap-5 flex-wrap">
      <div className="flex-1 min-w-[340px] bg-sc-surface rounded-2xl p-5 border border-sc-border">
        {/* Layer selector */}
        <div className="flex gap-2 mb-5">
          {['external', 'internal'].map((t) => (
            <button key={t} onClick={() => setLayer(t)}
              className={`flex-1 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer border ${
                layer === t ? 'bg-sc-accent/10 border-sc-accent text-sc-accent' : 'bg-sc-surface2 border-sc-border text-sc-dim hover:border-sc-accent/40'
              }`}>
              {t === 'external' ? '↑ External Layer' : '↓ Internal Layer'}
            </button>
          ))}
        </div>

        {/* Trace visual */}
        <div className="flex justify-center mb-5">
          <svg viewBox="0 0 260 80" className="w-full max-w-[240px]">
            <rect x="10" y="35" width="240" height="30" rx="2" fill="#1a5c1a" opacity="0.3" />
            <rect x="10" y="35" width="240" height="30" rx="2" fill="none" stroke="#22c55e" strokeWidth="1" opacity="0.3" />
            <rect x="30" y={layer === 'external' ? '28' : '40'} width="200" height={widthMm ? Math.min(Math.max(widthMm * 8, 4), 20) : 8} rx="1"
              fill="#ff8c42" opacity="0.8" />
            <text x="130" y="22" textAnchor="middle" fill="#6b7089" fontSize="9" fontFamily="monospace">
              {widthMm ? `${widthMm.toFixed(2)} mm (${widthMil?.toFixed(1)} mil)` : 'Enter values'}
            </text>
            <text x="130" y="78" textAnchor="middle" fill="#22c55e" fontSize="8" fontFamily="monospace" opacity="0.5">PCB substrate</text>
          </svg>
        </div>

        <InputField label="Current" value={current} onChange={setCurrent} unit="A" />
        <InputField label="Allowed Temperature Rise" value={tempRise} onChange={setTempRise} unit="°C" />
        <InputField label="Copper Thickness" value={thickness} onChange={setThickness} unit="oz" />

        {widthMm && (
          <div className="grid grid-cols-2 gap-2.5 mt-5">
            <ResultBox label="Min Trace Width" value={`${widthMm.toFixed(2)} mm`} />
            <ResultBox label="Width (mil)" value={`${widthMil.toFixed(1)} mil`} color="cyan" />
            <ResultBox label="Cross-section Area" value={`${area?.toFixed(1)} mil²`} color="green" />
            <ResultBox label="Standard (IPC-2221)" value={layer === 'external' ? 'External' : 'Internal'} color="warn" />
          </div>
        )}

        <div className="mt-3 bg-sc-surface2 rounded-lg p-3 text-xs text-sc-dim leading-relaxed">
          💡 Based on IPC-2221 standard. For safety, use traces 50% wider than the minimum calculated value.
        </div>
      </div>
      <div className="flex-1 min-w-[300px]">
        <AIPanel context={{ current_A: current, tempRise_C: tempRise, copperOz: thickness, layer, traceWidth_mm: widthMm?.toFixed(3) }} toolId="pcb-trace" />
      </div>
    </div>
  );
}
