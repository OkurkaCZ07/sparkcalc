'use client';

export default function StatusBar({ mode, hovered, selected, parts, wires, score }) {
  const hoverText = hovered?.kind === 'hole'
    ? `Hover: ${hovered.holeLabel}`
    : hovered?.kind === 'component'
      ? `Hover: ${hovered.name}`
      : hovered?.kind === 'wire'
        ? 'Hover: Wire'
        : 'Hover: —';

  const selText = selected
    ? `Selected: ${selected.kind} ${selected.id.slice(0, 6)}`
    : 'Selected: —';

  return (
    <div
      className="h-7 w-full flex items-center justify-between px-3 border-t text-[11px] font-mono select-none"
      style={{ background: 'color-mix(in srgb, var(--sc-surface) 88%, transparent)', borderColor: 'var(--sc-border)', color: 'var(--sc-dim)', backdropFilter: 'blur(10px)' }}
    >
      <div className="flex items-center gap-3 min-w-0">
        <span>Mode: {mode}</span>
        <span className="truncate">{hoverText}</span>
        <span className="truncate">{selText}</span>
      </div>
      <div className="flex items-center gap-3">
        <span>{parts} parts · {wires} wires</span>
        <span>Score: {score ?? '—'}/100</span>
      </div>
    </div>
  );
}

