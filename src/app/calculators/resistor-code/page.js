'use client';
import Layout from '@/components/Layout';
import ResistorCodeCalc from '@/components/calculators/ResistorCode';
import { CALCULATORS, getCalcName, getCalcDesc } from '@/lib/utils';
import { useLanguage } from '@/lib/LanguageContext';
import { ui } from '@/lib/calcTranslations';

export default function Page() {
  const { lang } = useLanguage();
  const calc = CALCULATORS.find(c => c.id === 'resistor-code');
  return (
    <Layout>
      <div className="mb-5">
        <h1 className="text-2xl font-bold tracking-tight" style={{color:'var(--sc-text)'}}>
          {calc.icon} {getCalcName(calc, lang)} <span style={{color:'var(--sc-accent)'}}>{ui('decoder', lang)}</span>
        </h1>
        <p className="text-sm mt-1" style={{color:'var(--sc-dim)'}}>{getCalcDesc(calc, lang)}</p>
      </div>
      <ResistorCodeCalc />
    </Layout>
  );
}
