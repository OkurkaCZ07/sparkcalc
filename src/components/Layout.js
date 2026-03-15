'use client';
import Link from 'next/link';
import Navigation from './Navigation';
import AdBanner from './AdBanner';

export default function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Warm accent bar */}
      <div className="accent-bar" />

      {/* Header */}
      <header className="flex justify-between items-center px-5 py-3 border-b border-sc-border bg-sc-surface">
        <Link href="/" className="flex items-center gap-2.5 no-underline">
          <img src="/icon.svg" alt="SparkCalc" className="w-9 h-9" />
          <div>
            <div className="text-xl font-bold tracking-tight">Spark<span className="text-sc-accent">Calc</span></div>
            <div className="text-[9px] text-sc-dim uppercase tracking-[0.2em]">AI-Powered Electronics Toolkit</div>
          </div>
        </Link>
        <div className="text-[11px] font-semibold text-sc-accent border border-sc-accent/30 rounded-full px-3 py-1 bg-sc-accent/5 hidden sm:block">
          ✦ AI-Enhanced
        </div>
      </header>

      <Navigation />

      <div className="px-5 py-3"><AdBanner slot="top" /></div>

      <main className="flex-1 px-5 pb-5 animate-fade-in">{children}</main>

      <div className="px-5 py-3"><AdBanner slot="inline" /></div>

      <footer className="px-5 py-4 text-center text-[11px] text-sc-dim border-t border-sc-border space-y-1">
        <p>SparkCalc © {new Date().getFullYear()} · Free electronics calculators with AI-powered insights</p>
        <p className="text-sc-dim/50">
          Affiliate links may earn commission · Powered by Claude AI ·{' '}
          <Link href="/privacy" className="hover:text-sc-accent transition-colors">Privacy</Link>
          {' · '}
          <Link href="/terms" className="hover:text-sc-accent transition-colors">Terms</Link>
        </p>
      </footer>
    </div>
  );
}
