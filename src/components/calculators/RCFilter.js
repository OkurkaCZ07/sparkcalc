'use client';
import { useState } from 'react';
import InputField from '@/components/InputField';
import ResultBox from '@/components/ResultBox';
import AIPanel from '@/components/AIPanel';
import { formatValue } from '@/lib/utils';
import { cl } from '@/lib/calcTranslations';
import { useLanguage } from '@/lib/LanguageContext';

export default function RCFilterCalc() {
  const { lang } = useLanguage();
  const [r,setR]=useState('10000'),[c,setC]=useState('100'),[ft,setFt]=useState('low');
  const rF=parseFloat(r)||0,cF=(parseFloat(c)||0)*1e-9;
  const fc=rF>0&&cF>0?1/(2*Math.PI*rF*cF):null;
  const tau=rF>0&&cF>0?rF*cF:null;
  return (
    <div className="flex gap-5 flex-wrap">
      <div className="flex-1 min-w-[340px] rounded-2xl p-5 border" style={{background:'var(--sc-surface)',borderColor:'var(--sc-border)'}}>
        <div className="flex gap-2 mb-5">{['low','high'].map(t=>(
          <button key={t} onClick={()=>setFt(t)} className="flex-1 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer border"
            style={{background:ft===t?'color-mix(in srgb, var(--sc-accent) 10%, transparent)':'var(--sc-surface2)',borderColor:ft===t?'var(--sc-accent)':'var(--sc-border)',color:ft===t?'var(--sc-accent)':'var(--sc-dim)'}}>
            {t==='low'?cl('lowPass',lang):cl('highPass',lang)}
          </button>
        ))}</div>
        <InputField label={cl('resistance',lang)+' (R)'} value={r} onChange={setR} unit="Ω"/>
        <InputField label={cl('capacitance',lang)+' (C)'} value={c} onChange={setC} unit="nF"/>
        {fc&&(<div className="grid grid-cols-2 gap-2.5 mt-5">
          <ResultBox label={cl('cutoffFrequency',lang)} value={formatValue(fc,'Hz')}/>
          <ResultBox label={cl('timeConstant',lang)} value={formatValue(tau,'s')} color="green"/>
        </div>)}
      </div>
      <div className="flex-1 min-w-[300px]"><AIPanel context={{resistance:r,capacitance_nF:c,cutoff_Hz:fc?.toFixed(2),filterType:ft}} toolId="rc-filter"/></div>
    </div>
  );
}
