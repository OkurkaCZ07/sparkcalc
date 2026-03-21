'use client';
import { useState } from 'react';
import InputField from '@/components/InputField';
import ResultBox from '@/components/ResultBox';
import AIPanel from '@/components/AIPanel';
import { formatValue } from '@/lib/utils';
import { cl } from '@/lib/calcTranslations';
import { useLanguage } from '@/lib/LanguageContext';

export default function MOSFETPowerCalc() {
  const { lang } = useLanguage();
  const [rdson,setRdson]=useState('40'),[id,setId]=useState('5'),[ta,setTa]=useState('25'),[rthjc,setRthjc]=useState('1'),[rthhs,setRthhs]=useState('5');
  const pDiss=(parseFloat(rdson)||0)/1000*Math.pow(parseFloat(id)||0,2);
  const needsHs=pDiss>1;
  const tj=pDiss>0?(parseFloat(ta)||0)+pDiss*((parseFloat(rthjc)||0)+(needsHs?(parseFloat(rthhs)||0):40)):null;
  return (
    <div className="flex gap-5 flex-wrap">
      <div className="flex-1 min-w-[340px] rounded-2xl p-5 border" style={{background:'var(--sc-surface)',borderColor:'var(--sc-border)'}}>
        <InputField label={cl('rdson',lang)} value={rdson} onChange={setRdson} unit="mΩ"/>
        <InputField label={cl('drainCurrent',lang)} value={id} onChange={setId} unit="A"/>
        <InputField label={cl('ambientTemp',lang)} value={ta} onChange={setTa} unit="°C"/>
        <InputField label={cl('thermalRes',lang)} value={rthjc} onChange={setRthjc} unit="°C/W"/>
        {needsHs&&<InputField label="Heatsink Rθhs" value={rthhs} onChange={setRthhs} unit="°C/W"/>}
        {pDiss>0&&(
          <div className="grid grid-cols-2 gap-2.5 mt-5">
            <ResultBox label={cl('powerDissipation',lang)} value={formatValue(pDiss,'W')} color={pDiss>2?'warn':'green'}/>
            <ResultBox label={cl('junctionTemp',lang)} value={`${tj?.toFixed(1)} °C`} color={tj>125?'red':'green'}/>
            <ResultBox label={cl('heatsinkNeeded',lang)} value={needsHs?cl('yes',lang):cl('no',lang)} color={needsHs?'warn':'green'}/>
            <ResultBox label={cl('safetyMargin',lang)} value={tj?`${(150-tj).toFixed(0)}°C`:'—'} color={tj>125?'red':'green'}/>
          </div>
        )}
      </div>
      <div className="flex-1 min-w-[300px]"><AIPanel context={{rdson_mOhm:rdson,drainCurrent_A:id,ambientTemp_C:ta,thermalRes_jc:rthjc,powerDiss_W:pDiss.toFixed(3),junctionTemp_C:tj?.toFixed(1)}} toolId="mosfet-power"/></div>
    </div>
  );
}
