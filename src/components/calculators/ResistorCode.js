'use client';
import { useState } from 'react';
import ResultBox from '@/components/ResultBox';
import AIPanel from '@/components/AIPanel';
import { BAND_COLORS, formatResistance } from '@/lib/utils';
import { cl } from '@/lib/calcTranslations';
import { useLanguage } from '@/lib/LanguageContext';

export default function ResistorCodeCalc() {
  const { lang } = useLanguage();
  const [bands,setBands]=useState([1,0,2]);
  const value=(bands[0]*10+bands[1])*BAND_COLORS[bands[2]].mult;
  const labels=[cl('band1',lang),cl('band2',lang),cl('bandMult',lang)];
  return (
    <div className="flex gap-5 flex-wrap">
      <div className="flex-1 min-w-[340px] rounded-2xl p-5 border" style={{background:'var(--sc-surface)',borderColor:'var(--sc-border)'}}>
        <div className="flex justify-center mb-6">
          <svg viewBox="0 0 320 90" className="w-full max-w-[300px]">
            <line x1="0" y1="45" x2="65" y2="45" stroke="var(--sc-wire)" strokeWidth="2.5"/>
            <line x1="255" y1="45" x2="320" y2="45" stroke="var(--sc-wire)" strokeWidth="2.5"/>
            <rect x="65" y="15" width="190" height="60" rx="12" fill="#c9935a"/>
            <rect x="95" y="12" width="24" height="66" rx="3" fill={BAND_COLORS[bands[0]].hex} stroke="rgba(0,0,0,0.15)" strokeWidth="1"/>
            <rect x="132" y="12" width="24" height="66" rx="3" fill={BAND_COLORS[bands[1]].hex} stroke="rgba(0,0,0,0.15)" strokeWidth="1"/>
            <rect x="169" y="12" width="24" height="66" rx="3" fill={BAND_COLORS[bands[2]].hex} stroke="rgba(0,0,0,0.15)" strokeWidth="1"/>
            <rect x="215" y="12" width="24" height="66" rx="3" fill="#CFB53B" stroke="rgba(0,0,0,0.15)" strokeWidth="1"/>
          </svg>
        </div>
        {labels.map((label,idx)=>(
          <div key={idx} className="mb-4">
            <label className="block text-[11px] font-semibold uppercase tracking-wider mb-2" style={{color:'var(--sc-dim)'}}>{label}</label>
            <div className="flex gap-1.5 flex-wrap">
              {BAND_COLORS.map((color,ci)=>(
                <button key={ci} onClick={()=>{const nb=[...bands];nb[idx]=ci;setBands(nb);}} className="cursor-pointer transition-all"
                  title={`${color.name}`}>
                  <div className="w-8 h-8 rounded-md" style={{backgroundColor:color.hex,border:ci===0?'1px solid #374151':'none',
                    outline:bands[idx]===ci?'2px solid var(--sc-accent)':'none',outlineOffset:'2px',transform:bands[idx]===ci?'scale(1.1)':'scale(1)'}}/>
                </button>
              ))}
            </div>
          </div>
        ))}
        <div className="mt-6"><ResultBox label={cl('resistanceValue',lang)} value={formatResistance(value)}/></div>
      </div>
      <div className="flex-1 min-w-[300px]"><AIPanel context={{band1:BAND_COLORS[bands[0]].name,band2:BAND_COLORS[bands[1]].name,multiplier:BAND_COLORS[bands[2]].name,resistance_ohms:value}} toolId="resistor-code"/></div>
    </div>
  );
}
