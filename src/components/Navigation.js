'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CALCULATORS } from '@/lib/utils';

export default function Navigation() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-2 px-5 py-3 overflow-x-auto bg-sc-surface border-b border-sc-border">
      {CALCULATORS.map((calc) => {
        const href = `/calculators/${calc.id}`;
        const active = pathname === href;
        return (
          <Link key={calc.id} href={href}
            className={`flex flex-col items-center gap-1 px-4 py-2.5 rounded-xl border min-w-[85px] shrink-0 transition-all tool-card no-underline ${
              active ? 'border-sc-accent bg-sc-accent/[0.08]' : 'border-sc-border bg-sc-surface hover:border-sc-accent/40 hover:bg-sc-surface2'
            }`}>
            <span className="text-lg">{calc.icon}</span>
            <span className={`text-[10px] font-semibold leading-tight text-center ${active ? 'text-sc-accent' : 'text-sc-text'}`}>{calc.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}
