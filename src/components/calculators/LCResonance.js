'use client';
import { useState } from 'react';
import InputField from '@/components/InputField';
import ResultBox from '@/components/ResultBox';
import AIPanel from '@/components/AIPanel';
import { formatValue } from '@/lib/utils';
import { cl } from '@/lib/calcTranslations';
import { useLanguage } from '@/lib/LanguageContext';

export default function LCResonanceCalc() {
  const { lang } = useLanguage();
  const [l,setL]=useState('100'),[c,setC]=useState('100');
  const lH=(parseFloat(l)||0)*1e-6,cF=(parseFloat(c)||0)*1e-12;
  const freq=lH>0&&cF>0?1/(2*Math.PI*Math.sqrt(lH*cF)):null;
  const Z=lH>0&&cF>0?Math.sqrt(lH/cF):null;
  return (
    <div className="flex gap-5 flex-wrap">
      <div className="flex-1 min-w-[340px] rounded-2xl p-5 border" style={{background:'var(--sc-surface)',borderColor:'var(--sc-border)'}}>
        <InputField label={cl('inductance',lang)+' (L)'} value={l} onChange={setL} unit="µH"/>
        <InputField label={cl('capacitance',lang)+' (C)'} value={c} onChange={setC} unit="pF"/>
        {freq&&(<div className="grid grid-cols-2 gap-2.5 mt-5">
          <ResultBox label={cl('resonantFrequency',lang)} value={formatValue(freq,'Hz')}/>
          <ResultBox label={cl('characteristicImpedance',lang)} value={formatValue(Z,'Ω')} color="cyan"/>
          <ResultBox label={cl('angularFrequency',lang)} value={formatValue(freq*2*Math.PI,'rad/s')} color="green"/>
          <ResultBox label={cl('wavelength',lang)} value={formatValue(3e8/freq,'m')} color="warn"/>
        </div>)}
      </div>
      <div className="flex-1 min-w-[300px]"><AIPanel context={{inductance_uH:l,capacitance_pF:c,resonantFreq_Hz:freq?.toFixed(2)}} toolId="lc-resonance"/></div>
    </div>
  );
}
