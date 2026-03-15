'use client';

import { useState } from 'react';
import InputField from '@/components/InputField';
import ResultBox from '@/components/ResultBox';
import AIPanel from '@/components/AIPanel';
import { formatValue } from '@/lib/utils';

export default function MOSFETPowerCalc() {
  const [rdson, setRdson] = useState('40');
  const [id, setId] = useState('5');
  const [ta, setTa] = useState('25');
  const [rthjc, setRthjc] = useState('1');
  const [rthhs, setRthhs] = useState('5');

  const rdsF = parseFloat(rdson) || 0;
  const idF = parseFloat(id) || 0;
  const taF = parseFloat(ta) || 0;
  const rthjcF = parseFloat(rthjc) || 0;
  const rthhsF = parseFloat(rthhs) || 0;

  const pDiss = (rdsF / 1000) * Math.pow(idF, 2);
  const tjNoHs = pDiss > 0 ? taF + pDiss * (rthjcF + 40) : null; // 40°C/W typical without heatsink
  const tjWithHs = pDiss > 0 ? taF + pDiss * (rthjcF + rthhsF) : null;

  const tjDisplay = tjWithHs || tjNoHs;
  const needsHeatsink = pDiss > 1;

  const getTempColor = (tj) => {
    if (!tj) return 'green';
    if (tj > 150) return 'red';
    if (tj > 100) return 'warn';
    return 'green';
  };

  return (
    <div className="flex gap-5 flex-wrap">
      <div className="flex-1 min-w-[340px] bg-sc-surface rounded-2xl p-5 border border-sc-border">
        {/* MOSFET visual */}
        <div className="flex justify-center mb-5">
          <svg viewBox="0 0 200 140" className="w-full max-w-[180px]">
            {/* Gate */}
            <line x1="20" y1="70" x2="60" y2="70" stroke="#94a3b8" strokeWidth="2" />
            <line x1="60" y1="40" x2="60" y2="100" stroke="#94a3b8" strokeWidth="3" />
            <line x1="70" y1="40" x2="70" y2="55" stroke="#94a3b8" strokeWidth="2" />
            <line x1="70" y1="60" x2="70" y2="80" stroke="#94a3b8" strokeWidth="2" />
            <line x1="70" y1="85" x2="70" y2="100" stroke="#94a3b8" strokeWidth="2" />
            <text x="15" y="74" fill="#7a8599" fontSize="10" fontFamily="monospace">G</text>
            {/* Drain */}
            <line x1="70" y1="40" x2="130" y2="40" stroke="#94a3b8" strokeWidth="2" />
            <line x1="130" y1="10" x2="130" y2="40" stroke="#94a3b8" strokeWidth="2" />
            <text x="140" y="15" fill="#00d4ff" fontSize="10" fontFamily="monospace" fontWeight="700">D</text>
            {/* Source */}
            <line x1="70" y1="100" x2="130" y2="100" stroke="#94a3b8" strokeWidth="2" />
            <line x1="130" y1="100" x2="130" y2="130" stroke="#94a3b8" strokeWidth="2" />
            <text x="140" y="105" fill="#22c55e" fontSize="10" fontFamily="monospace" fontWeight="700">S</text>
            {/* Arrow */}
            <polygon points="70,70 82,65 82,75" fill="#94a3b8" />
            {/* Body diode */}
            <line x1="90" y1="45" x2="90" y2="55" stroke="#94a3b8" strokeWidth="1.5" />
            <line x1="90" y1="85" x2="90" y2="95" stroke="#94a3b8" strokeWidth="1.5" />
            {/* Power indicator */}
            {pDiss > 0 && (
              <text x="100" y="75" textAnchor="middle" fill={pDiss > 2 ? '#f59e0b' : '#22c55e'} fontSize="12" fontFamily="monospace" fontWeight="700">
                {formatValue(pDiss, 'W')}
              </text>
            )}
          </svg>
        </div>

        <InputField label="Rds(on) — On-State Resistance" value={rdson} onChange={setRdson} unit="mΩ" />
        <InputField label="Drain Current (Id)" value={id} onChange={setId} unit="A" />
        <InputField label="Ambient Temperature" value={ta} onChange={setTa} unit="°C" />
        <InputField label="Thermal Resistance Rθjc" value={rthjc} onChange={setRthjc} unit="°C/W" />
        {needsHeatsink && (
          <InputField label="Heatsink Rθhs (if used)" value={rthhs} onChange={setRthhs} unit="°C/W" />
        )}

        {pDiss > 0 && (
          <div className="grid grid-cols-2 gap-2.5 mt-5">
            <ResultBox label="Power Dissipation" value={formatValue(pDiss, 'W')} color={pDiss > 2 ? 'warn' : 'green'} />
            <ResultBox
              label={needsHeatsink ? 'Tj (with heatsink)' : 'Junction Temp'}
              value={`${tjDisplay?.toFixed(1)} °C`}
              color={getTempColor(tjDisplay)}
            />
            <ResultBox
              label="Heatsink Needed?"
              value={needsHeatsink ? 'YES' : 'No'}
              color={needsHeatsink ? 'warn' : 'green'}
            />
            <ResultBox
              label="Safety Margin"
              value={tjDisplay ? `${(150 - tjDisplay).toFixed(0)}°C to max` : '—'}
              color={getTempColor(tjDisplay)}
            />
          </div>
        )}

        {tjDisplay && tjDisplay > 150 && (
          <div className="mt-3 bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-sm text-red-400">
            ⚠️ Junction temperature exceeds 150°C! This will damage the MOSFET. Use a better heatsink or a MOSFET with lower Rds(on).
          </div>
        )}
      </div>

      <div className="flex-1 min-w-[300px]">
        <AIPanel
          context={{
            rdson_mOhm: rdson,
            drainCurrent_A: id,
            ambientTemp_C: ta,
            thermalRes_jc: rthjc,
            thermalRes_hs: needsHeatsink ? rthhs : 'no heatsink',
            powerDiss_W: pDiss.toFixed(3),
            junctionTemp_C: tjDisplay?.toFixed(1),
            needsHeatsink,
          }}
          toolId="mosfet-power"
        />
      </div>
    </div>
  );
}
