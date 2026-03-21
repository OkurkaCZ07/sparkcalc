'use client';
import Layout from '@/components/Layout';
import PCBTraceCalc from '@/components/calculators/PCBTrace';
import { CALCULATORS, getCalcName, getCalcDesc } from '@/lib/utils';
import { useLanguage } from '@/lib/LanguageContext';
import { ui } from '@/lib/calcTranslations';

export default function Page() {
  const { lang } = useLanguage();
  const calc = CALCULATORS.find(c => c.id === 'pcb-trace');
  return (
    <Layout>
      <div className="mb-5">
        <h1 className="text-2xl font-bold tracking-tight" style={{color:'var(--sc-text)'}}>
          {calc.icon} {getCalcName(calc, lang)} <span style={{color:'var(--sc-accent)'}}>{ui('calculator', lang)}</span>
        </h1>
        <p className="text-sm mt-1" style={{color:'var(--sc-dim)'}}>{getCalcDesc(calc, lang)}</p>
      </div>
      <PCBTraceCalc />
    </Layout>
  );
}
