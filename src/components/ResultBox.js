'use client';
export default function ResultBox({ label, value, color = 'accent' }) {
  const map = {
    accent: 'border-sc-accent text-sc-accent',
    green: 'border-sc-green text-sc-green',
    warn: 'border-sc-warn text-sc-warn',
    red: 'border-red-500 text-red-500',
    cyan: 'border-sc-cyan text-sc-cyan',
  };
  const cls = map[color] || map.accent;
  return (
    <div className={`bg-sc-surface2 rounded-xl p-3 border-l-[3px] ${cls.split(' ')[0]} animate-fade-in`}>
      <span className="block text-[10px] uppercase tracking-wider text-sc-dim mb-1 font-semibold">{label}</span>
      <span className={`block text-lg font-bold font-mono ${cls.split(' ')[1]}`}>{value}</span>
    </div>
  );
}
