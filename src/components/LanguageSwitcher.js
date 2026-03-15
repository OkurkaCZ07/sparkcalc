'use client';
import { useState, useRef, useEffect } from 'react';
import { LANGUAGES } from '@/lib/utils';
import { useLanguage } from '@/lib/LanguageContext';

export default function LanguageSwitcher() {
  const { lang, setLang } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const current = LANGUAGES.find(l => l.code === lang) || LANGUAGES[0];
  useEffect(() => { const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }; document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h); }, []);
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border cursor-pointer transition-all"
        style={{background:'var(--sc-surface2)',borderColor:'var(--sc-border)'}}>
        <span className="text-base">{current.flag}</span>
        <span className="font-medium hidden sm:inline text-xs" style={{color:'var(--sc-text)'}}>{current.code.toUpperCase()}</span>
        <span className="text-[10px]" style={{color:'var(--sc-dim)'}}>▼</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 rounded-xl shadow-2xl shadow-black/40 overflow-hidden z-50 min-w-[160px] animate-fade-in border"
          style={{background:'var(--sc-surface)',borderColor:'var(--sc-border)'}}>
          {LANGUAGES.map((l) => (
            <button key={l.code} onClick={() => { setLang(l.code); setOpen(false); }}
              className="flex items-center gap-2.5 w-full px-3 py-2.5 text-left text-sm transition-all cursor-pointer"
              style={{background:lang===l.code?'color-mix(in srgb, var(--sc-accent) 10%, transparent)':'transparent',color:lang===l.code?'var(--sc-accent)':'var(--sc-text)'}}>
              <span className="text-lg">{l.flag}</span><span className="font-medium">{l.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
