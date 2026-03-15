'use client';
export default function AdBanner({ slot = 'top', className = '' }) {
  const sizes = { top: 'h-[90px] max-w-[728px]', sidebar: 'h-[250px] max-w-[300px]', inline: 'h-[90px] max-w-full' };
  return (
    <div className={`ad-slot ${sizes[slot] || sizes.inline} w-full mx-auto ${className}`}>
      <span className="text-sc-dim/40 text-[10px] uppercase tracking-widest">Ad Space • {slot}</span>
    </div>
  );
}
