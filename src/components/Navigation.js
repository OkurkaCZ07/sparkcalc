'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CALCULATORS, getCalcName } from '@/lib/utils';
import { useLanguage } from '@/lib/LanguageContext';

export default function Navigation() {
  const pathname = usePathname();
  const { lang } = useLanguage();
  return (
    <nav className="flex gap-2 px-5 py-3 overflow-x-auto border-b" style={{background:'var(--sc-surface)',borderColor:'var(--sc-border)'}}>
      {CALCULATORS.map((calc) => {
        const href = `/calculators/${calc.id}`;
        const active = pathname === href;
        return (
          <Link key={calc.id} href={href}
            className="flex flex-col items-center gap-1 px-4 py-2.5 rounded-xl border min-w-[85px] shrink-0 transition-all tool-card no-underline"
            style={{borderColor:active?'var(--sc-accent)':'var(--sc-border)',background:active?'color-mix(in srgb, var(--sc-accent) 8%, transparent)':'var(--sc-surface)'}}>
            <span className="text-lg">{calc.icon}</span>
            <span className="text-[10px] font-semibold leading-tight text-center" style={{color:active?'var(--sc-accent)':'var(--sc-text)'}}>{getCalcName(calc, lang)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
