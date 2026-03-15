'use client';
import { useState } from 'react';
import InputField from '@/components/InputField';
import ResultBox from '@/components/ResultBox';
import AIPanel from '@/components/AIPanel';
import { cl } from '@/lib/calcTranslations';
import { useLanguage } from '@/lib/LanguageContext';

const BATTERIES=[{name:'CR2032',capacity:220,voltage:3.0},{name:'AA Alkaline',capacity:2500,voltage:1.5},{name:'AAA Alkaline',capacity:1000,voltage:1.5},{name:'18650 Li-ion',capacity:3000,voltage:3.7},{name:'9V Block',capacity:500,voltage:9.0},{name:'LiPo 1S 1000mAh',capacity:1000,voltage:3.7},{name:'Custom',capacity:0,voltage:0}];

export default function BatteryLifeCalc() {
  const { lang } = useLanguage();
  const [battIdx,setBattIdx]=useState(3),[capacity,setCapacity]=useState('3000'),[voltage,setVoltage]=useState('3.7'),[current,setCurrent]=useState('150'),[efficiency,setEfficiency]=useState('85');
  const capF=parseFloat(capacity)||0,curF=parseFloat(current)||0,effF=(parseFloat(efficiency)||100)/100,voltF=parseFloat(voltage)||0;
  const hours=curF>0?(capF*effF)/curF:null;
  const energy=capF*voltF/1000;
  const selectBattery=(idx)=>{setBattIdx(idx);const b=BATTERIES[idx];if(b.capacity>0){setCapacity(String(b.capacity));setVoltage(String(b.voltage));}};
  const fmtTime=(h)=>{if(!h)return'—';if(h<1)return`${(h*60).toFixed(0)} min`;if(h<48)return`${h.toFixed(1)} h`;if(h<720)return`${(h/24).toFixed(1)} d`;return`${(h/24/30).toFixed(1)} mo`;};
  return (
    <div className="flex gap-5 flex-wrap">
      <div className="flex-1 min-w-[340px] rounded-2xl p-5 border" style={{background:'var(--sc-surface)',borderColor:'var(--sc-border)'}}>
        <div className="mb-4">
          <label className="block text-[11px] font-semibold uppercase tracking-wider mb-2" style={{color:'var(--sc-dim)'}}>{cl('batteryType',lang)}</label>
          <div className="flex gap-1.5 flex-wrap">{BATTERIES.map((b,i)=>(
            <button key={i} onClick={()=>selectBattery(i)} className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer border"
              style={{background:battIdx===i?'color-mix(in srgb, var(--sc-accent) 10%, transparent)':'var(--sc-surface2)',borderColor:battIdx===i?'var(--sc-accent)':'var(--sc-border)',color:battIdx===i?'var(--sc-accent)':'var(--sc-dim)'}}>{b.name}</button>
          ))}</div>
        </div>
        <InputField label={cl('batteryCapacity',lang)} value={capacity} onChange={setCapacity} unit="mAh"/>
        <InputField label={cl('batteryVoltage',lang)} value={voltage} onChange={setVoltage} unit="V"/>
        <InputField label={cl('loadCurrent',lang)} value={current} onChange={setCurrent} unit="mA"/>
        <InputField label={cl('efficiency',lang)} value={efficiency} onChange={setEfficiency} unit="%"/>
        {hours&&(<div className="grid grid-cols-2 gap-2.5 mt-5">
          <ResultBox label={cl('estimatedRuntime',lang)} value={fmtTime(hours)} color={hours>24?'green':hours>4?'warn':'red'}/>
          <ResultBox label={cl('energyAvailable',lang)} value={`${energy.toFixed(1)} Wh`} color="cyan"/>
          <ResultBox label={cl('power',lang)} value={`${hours.toFixed(1)} h`} color="green"/>
          <ResultBox label={cl('powerDraw',lang)} value={`${(voltF*curF/1000).toFixed(2)} W`} color="warn"/>
        </div>)}
      </div>
      <div className="flex-1 min-w-[300px]"><AIPanel context={{battery:BATTERIES[battIdx]?.name,capacity_mAh:capacity,voltage,current_mA:current,efficiency_pct:efficiency,runtime_hours:hours?.toFixed(1)}} toolId="battery-life"/></div>
    </div>
  );
}
