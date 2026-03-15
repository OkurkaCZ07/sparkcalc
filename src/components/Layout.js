'use client';
import Link from 'next/link';
import Navigation from './Navigation';
import AdBanner from './AdBanner';
import LanguageSwitcher from './LanguageSwitcher';
import { useTheme } from '@/lib/ThemeContext';
import { useLanguage } from '@/lib/LanguageContext';
import { ui } from '@/lib/calcTranslations';

export default function Layout({ children }) {
  const { theme, toggleTheme } = useTheme();
  const { lang } = useLanguage();

  return (
    <div className="min-h-screen flex flex-col">
      <div className="accent-bar" />
      <header className="flex justify-between items-center px-5 py-3 border-b" style={{ background:'var(--sc-surface)', borderColor:'var(--sc-border)' }}>
        <Link href="/" className="flex items-center gap-2.5 no-underline">
          <img src="/icon.svg" alt="SparkCalc" className="w-9 h-9" />
          <div>
            <div className="text-xl font-bold tracking-tight" style={{color:'var(--sc-text)'}}>Spark<span style={{color:'var(--sc-accent)'}}>Calc</span></div>
            <div className="text-[9px] uppercase tracking-[0.2em]" style={{color:'var(--sc-dim)'}}>{ui('headerSubtitle', lang)}</div>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <div className="text-[11px] font-semibold rounded-full px-3 py-1 hidden md:block" style={{color:'var(--sc-accent)', border:'1px solid color-mix(in srgb, var(--sc-accent) 30%, transparent)', background:'color-mix(in srgb, var(--sc-accent) 5%, transparent)'}}>✦ AI-Enhanced</div>
          <button onClick={toggleTheme} title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
            className="flex items-center justify-center w-9 h-9 rounded-lg border cursor-pointer transition-all hover:opacity-80"
            style={{ background:'var(--sc-surface2)', borderColor:'var(--sc-border)' }}>
            <span className="text-lg">{theme === 'dark' ? '☀️' : '🌙'}</span>
          </button>
          <LanguageSwitcher />
        </div>
      </header>
      <Navigation />
      <div className="px-5 py-3"><AdBanner slot="top" /></div>
      <main className="flex-1 px-5 pb-5 animate-fade-in">{children}</main>
      <div className="px-5 py-3"><AdBanner slot="inline" /></div>
      <footer className="px-5 py-4 text-center text-[11px] border-t" style={{color:'var(--sc-dim)', borderColor:'var(--sc-border)'}}>
        <p>SparkCalc © {new Date().getFullYear()} · Free electronics calculators with AI-powered insights</p>
        <p style={{color:'color-mix(in srgb, var(--sc-dim) 60%, transparent)'}}>Powered by Claude AI · <Link href="/privacy" className="hover:underline" style={{color:'var(--sc-dim)'}}>Privacy</Link> · <Link href="/terms" className="hover:underline" style={{color:'var(--sc-dim)'}}>Terms</Link></p>
      </footer>
    </div>
  );
}
