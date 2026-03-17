'use client';

import { useMemo, useState } from 'react';

export default function LeftPanel({
  open,
  width,
  onResize,
  onToggle,
  defs,
  onPick,
  disabled,
  circuit,
  onSelect,
  onUpdateCircuit,
}) {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('passive');
  const [resizing, setResizing] = useState(false);

  const cats = useMemo(() => ([
    { id: 'passive', name: 'Passive' },
    { id: 'led', name: 'LEDs' },
    { id: 'active', name: 'Semiconductors' },
    { id: 'ic', name: 'ICs' },
    { id: 'power', name: 'Power' },
    { id: 'switch', name: 'Switches' },
    { id: 'output', name: 'Output' },
  ]), []);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return Object.entries(defs).filter(([id, d]) => {
      if (d.cat !== cat) return false;
      if (!qq) return true;
      return id.toLowerCase().includes(qq) || d.name.toLowerCase().includes(qq) || String(d.defaultVal || '').toLowerCase().includes(qq);
    });
  }, [defs, cat, q]);

  return (
    <div className="h-full flex" style={{ width: open ? width : 28 }}>
      <div
        className="h-full border-r flex flex-col min-w-0"
        style={{
          width: open ? width : 28,
          borderColor: 'var(--sc-border)',
          background: open ? 'color-mix(in srgb, var(--sc-surface) 86%, transparent)' : 'transparent',
          backdropFilter: open ? 'blur(10px)' : undefined,
        }}
      >
        <div className="h-10 flex items-center justify-between px-2 border-b" style={{ borderColor: 'var(--sc-border)' }}>
          <div className="text-xs font-bold truncate" style={{ color: 'var(--sc-text)' }}>Components</div>
          <button className="text-xs px-1.5 py-0.5 rounded border" style={{ borderColor: 'var(--sc-border)', color: 'var(--sc-dim)' }} onClick={onToggle} title="H">
            {open ? '◀' : '▶'}
          </button>
        </div>

        {open && (
          <>
            <div className="p-2 space-y-2">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search..."
                className="w-full px-2 py-1 rounded-lg border text-[11px] outline-none"
                style={{ background: 'var(--sc-surface2)', borderColor: 'var(--sc-border)', color: 'var(--sc-text)' }}
              />
              <div className="flex flex-wrap gap-1">
                {cats.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setCat(c.id)}
                    className="px-2 py-0.5 rounded text-[10px] font-semibold border"
                    style={{
                      background: cat === c.id ? 'color-mix(in srgb, var(--sc-accent) 10%, transparent)' : 'var(--sc-surface2)',
                      borderColor: cat === c.id ? 'var(--sc-accent)' : 'var(--sc-border)',
                      color: cat === c.id ? 'var(--sc-accent)' : 'var(--sc-dim)',
                    }}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-1 max-h-[34vh] overflow-auto pr-1">
                {filtered.map(([id, d]) => (
                  <button
                    key={id}
                    disabled={disabled}
                    onClick={() => onPick(id)}
                    className="p-2 rounded-lg border text-left"
                    style={{
                      background: disabled ? 'rgba(255,255,255,0.03)' : 'var(--sc-surface2)',
                      borderColor: 'var(--sc-border)',
                      opacity: disabled ? 0.5 : 1,
                    }}
                    title={d.defaultVal}
                  >
                    <div className="text-[10px] font-bold truncate" style={{ color: 'var(--sc-text)' }}>{d.name}</div>
                    <div className="text-[9px] font-mono truncate" style={{ color: 'var(--sc-dim)' }}>{d.defaultVal}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="px-2 pb-2">
              <div className="text-[10px] font-bold mb-1" style={{ color: 'var(--sc-dim)' }}>
                BOM ({circuit.components.length})
              </div>
              <div className="space-y-1 max-h-[26vh] overflow-auto pr-1">
                {circuit.components.map((c) => {
                  const d = defs[c.type];
                  return (
                    <div
                      key={c.id}
                      className="flex items-center gap-2 p-1.5 rounded border cursor-pointer"
                      style={{ background: 'var(--sc-surface2)', borderColor: 'var(--sc-border)' }}
                      onClick={() => onSelect({ kind: 'component', id: c.id })}
                    >
                      <div className="w-2.5 h-2.5 rounded-sm" style={{ background: d?.color || 'var(--sc-accent)' }} />
                      <div className="min-w-0 flex-1">
                        <div className="text-[10px] font-semibold truncate" style={{ color: 'var(--sc-text)' }}>{d?.name || c.type}</div>
                        <div className="text-[9px] font-mono truncate" style={{ color: 'var(--sc-dim)' }}>{c.value || d?.defaultVal}</div>
                      </div>
                      <button
                        className="text-[10px] opacity-60 hover:opacity-100"
                        style={{ color: 'var(--sc-dim)' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpdateCircuit({ ...circuit, components: circuit.components.filter((x) => x.id !== c.id) });
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>

      {open && (
        <div
          className="w-1 cursor-col-resize"
          onMouseDown={() => setResizing(true)}
          style={{ background: 'transparent' }}
        />
      )}

      {resizing && (
        <div
          className="fixed inset-0 z-[80]"
          onMouseMove={(e) => onResize(Math.max(220, Math.min(520, e.clientX)))}
          onMouseUp={() => setResizing(false)}
          style={{ cursor: 'col-resize' }}
        />
      )}
    </div>
  );
}

