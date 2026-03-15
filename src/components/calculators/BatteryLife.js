'use client';
import { useState } from 'react';
import InputField from '@/components/InputField';
import ResultBox from '@/components/ResultBox';
import AIPanel from '@/components/AIPanel';

const BATTERIES = [
  { name: 'CR2032', capacity: 220, voltage: 3.0 },
  { name: 'AA Alkaline', capacity: 2500, voltage: 1.5 },
  { name: 'AAA Alkaline', capacity: 1000, voltage: 1.5 },
  { name: '18650 Li-ion', capacity: 3000, voltage: 3.7 },
  { name: '9V Block', capacity: 500, voltage: 9.0 },
  { name: 'LiPo 1S 1000mAh', capacity: 1000, voltage: 3.7 },
  { name: 'Custom', capacity: 0, voltage: 0 },
];

export default function BatteryLifeCalc() {
  const [battIdx, setBattIdx] = useState(3);
  const [capacity, setCapacity] = useState('3000');
  const [voltage, setVoltage] = useState('3.7');
  const [current, setCurrent] = useState('150');
  const [efficiency, setEfficiency] = useState('85');

  const capF = parseFloat(capacity) || 0;
  const curF = parseFloat(current) || 0;
  const effF = (parseFloat(efficiency) || 100) / 100;
  const voltF = parseFloat(voltage) || 0;

  const hours = curF > 0 ? (capF * effF) / curF : null;
  const days = hours ? hours / 24 : null;
  const energy = capF * voltF / 1000;

  const selectBattery = (idx) => {
    setBattIdx(idx);
    const b = BATTERIES[idx];
    if (b.capacity > 0) { setCapacity(String(b.capacity)); setVoltage(String(b.voltage)); }
  };

  const formatTime = (h) => {
    if (!h) return '—';
    if (h < 1) return `${(h * 60).toFixed(0)} min`;
    if (h < 48) return `${h.toFixed(1)} hours`;
    if (h < 720) return `${(h / 24).toFixed(1)} days`;
    return `${(h / 24 / 30).toFixed(1)} months`;
  };

  return (
    <div className="flex gap-5 flex-wrap">
      <div className="flex-1 min-w-[340px] bg-sc-surface rounded-2xl p-5 border border-sc-border">
        {/* Battery selector */}
        <div className="mb-4">
          <label className="block text-[11px] font-semibold text-sc-dim uppercase tracking-wider mb-2">Battery Type</label>
          <div className="flex gap-1.5 flex-wrap">
            {BATTERIES.map((b, i) => (
              <button key={i} onClick={() => selectBattery(i)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer border ${
                  battIdx === i ? 'bg-sc-accent/10 border-sc-accent text-sc-accent' : 'bg-sc-surface2 border-sc-border text-sc-dim hover:border-sc-accent/40'
                }`}>
                {b.name}
              </button>
            ))}
          </div>
        </div>

        {/* Battery visual */}
        <div className="flex justify-center mb-4">
          <svg viewBox="0 0 160 80" className="w-full max-w-[150px]">
            <rect x="10" y="15" width="120" height="50" rx="6" fill="none" stroke="#ff8c42" strokeWidth="2" />
            <rect x="130" y="28" width="12" height="24" rx="3" fill="#ff8c42" opacity="0.5" />
            {/* Fill level based on hours */}
            <rect x="14" y="19" width={hours ? Math.min(Math.max((hours / 24) * 10, 8), 112) : 60} height="42" rx="4"
              fill={hours && hours > 24 ? '#22c55e' : hours && hours > 4 ? '#f59e0b' : '#DC2626'} opacity="0.2" />
            <text x="70" y="45" textAnchor="middle" fill="#eaecf0" fontSize="14" fontFamily="monospace" fontWeight="700">
              {formatTime(hours)}
            </text>
          </svg>
        </div>

        <InputField label="Battery Capacity" value={capacity} onChange={setCapacity} unit="mAh" />
        <InputField label="Battery Voltage" value={voltage} onChange={setVoltage} unit="V" />
        <InputField label="Average Load Current" value={current} onChange={setCurrent} unit="mA" />
        <InputField label="Efficiency (regulator losses)" value={efficiency} onChange={setEfficiency} unit="%" />

        {hours && (
          <div className="grid grid-cols-2 gap-2.5 mt-5">
            <ResultBox label="Estimated Runtime" value={formatTime(hours)} color={hours > 24 ? 'green' : hours > 4 ? 'warn' : 'red'} />
            <ResultBox label="Energy Available" value={`${energy.toFixed(1)} Wh`} color="cyan" />
            <ResultBox label="Exact Hours" value={`${hours.toFixed(1)} h`} color="green" />
            <ResultBox label="Power Draw" value={`${(voltF * curF / 1000).toFixed(2)} W`} color="warn" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-[300px]">
        <AIPanel context={{ battery: BATTERIES[battIdx]?.name, capacity_mAh: capacity, voltage, current_mA: current, efficiency_pct: efficiency, runtime_hours: hours?.toFixed(1) }} toolId="battery-life" />
      </div>
    </div>
  );
}
