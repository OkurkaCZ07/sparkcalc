'use client';
import { useState } from 'react';
import InputField from '@/components/InputField';
import ResultBox from '@/components/ResultBox';
import AIPanel from '@/components/AIPanel';
import { formatResistance, formatValue } from '@/lib/utils';
import { cl } from '@/lib/calcTranslations';
import { useLanguage } from '@/lib/LanguageContext';

export default function OhmsLawCalc() {
  const { lang } = useLanguage();
  const [mode,setMode]=useState('findR'),[v,setV]=useState('5'),[i,setI]=useState('100'),[r,setR]=useState('');
  const modes=[{id:'findR',label:cl('findR',lang),desc:cl('fromVI',lang)},{id:'findV',label:cl('findV',lang),desc:cl('fromIR',lang)},{id:'findI',label:cl('findI',lang),desc:cl('fromVR',lang)}];
  let voltage,currentA,resistance,power;
  if(mode==='findR'&&v&&i){voltage=parseFloat(v);currentA=parseFloat(i)/1000;resistance=currentA>0?voltage/currentA:null;power=voltage*currentA;}
  else if(mode==='findV'&&i&&r){currentA=parseFloat(i)/1000;resistance=parseFloat(r);voltage=currentA*resistance;power=voltage*currentA;}
  else if(mode==='findI'&&v&&r){voltage=parseFloat(v);resistance=parseFloat(r);currentA=resistance>0?voltage/resistance:null;power=currentA?voltage*currentA:null;}
  return (
    <div className="flex gap-5 flex-wrap">
      <div className="flex-1 min-w-[340px] rounded-2xl p-5 border" style={{background:'var(--sc-surface)',borderColor:'var(--sc-border)'}}>
        <div className="flex gap-2 mb-5">{modes.map(m=>(
          <button key={m.id} onClick={()=>setMode(m.id)} className="flex-1 py-2.5 rounded-lg text-center transition-all cursor-pointer border"
            style={{background:mode===m.id?'color-mix(in srgb, var(--sc-accent) 10%, transparent)':'var(--sc-surface2)',borderColor:mode===m.id?'var(--sc-accent)':'var(--sc-border)',color:mode===m.id?'var(--sc-accent)':'var(--sc-text)'}}>
            <div className="text-xs font-bold">{m.label}</div><div className="text-[9px]" style={{color:'var(--sc-dim)'}}>{m.desc}</div>
          </button>
        ))}</div>
        {mode!=='findV'&&<InputField label={cl('voltage',lang)} value={v} onChange={setV} unit="V"/>}
        {mode!=='findI'&&<InputField label={cl('current',lang)} value={i} onChange={setI} unit="mA"/>}
        {mode!=='findR'&&<InputField label={cl('resistance',lang)} value={r} onChange={setR} unit="Ω"/>}
        <div className="grid grid-cols-2 gap-2.5 mt-5">
          {mode==='findR'&&resistance!==null&&<ResultBox label={cl('resistance',lang)} value={formatResistance(Math.round(resistance))}/>}
          {mode==='findV'&&voltage!==undefined&&<ResultBox label={cl('voltage',lang)} value={`${voltage.toFixed(3)} V`}/>}
          {mode==='findI'&&currentA!==null&&<ResultBox label={cl('current',lang)} value={formatValue(currentA,'A')}/>}
          {power!==null&&power!==undefined&&<ResultBox label={cl('power',lang)} value={formatValue(power,'W')} color="warn"/>}
        </div>
      </div>
      <div className="flex-1 min-w-[300px]"><AIPanel context={{mode,voltage:voltage?.toFixed(3),current_mA:currentA?(currentA*1000).toFixed(2):null,resistance:resistance?.toFixed(1),power:power?.toFixed(4)}} toolId="ohms-law"/></div>
    </div>
  );
}
