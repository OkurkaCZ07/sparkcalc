'use client';
import { useState, useRef, useEffect } from 'react';
import { LANGUAGES } from '@/lib/utils';
import { useLanguage } from '@/lib/LanguageContext';

export default function LanguageSwitcher() {
  const { lang, setLang } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const current = LANGUAGES.find(l => l.code === lang) || LANGUAGES[0];

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-sc-border bg-sc-surface2 hover:border-sc-accent/40 transition-all cursor-pointer text-xs">
        <span className="text-base">{current.flag}</span>
        <span className="text-sc-text font-medium hidden sm:inline">{current.code.toUpperCase()}</span>
        <span className="text-sc-dim text-[10px]">▼</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-sc-surface border border-sc-border rounded-xl shadow-2xl shadow-black/40 overflow-hidden z-50 min-w-[160px] animate-fade-in">
          {LANGUAGES.map((l) => (
            <button key={l.code} onClick={() => { setLang(l.code); setOpen(false); }}
              className={`flex items-center gap-2.5 w-full px-3 py-2.5 text-left text-sm transition-all cursor-pointer ${
                lang === l.code ? 'bg-sc-accent/10 text-sc-accent' : 'text-sc-text hover:bg-sc-surface2'
              }`}>
              <span className="text-lg">{l.flag}</span>
              <span className="font-medium">{l.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
