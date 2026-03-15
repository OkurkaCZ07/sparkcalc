'use client';
import { useState } from 'react';
import InputField from '@/components/InputField';
import ResultBox from '@/components/ResultBox';
import AIPanel from '@/components/AIPanel';
import { cl } from '@/lib/calcTranslations';
import { useLanguage } from '@/lib/LanguageContext';

export default function PCBTraceCalc() {
  const { lang } = useLanguage();
  const [current,setCurrent]=useState('1'),[tempRise,setTempRise]=useState('10'),[thickness,setThickness]=useState('1'),[layer,setLayer]=useState('external');
  const iF=parseFloat(current)||0,dtF=parseFloat(tempRise)||0,thickMil=(parseFloat(thickness)||0)*1.378;
  const k=layer==='external'?0.048:0.024;
  let area=null,widthMil=null,widthMm=null;
  if(iF>0&&dtF>0&&thickMil>0){area=Math.pow(iF/(k*Math.pow(dtF,0.44)),1/0.725);widthMil=area/thickMil;widthMm=widthMil*0.0254;}
  return (
    <div className="flex gap-5 flex-wrap">
      <div className="flex-1 min-w-[340px] rounded-2xl p-5 border" style={{background:'var(--sc-surface)',borderColor:'var(--sc-border)'}}>
        <div className="flex gap-2 mb-5">{['external','internal'].map(t=>(
          <button key={t} onClick={()=>setLayer(t)} className="flex-1 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer border"
            style={{background:layer===t?'color-mix(in srgb, var(--sc-accent) 10%, transparent)':'var(--sc-surface2)',borderColor:layer===t?'var(--sc-accent)':'var(--sc-border)',color:layer===t?'var(--sc-accent)':'var(--sc-dim)'}}>
            {t==='external'?cl('externalLayer',lang):cl('internalLayer',lang)}
          </button>
        ))}</div>
        <InputField label={cl('current',lang)} value={current} onChange={setCurrent} unit="A"/>
        <InputField label={cl('tempRise',lang)} value={tempRise} onChange={setTempRise} unit="°C"/>
        <InputField label={cl('copperThickness',lang)} value={thickness} onChange={setThickness} unit="oz"/>
        {widthMm&&(<div className="grid grid-cols-2 gap-2.5 mt-5">
          <ResultBox label={cl('traceWidth',lang)} value={`${widthMm.toFixed(2)} mm`}/>
          <ResultBox label="Width (mil)" value={`${widthMil.toFixed(1)} mil`} color="cyan"/>
        </div>)}
      </div>
      <div className="flex-1 min-w-[300px]"><AIPanel context={{current_A:current,tempRise_C:tempRise,copperOz:thickness,layer,traceWidth_mm:widthMm?.toFixed(3)}} toolId="pcb-trace"/></div>
    </div>
  );
}
