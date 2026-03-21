'use client';
import { useState } from 'react';
import InputField from '@/components/InputField';
import ResultBox from '@/components/ResultBox';
import AIPanel from '@/components/AIPanel';
import { formatResistance, formatValue, nearestStandardResistor } from '@/lib/utils';
import { cl } from '@/lib/calcTranslations';
import { useLanguage } from '@/lib/LanguageContext';

export default function LEDResistorCalc() {
  const { lang } = useLanguage();
  const [vs,setVs]=useState('5'),[vf,setVf]=useState('2'),[current,setCurrent]=useState('20');
  const vsF=parseFloat(vs)||0,vfF=parseFloat(vf)||0,curF=parseFloat(current)||0;
  const r=curF>0?(vsF-vfF)/(curF/1000):null;
  const p=r&&r>0?Math.pow(curF/1000,2)*r:null;
  const nearestR=r&&r>0?nearestStandardResistor(r):null;
  const actualI=nearestR?(vsF-vfF)/nearestR:null;
  return (
    <div className="flex gap-5 flex-wrap">
      <div className="flex-1 min-w-[340px] rounded-2xl p-5 border" style={{background:'var(--sc-surface)',borderColor:'var(--sc-border)'}}>
        <InputField label={cl('supplyVoltage',lang)} value={vs} onChange={setVs} unit="V" />
        <InputField label={cl('ledForwardVoltage',lang)} value={vf} onChange={setVf} unit="V" />
        <InputField label={cl('desiredCurrent',lang)} value={current} onChange={setCurrent} unit="mA" />
        {r!==null&&r>0&&(
          <div className="grid grid-cols-2 gap-2.5 mt-5">
            <ResultBox label={cl('exactResistor',lang)} value={formatResistance(Math.round(r))} />
            <ResultBox label={cl('nearestE24',lang)} value={formatResistance(nearestR)} color="green" />
            <ResultBox label={cl('actualCurrent',lang)} value={actualI?`${(actualI*1000).toFixed(1)} mA`:'—'} color="green" />
            <ResultBox label={cl('powerDissipation',lang)} value={p?formatValue(p,'W'):'—'} color="warn" />
          </div>
        )}
        {r!==null&&r<=0&&(<div className="mt-4 rounded-xl p-3 text-sm" style={{background:'rgba(220,38,38,0.1)',border:'1px solid rgba(220,38,38,0.3)',color:'#f87171'}}>⚠️ Supply voltage must be higher than LED forward voltage!</div>)}
      </div>
      <div className="flex-1 min-w-[300px]"><AIPanel context={{supply:vs,vForward:vf,current,resistor:r?.toFixed(1),nearestE24:nearestR}} toolId="led-resistor"/></div>
    </div>
  );
}
