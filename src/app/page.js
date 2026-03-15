'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import Layout from '@/components/Layout';
import { CALCULATORS, CATEGORIES, searchCalculators, getCalculatorsByCategory, getCalcName, getCalcDesc, getCatName, t } from '@/lib/utils';
import { useLanguage } from '@/lib/LanguageContext';

function SearchBar({ query, setQuery, placeholder }) {
  return (
    <div className="relative max-w-2xl mx-auto">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-sc-dim text-lg">🔍</div>
      <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={placeholder}
        className="w-full bg-sc-surface border border-sc-border rounded-2xl pl-12 pr-4 py-4 text-sc-text text-sm outline-none focus:border-sc-accent/50 focus:shadow-[0_0_20px_rgba(255,140,66,0.08)] transition-all font-display placeholder:text-sc-dim/50" />
      {query && (
        <button onClick={() => setQuery('')}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-sc-dim hover:text-sc-text text-lg cursor-pointer transition-colors">✕</button>
      )}
    </div>
  );
}

function CalculatorCard({ calc, lang }) {
  return (
    <Link href={`/calculators/${calc.id}`}
      className="tool-card block bg-sc-surface border border-sc-border rounded-2xl p-4 no-underline group">
      <div className="flex items-start gap-3">
        <span className="text-2xl mt-0.5">{calc.icon}</span>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-sc-text group-hover:text-sc-accent transition-colors">{getCalcName(calc, lang)}</h3>
          <p className="text-xs text-sc-dim mt-1 leading-relaxed line-clamp-2">{getCalcDesc(calc, lang)}</p>
        </div>
      </div>
      <div className="mt-2.5 flex items-center gap-1.5 text-[9px] text-sc-accent font-semibold uppercase tracking-wider">
        <div className="w-1.5 h-1.5 rounded-full bg-sc-green shadow-[0_0_4px_theme(colors.sc.green)]" />
        {t(lang, 'aiAvailable')}
      </div>
    </Link>
  );
}

function CategorySection({ category, calculators, lang }) {
  if (calculators.length === 0) return null;
  return (
    <section className="mb-8 animate-fade-in">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">{category.icon}</span>
        <h2 className="text-lg font-bold text-sc-text">{getCatName(category, lang)}</h2>
        <span className="text-xs text-sc-dim ml-1">({calculators.length})</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {calculators.map((calc) => <CalculatorCard key={calc.id} calc={calc} lang={lang} />)}
      </div>
    </section>
  );
}

export default function HomePage() {
  const { lang } = useLanguage();
  const [query, setQuery] = useState('');
  const [viewMode, setViewMode] = useState('categories');

  const results = useMemo(() => searchCalculators(query, lang), [query, lang]);
  const isSearching = query.trim().length > 0;

  return (
    <Layout>
      <div className="text-center pt-8 pb-6">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3">
          {t(lang, 'heroTitle')}{' '}
          <span className="text-sc-accent">{t(lang, 'heroHighlight')}</span>
        </h1>
        <p className="text-sc-dim text-sm max-w-lg mx-auto leading-relaxed mb-6">
          {t(lang, 'heroDesc')}
        </p>
        <SearchBar query={query} setQuery={setQuery} placeholder={t(lang, 'searchPlaceholder')} />
        <div className="flex items-center justify-center gap-6 mt-5 text-xs text-sc-dim">
          <span className="flex items-center gap-1.5">
            <span className="text-sc-accent font-bold text-base">{CALCULATORS.length}</span> {t(lang, 'allCalculators').toLowerCase()}
          </span>
          <span className="w-px h-4 bg-sc-border" />
          <span className="flex items-center gap-1.5">
            <span className="text-sc-green font-bold text-base">{CATEGORIES.length}</span> {t(lang, 'categories').toLowerCase()}
          </span>
          <span className="w-px h-4 bg-sc-border" />
          <span className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-sc-green shadow-[0_0_4px_theme(colors.sc.green)] animate-pulse-glow" />
            AI-Powered
          </span>
        </div>
      </div>

      {isSearching ? (
        <div className="max-w-5xl mx-auto">
          <p className="text-sm text-sc-dim mb-4">
            {results.length > 0 ? `${results.length} ${t(lang, 'allCalculators').toLowerCase()}` : t(lang, 'noResults')}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {results.map((calc) => <CalculatorCard key={calc.id} calc={calc} lang={lang} />)}
          </div>
        </div>
      ) : (
        <>
          <div className="flex justify-center gap-2 mb-6">
            <button onClick={() => setViewMode('categories')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                viewMode === 'categories' ? 'bg-sc-accent/10 border-sc-accent text-sc-accent' : 'bg-sc-surface border-sc-border text-sc-dim hover:border-sc-accent/40'
              }`}>{t(lang, 'categories')}</button>
            <button onClick={() => setViewMode('all')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                viewMode === 'all' ? 'bg-sc-accent/10 border-sc-accent text-sc-accent' : 'bg-sc-surface border-sc-border text-sc-dim hover:border-sc-accent/40'
              }`}>{t(lang, 'allCalculators')}</button>
          </div>
          <div className="max-w-5xl mx-auto">
            {viewMode === 'categories'
              ? CATEGORIES.map((cat) => <CategorySection key={cat.id} category={cat} calculators={getCalculatorsByCategory(cat.id)} lang={lang} />)
              : <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">{CALCULATORS.map((calc) => <CalculatorCard key={calc.id} calc={calc} lang={lang} />)}</div>
            }
          </div>
        </>
      )}

      <section className="max-w-2xl mx-auto mt-12 text-sm text-sc-dim leading-relaxed space-y-4">
        <h2 className="text-lg font-bold text-sc-text">{t(lang, 'whyTitle')}</h2>
        <p>{t(lang, 'whyText')}</p>
        <p>{t(lang, 'whyText2')}</p>
      </section>
    </Layout>
  );
}
