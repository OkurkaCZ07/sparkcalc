'use client';
import { useState } from 'react';
import InputField from '@/components/InputField';
import ResultBox from '@/components/ResultBox';
import AIPanel from '@/components/AIPanel';
import { formatValue } from '@/lib/utils';
import { cl } from '@/lib/calcTranslations';
import { useLanguage } from '@/lib/LanguageContext';

export default function Timer555Calc() {
  const { lang } = useLanguage();
  const [r1,setR1]=useState('10000'),[r2,setR2]=useState('10000'),[c,setC]=useState('100');
  const r1F=parseFloat(r1)||0,r2F=parseFloat(r2)||0,cF=(parseFloat(c)||0)*1e-9;
  const tH=cF>0?0.693*(r1F+r2F)*cF:null,tL=cF>0?0.693*r2F*cF:null;
  const period=tH&&tL?tH+tL:null,freq=period?1/period:null,duty=tH&&period?(tH/period)*100:null;
  return (
    <div className="flex gap-5 flex-wrap">
      <div className="flex-1 min-w-[340px] rounded-2xl p-5 border" style={{background:'var(--sc-surface)',borderColor:'var(--sc-border)'}}>
        <InputField label={cl('resistorR1',lang)} value={r1} onChange={setR1} unit="Ω"/>
        <InputField label={cl('resistorR2',lang)} value={r2} onChange={setR2} unit="Ω"/>
        <InputField label={cl('capacitorC',lang)} value={c} onChange={setC} unit="nF"/>
        {freq&&(<div className="grid grid-cols-2 gap-2.5 mt-5">
          <ResultBox label={cl('frequency',lang)} value={formatValue(freq,'Hz')}/>
          <ResultBox label={cl('period',lang)} value={formatValue(period,'s')} color="cyan"/>
          <ResultBox label={cl('dutyCycle',lang)} value={`${duty?.toFixed(1)}%`} color={Math.abs(duty-50)<5?'green':'warn'}/>
          <ResultBox label={cl('timeHigh',lang)} value={formatValue(tH,'s')} color="green"/>
          <ResultBox label={cl('timeLow',lang)} value={formatValue(tL,'s')} color="green"/>
        </div>)}
      </div>
      <div className="flex-1 min-w-[300px]"><AIPanel context={{R1:r1,R2:r2,C_nF:c,frequency:freq?.toFixed(2),dutyCycle:duty?.toFixed(1)}} toolId="555-timer"/></div>
    </div>
  );
}
