'use client';
import { useState, useCallback, useEffect } from 'react';
import { askAI, getSuggestions } from '@/lib/ai';
import { checkAILimit, recordAIUsage } from '@/lib/rateLimit';
import { al } from '@/lib/calcTranslations';
import { useLanguage } from '@/lib/LanguageContext';

export default function AIPanel({ context, toolId }) {
  const { lang } = useLanguage();
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [customQ, setCustomQ] = useState('');
  const [limit, setLimit] = useState({ remaining: 5, limit: 5 });

  useEffect(() => { setLimit(checkAILimit()); }, [response]);

  const ask = useCallback(async (question) => {
    const { allowed } = checkAILimit();
    if (!allowed) { setError(al('limitReached', lang)); return; }
    setLoading(true); setResponse(''); setError('');
    try { const text = await askAI(question, toolId, context); recordAIUsage(); setResponse(text); }
    catch (e) { setError(al('error', lang)); }
    setLoading(false);
  }, [context, toolId, lang]);

  const suggestions = getSuggestions(toolId, lang);

  const renderText = (text) => {
    return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) return <strong key={i} style={{color:'var(--sc-accent)', fontWeight:600}}>{part.slice(2, -2)}</strong>;
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className="rounded-2xl border p-4 flex flex-col min-h-[300px]" style={{background:'var(--sc-surface)', borderColor:'var(--sc-border)'}}>
      <div className="flex items-center justify-between gap-2 mb-3 pb-3 border-b" style={{borderColor:'var(--sc-border)'}}>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full animate-pulse-glow" style={{background:'var(--sc-green)',boxShadow:'0 0 6px var(--sc-green)'}} />
          <span className="font-bold text-[13px] tracking-wider" style={{color:'var(--sc-text)'}}>SPARK<span style={{color:'var(--sc-accent)'}}>CALC</span> AI</span>
        </div>
        <span className="text-[10px] font-mono" style={{color:'var(--sc-dim)'}}>{limit.remaining}/{limit.limit} {al('leftToday', lang)}</span>
      </div>

      {!response && !loading && !error && (
        <div className="flex-1">
          <p className="text-xs mb-2.5" style={{color:'var(--sc-dim)'}}>{al('askAbout', lang)}</p>
          {suggestions.map((q, i) => (
            <button key={i} onClick={() => ask(q)}
              className="block w-full text-left rounded-lg px-3 py-2.5 text-xs mb-1.5 transition-all cursor-pointer border"
              style={{background:'var(--sc-surface2)', borderColor:'var(--sc-border)', color:'var(--sc-text)'}}>{q}</button>
          ))}
        </div>
      )}

      {loading && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{borderColor:'var(--sc-accent)', borderTopColor:'transparent'}} />
          <span className="text-sm" style={{color:'var(--sc-dim)'}}>{al('analyzing', lang)}</span>
        </div>
      )}

      {error && !loading && (
        <div className="flex-1 animate-fade-in">
          <div className="rounded-lg p-3 text-sm" style={{background:'rgba(220,38,38,0.1)', border:'1px solid rgba(220,38,38,0.3)', color:'#f87171'}}>{error}</div>
          <button onClick={() => setError('')} className="mt-3 text-xs cursor-pointer hover:underline" style={{color:'var(--sc-accent)'}}>{al('back', lang)}</button>
        </div>
      )}

      {response && !loading && (
        <div className="flex-1 animate-fade-in overflow-auto">
          {response.split('\n').filter(Boolean).map((p, i) => (
            <p key={i} className="text-[13px] leading-relaxed mb-2.5" style={{color:'var(--sc-text)'}}>{renderText(p)}</p>
          ))}
          <button onClick={() => setResponse('')} className="mt-2 text-xs cursor-pointer hover:underline" style={{color:'var(--sc-accent)'}}>{al('askAnother', lang)}</button>
        </div>
      )}

      <div className="flex gap-1.5 mt-3 pt-3 border-t" style={{borderColor:'var(--sc-border)'}}>
        <input value={customQ} onChange={(e) => setCustomQ(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && customQ.trim()) { ask(customQ.trim()); setCustomQ(''); } }}
          placeholder={al('placeholder', lang)}
          className="flex-1 rounded-lg px-3 py-2 text-xs outline-none transition-colors font-display"
          style={{background:'var(--sc-surface2)', border:'1px solid var(--sc-border)', color:'var(--sc-text)'}} />
        <button onClick={() => { if (customQ.trim()) { ask(customQ.trim()); setCustomQ(''); } }}
          className="rounded-lg w-9 font-bold text-lg cursor-pointer flex items-center justify-center border-none"
          style={{background:'var(--sc-accent)', color:'var(--sc-bg)'}}>→</button>
      </div>
    </div>
  );
}
