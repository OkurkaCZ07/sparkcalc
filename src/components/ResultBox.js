'use client';
export default function ResultBox({ label, value, color = 'accent' }) {
  const colorVar = {
    accent: 'var(--sc-accent)',
    green: 'var(--sc-green)',
    warn: 'var(--sc-warn)',
    red: '#ef4444',
    cyan: '#00d4ff',
  }[color] || 'var(--sc-accent)';

  return (
    <div className="rounded-xl p-3 animate-fade-in" style={{background:'var(--sc-surface2)', borderLeft:`3px solid ${colorVar}`}}>
      <span className="block text-[10px] uppercase tracking-wider font-semibold mb-1" style={{color:'var(--sc-dim)'}}>{label}</span>
      <span className="block text-lg font-bold font-mono" style={{color: colorVar}}>{value}</span>
    </div>
  );
}
