'use client';
export default function InputField({ label, value, onChange, unit, placeholder }) {
  return (
    <div className="mb-4">
      <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{color:'var(--sc-dim)'}}>{label}</label>
      <div className="flex items-center rounded-lg overflow-hidden glow-input transition-all" style={{background:'var(--sc-surface2)', border:'1px solid var(--sc-border)'}}>
        <input type="number" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder || '0'}
          className="flex-1 bg-transparent border-none outline-none text-[15px] font-mono font-medium px-3 py-2.5"
          style={{color:'var(--sc-text)'}} />
        {unit && <span className="px-3 text-[13px] font-mono font-bold select-none" style={{color:'var(--sc-accent)', borderLeft:'1px solid var(--sc-border)', lineHeight:'40px'}}>{unit}</span>}
      </div>
    </div>
  );
}
