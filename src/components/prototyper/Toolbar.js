'use client';

export default function Toolbar({
  simRunning,
  onToggleSim,
  mode,
  onModeChange,
  onUndo,
  onRedo,
  onClear,
  onShare,
  onToggleFullscreen,
  score,
}) {
  const scoreColor =
    score == null ? 'var(--sc-dim)' : score >= 80 ? 'var(--sc-green)' : score >= 50 ? '#f59e0b' : '#ef4444';

  const ToolBtn = ({ active, children, onClick, title }) => (
    <button
      onClick={onClick}
      title={title}
      className="px-2.5 h-8 rounded-lg text-xs font-bold border transition-colors"
      style={{
        background: active ? 'color-mix(in srgb, var(--sc-accent) 12%, transparent)' : 'var(--sc-surface2)',
        borderColor: active ? 'var(--sc-accent)' : 'var(--sc-border)',
        color: active ? 'var(--sc-accent)' : 'var(--sc-dim)',
      }}
    >
      {children}
    </button>
  );

  return (
    <div
      className="h-12 w-full flex items-center justify-between px-3 border-b select-none"
      style={{ background: 'color-mix(in srgb, var(--sc-surface) 88%, transparent)', borderColor: 'var(--sc-border)', backdropFilter: 'blur(10px)' }}
    >
      <div className="flex items-center gap-2 min-w-0">
        <button
          onClick={onToggleSim}
          className="px-3 h-8 rounded-lg text-xs font-extrabold border transition-colors"
          style={{
            background: simRunning ? 'rgba(239,68,68,0.12)' : 'rgba(34,197,94,0.12)',
            borderColor: simRunning ? 'rgba(239,68,68,0.45)' : 'rgba(34,197,94,0.45)',
            color: simRunning ? '#fca5a5' : '#86efac',
          }}
          title="Space"
        >
          {simRunning ? '⏹ Stop Simulation' : '▶ Start Simulation'}
        </button>

        <ToolBtn onClick={onUndo} title="Ctrl+Z">↩ Undo</ToolBtn>
        <ToolBtn onClick={onRedo} title="Ctrl+Shift+Z / Ctrl+Y">↪ Redo</ToolBtn>

        <div className="w-px h-6 mx-1" style={{ background: 'var(--sc-border)' }} />

        <ToolBtn active={mode === 'wire'} onClick={() => onModeChange(mode === 'wire' ? 'move' : 'wire')} title="W">
          🔗 Wire
        </ToolBtn>
        <ToolBtn active={mode === 'move'} onClick={() => onModeChange('move')} title="M">
          ↔ Move
        </ToolBtn>

        <div className="hidden md:flex items-center gap-1 ml-2 text-[10px] font-mono" style={{ color: 'var(--sc-dim)' }}>
          Space: sim · W: wire · M: move · R: rotate · Ctrl+Z: undo
        </div>
      </div>

      <div className="flex items-center gap-2">
        {score != null && (
          <div className="px-2 h-8 rounded-lg border flex items-center gap-2" style={{ background: 'var(--sc-surface2)', borderColor: 'var(--sc-border)' }}>
            <span className="text-[10px] font-bold" style={{ color: scoreColor }}>Score</span>
            <span className="text-[10px] font-mono" style={{ color: scoreColor }}>{score}/100</span>
          </div>
        )}
        <button className="px-2.5 h-8 rounded-lg text-xs font-bold border" style={{ background: 'var(--sc-surface2)', borderColor: 'var(--sc-border)', color: 'var(--sc-dim)' }} onClick={onShare}>
          📤 Share
        </button>
        <button className="px-2.5 h-8 rounded-lg text-xs font-bold border" style={{ background: 'var(--sc-surface2)', borderColor: 'var(--sc-border)', color: 'var(--sc-dim)' }} onClick={onClear}>
          🗑 Clear
        </button>
        <button className="px-2.5 h-8 rounded-lg text-xs font-bold border" style={{ background: 'var(--sc-surface2)', borderColor: 'var(--sc-border)', color: 'var(--sc-dim)' }} onClick={onToggleFullscreen} title="F11">
          ⛶
        </button>
      </div>
    </div>
  );
}

