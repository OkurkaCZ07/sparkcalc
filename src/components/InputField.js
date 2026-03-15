'use client';
export default function InputField({ label, value, onChange, unit, placeholder }) {
  return (
    <div className="mb-4">
      <label className="block text-[11px] font-semibold text-sc-dim uppercase tracking-wider mb-1.5">{label}</label>
      <div className="flex items-center bg-sc-surface2 border border-sc-border rounded-lg overflow-hidden glow-input transition-all">
        <input type="number" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder || '0'}
          className="flex-1 bg-transparent border-none outline-none text-sc-text text-[15px] font-mono font-medium px-3 py-2.5 placeholder:text-sc-dim/40" />
        {unit && <span className="px-3 text-[13px] font-mono font-bold text-sc-accent border-l border-sc-border bg-sc-accent/[0.04] leading-[40px] select-none">{unit}</span>}
      </div>
    </div>
  );
}
