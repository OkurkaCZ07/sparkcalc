'use client';
export default function AdBanner({ slot = 'top', className = '' }) {
  const sizes = { top: 'h-[90px] max-w-[728px]', sidebar: 'h-[250px] max-w-[300px]', inline: 'h-[90px] max-w-full' };
  return (
    <div className={`ad-slot ${sizes[slot] || sizes.inline} w-full mx-auto ${className}`}>
      <span style={{color:'var(--sc-dim)',opacity:0.4,fontSize:10,textTransform:'uppercase',letterSpacing:'0.15em'}}>Ad Space • {slot}</span>
    </div>
  );
}
