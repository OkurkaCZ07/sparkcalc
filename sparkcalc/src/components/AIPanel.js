'use client';
import { useState, useCallback, useEffect } from 'react';
import { askAI, AI_SUGGESTIONS } from '@/lib/ai';
import { checkAILimit, recordAIUsage } from '@/lib/rateLimit';

export default function AIPanel({ context, toolId }) {
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [customQ, setCustomQ] = useState('');
  const [limit, setLimit] = useState({ remaining: 5, limit: 5 });

  useEffect(() => { setLimit(checkAILimit()); }, [response]);

  const ask = useCallback(async (question) => {
    const { allowed } = checkAILimit();
    if (!allowed) { setError('Daily AI limit reached. Calculators still work — AI resets tomorrow!'); return; }
    setLoading(true); setResponse(''); setError('');
    try { const text = await askAI(question, toolId, context); recordAIUsage(); setResponse(text); }
    catch (e) { setError('Could not reach AI assistant. Check your connection.'); }
    setLoading(false);
  }, [context, toolId]);

  const suggestions = AI_SUGGESTIONS[toolId] || [];

  const renderText = (text) => {
    return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) return <strong key={i} className="text-sc-accent font-semibold">{part.slice(2, -2)}</strong>;
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className="bg-sc-surface rounded-2xl border border-sc-border p-4 flex flex-col min-h-[300px]">
      <div className="flex items-center justify-between gap-2 mb-3 pb-3 border-b border-sc-border">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-sc-green shadow-[0_0_6px_theme(colors.sc.green)] animate-pulse-glow" />
          <span className="font-bold text-[13px] tracking-wider">SPARK<span className="text-sc-accent">CALC</span> AI</span>
        </div>
        <span className="text-[10px] text-sc-dim font-mono">{limit.remaining}/{limit.limit} left today</span>
      </div>

      {!response && !loading && !error && (
        <div className="flex-1">
          <p className="text-xs text-sc-dim mb-2.5">Ask AI about your circuit:</p>
          {suggestions.map((q, i) => (
            <button key={i} onClick={() => ask(q)}
              className="block w-full text-left bg-sc-surface2 border border-sc-border rounded-lg px-3 py-2.5 text-sc-text text-xs mb-1.5 hover:border-sc-accent/50 hover:bg-sc-accent/[0.04] transition-all cursor-pointer">{q}</button>
          ))}
        </div>
      )}

      {loading && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-sc-accent border-t-transparent animate-spin" />
          <span className="text-sm text-sc-dim">Analyzing your circuit...</span>
        </div>
      )}

      {error && !loading && (
        <div className="flex-1 animate-fade-in">
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-400">{error}</div>
          <button onClick={() => setError('')} className="mt-3 text-xs text-sc-accent hover:underline cursor-pointer">← Back</button>
        </div>
      )}

      {response && !loading && (
        <div className="flex-1 animate-fade-in overflow-auto">
          {response.split('\n').filter(Boolean).map((p, i) => (
            <p key={i} className="text-[13px] leading-relaxed mb-2.5 text-sc-text">{renderText(p)}</p>
          ))}
          <button onClick={() => setResponse('')} className="mt-2 text-xs text-sc-accent hover:underline cursor-pointer">← Ask another question</button>
        </div>
      )}

      <div className="flex gap-1.5 mt-3 pt-3 border-t border-sc-border">
        <input value={customQ} onChange={(e) => setCustomQ(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && customQ.trim()) { ask(customQ.trim()); setCustomQ(''); } }}
          placeholder="Ask anything about your circuit..."
          className="flex-1 bg-sc-surface2 border border-sc-border rounded-lg px-3 py-2 text-sc-text text-xs outline-none focus:border-sc-accent/50 transition-colors font-display placeholder:text-sc-dim/50" />
        <button onClick={() => { if (customQ.trim()) { ask(customQ.trim()); setCustomQ(''); } }}
          className="bg-sc-accent text-sc-bg border-none rounded-lg w-9 font-bold text-lg cursor-pointer hover:brightness-110 transition-all flex items-center justify-center">→</button>
      </div>
    </div>
  );
}
