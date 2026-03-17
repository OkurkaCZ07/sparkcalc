'use client';

import { useMemo, useState } from 'react';

export default function RightPanel({
  open,
  width,
  onResize,
  onToggle,
  defs,
  circuit,
  selected,
  onUpdateCircuit,
  sim,
  children,
}) {
  const [resizing, setResizing] = useState(false);

  const selComp = useMemo(() => {
    if (selected?.kind !== 'component') return null;
    return circuit.components.find((c) => c.id === selected.id) || null;
  }, [circuit.components, selected]);

  const selDef = selComp ? defs[selComp.type] : null;
  const selSim = selComp ? sim?.elementStates?.get?.(selComp.id) : null;

  const updateComp = (patch) => {
    if (!selComp) return;
    onUpdateCircuit({
      ...circuit,
      components: circuit.components.map((c) => (c.id === selComp.id ? { ...c, ...patch } : c)),
    });
  };

  return (
    <div className="h-full flex flex-row-reverse" style={{ width: open ? width : 28 }}>
      <div
        className="h-full border-l flex flex-col min-w-0"
        style={{
          width: open ? width : 28,
          borderColor: 'var(--sc-border)',
          background: open ? 'color-mix(in srgb, var(--sc-surface) 86%, transparent)' : 'transparent',
          backdropFilter: open ? 'blur(10px)' : undefined,
        }}
      >
        <div className="h-10 flex items-center justify-between px-2 border-b" style={{ borderColor: 'var(--sc-border)' }}>
          <div className="text-xs font-bold truncate" style={{ color: 'var(--sc-text)' }}>Properties</div>
          <button className="text-xs px-1.5 py-0.5 rounded border" style={{ borderColor: 'var(--sc-border)', color: 'var(--sc-dim)' }} onClick={onToggle} title="L">
            {open ? '▶' : '◀'}
          </button>
        </div>

        {open && (
          <div className="p-3 overflow-auto flex-1 min-h-0">
            {!selComp ? (
              <div className="text-xs" style={{ color: 'var(--sc-dim)' }}>Select a component or wire.</div>
            ) : (
              <div className="space-y-3">
                <div className="rounded-xl border p-3" style={{ borderColor: 'var(--sc-border)', background: 'var(--sc-surface2)' }}>
                  <div className="text-sm font-bold" style={{ color: 'var(--sc-text)' }}>{selDef?.name || selComp.type}</div>
                  <div className="mt-1 text-[11px] font-mono" style={{ color: 'var(--sc-dim)' }}>
                    id: {selComp.id.slice(0, 8)}
                  </div>

                  <div className="mt-3 space-y-2 text-[12px]">
                    <label className="flex items-center justify-between gap-2">
                      <span style={{ color: 'var(--sc-dim)' }}>Value</span>
                      <input
                        value={selComp.value ?? ''}
                        onChange={(e) => updateComp({ value: e.target.value })}
                        className="w-40 px-2 py-1 rounded border bg-transparent font-mono text-[12px] outline-none"
                        style={{ borderColor: 'var(--sc-border)', color: 'var(--sc-accent)' }}
                      />
                    </label>

                    {selComp.type.startsWith('led-') && (
                      <label className="flex items-center justify-between gap-2">
                        <span style={{ color: 'var(--sc-dim)' }}>Color</span>
                        <select
                          value={selComp.type}
                          onChange={(e) => updateComp({ type: e.target.value })}
                          className="w-40 px-2 py-1 rounded border bg-transparent text-[12px] outline-none"
                          style={{ borderColor: 'var(--sc-border)', color: 'var(--sc-text)', background: 'var(--sc-surface2)' }}
                        >
                          {['led-red', 'led-green', 'led-blue', 'led-yellow', 'led-white'].map((t) => (
                            <option key={t} value={t}>{defs[t]?.name || t}</option>
                          ))}
                        </select>
                      </label>
                    )}

                    {(selComp.type === 'switch' || selComp.type === 'button') && (
                      <label className="flex items-center justify-between gap-2">
                        <span style={{ color: 'var(--sc-dim)' }}>Closed</span>
                        <input
                          type="checkbox"
                          checked={!!selComp.props?.closed}
                          onChange={(e) => updateComp({ props: { ...(selComp.props || {}), closed: e.target.checked } })}
                        />
                      </label>
                    )}

                    <div className="flex items-center justify-between gap-2">
                      <span style={{ color: 'var(--sc-dim)' }}>Rotation</span>
                      <span className="font-mono" style={{ color: 'var(--sc-text)' }}>{selComp.rot || 0}°</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-1">
                      <button
                        className="px-2 py-1 rounded-lg border text-xs font-bold"
                        style={{ borderColor: 'var(--sc-border)', background: 'var(--sc-surface)', color: 'var(--sc-text)' }}
                        onClick={() => updateComp({ rot: ((selComp.rot || 0) + 90) % 360 })}
                        title="R"
                      >
                        Rotate
                      </button>
                      <button
                        className="px-2 py-1 rounded-lg border text-xs font-bold"
                        style={{ borderColor: 'var(--sc-border)', background: 'var(--sc-surface)', color: 'var(--sc-text)' }}
                        onClick={() => {
                          const dup = { ...selComp, id: crypto.randomUUID?.() || `${Date.now()}_${Math.random()}` };
                          onUpdateCircuit({ ...circuit, components: [...circuit.components, dup] });
                        }}
                        title="Ctrl+D"
                      >
                        Duplicate
                      </button>
                      <button
                        className="px-2 py-1 rounded-lg border text-xs font-bold"
                        style={{ borderColor: 'rgba(239,68,68,0.45)', background: 'rgba(239,68,68,0.10)', color: '#fca5a5' }}
                        onClick={() => onUpdateCircuit({ ...circuit, components: circuit.components.filter((c) => c.id !== selComp.id) })}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border p-3" style={{ borderColor: 'var(--sc-border)', background: 'var(--sc-surface2)' }}>
                  <div className="text-[11px] font-bold" style={{ color: 'var(--sc-dim)' }}>Simulation</div>
                  {selSim ? (
                    <div className="mt-2 space-y-1 text-[12px]" style={{ color: 'var(--sc-dim)' }}>
                      {'powered' in selSim && <div>Status: <span style={{ color: selSim.powered ? 'var(--sc-green)' : 'var(--sc-dim)' }}>{selSim.powered ? 'Powered' : 'Off'}</span></div>}
                      {'currentA' in selSim && <div>Current: <span className="font-mono" style={{ color: 'var(--sc-text)' }}>{(selSim.currentA * 1000).toFixed(1)} mA</span></div>}
                      {'brightness' in selSim && <div>Brightness: <span className="font-mono" style={{ color: 'var(--sc-text)' }}>{Math.round((selSim.brightness || 0) * 100)}%</span></div>}
                      {selSim.blown && <div style={{ color: '#fca5a5' }}>⚠ Blown</div>}
                    </div>
                  ) : (
                    <div className="mt-2 text-[12px]" style={{ color: 'var(--sc-dim)' }}>Run simulation to see live state.</div>
                  )}
                </div>

                <div className="rounded-xl border p-3" style={{ borderColor: 'var(--sc-border)', background: 'var(--sc-surface2)' }}>
                  <div className="text-[11px] font-bold" style={{ color: 'var(--sc-dim)' }}>Circuit Analysis</div>
                  <div className="mt-2 text-[12px]" style={{ color: 'var(--sc-dim)' }}>
                    <div>Score: <span className="font-mono" style={{ color: 'var(--sc-text)' }}>{sim?.summary?.score ?? '—'}/100</span></div>
                    <div className="mt-2 space-y-1">
                      {(sim?.issues || []).slice(0, 8).map((it, i) => (
                        <div key={i} className="px-2 py-1 rounded border text-[12px]" style={{ borderColor: 'var(--sc-border)', background: 'rgba(255,255,255,0.02)' }}>
                          {it.severity === 'error' ? '🔴' : it.severity === 'warn' ? '🟡' : '💡'} {it.message}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {children}
              </div>
            )}
          </div>
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
          onMouseMove={(e) => {
            const vw = window.innerWidth;
            const next = Math.max(260, Math.min(520, vw - e.clientX));
            onResize(next);
          }}
          onMouseUp={() => setResizing(false)}
          style={{ cursor: 'col-resize' }}
        />
      )}
    </div>
  );
}

