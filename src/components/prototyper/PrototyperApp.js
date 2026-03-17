'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AIPanel from '@/components/AIPanel';
import Toolbar from '@/components/prototyper/Toolbar';
import LeftPanel from '@/components/prototyper/LeftPanel';
import RightPanel from '@/components/prototyper/RightPanel';
import StatusBar from '@/components/prototyper/StatusBar';
import Viewport3D from '@/components/prototyper/Viewport3D';
import ShareModal from '@/components/prototyper/ShareModal';
import { DEFAULT_COMPONENT_DEFS } from '@/lib/componentDefs';
import { createUndoManager } from '@/lib/undoManager';
import { decodeCircuitFromUrl, encodeCircuitToUrl, loadAutoSave, saveAutoSave } from '@/lib/circuitSerializer';
import { simulate3d } from '@/lib/circuitSim';

const AUTOSAVE_KEY = 'sparkcalc-prototyper-state';

export default function PrototyperApp() {
  const undoRef = useRef(createUndoManager());

  const [leftW, setLeftW] = useState(280);
  const [rightW, setRightW] = useState(320);
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);

  const [mode, setMode] = useState('move'); // move | wire | placing
  const [placingType, setPlacingType] = useState(null);
  const [simRunning, setSimRunning] = useState(false);

  const [selected, setSelected] = useState(null); // {kind:'component'|'wire', id}
  const [hovered, setHovered] = useState(null); // {kind:'hole'|'component'|'wire', ...}
  const [showShare, setShowShare] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [keybinds, setKeybinds] = useState(() => loadKeybinds());

  const [circuit, setCircuit] = useState(() => ({
    components: [],
    wires: [],
    camera: null,
    version: 1,
  }));

  // Load: URL first, fallback autosave.
  useEffect(() => {
    const fromUrl = decodeCircuitFromUrl(window.location.href);
    if (fromUrl) {
      setCircuit((c) => ({ ...c, ...fromUrl }));
      undoRef.current.reset({ ...circuit, ...fromUrl });
      return;
    }
    const saved = loadAutoSave(AUTOSAVE_KEY);
    if (saved) {
      setCircuit((c) => ({ ...c, ...saved }));
      undoRef.current.reset({ ...circuit, ...saved });
    } else {
      undoRef.current.reset(circuit);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Autosave
  useEffect(() => {
    saveAutoSave(AUTOSAVE_KEY, circuit);
  }, [circuit]);

  // Share URL sync (debounced replace)
  useEffect(() => {
    const t = setTimeout(() => {
      const nextUrl = encodeCircuitToUrl(window.location.href, circuit);
      window.history.replaceState(null, '', nextUrl);
    }, 250);
    return () => clearTimeout(t);
  }, [circuit]);

  const sim = useMemo(() => simulate3d(circuit, { running: simRunning, defs: DEFAULT_COMPONENT_DEFS }), [circuit, simRunning]);

  const commit = useCallback((nextCircuit) => {
    const undo = undoRef.current;
    setCircuit((prev) => {
      undo.push(prev, nextCircuit);
      return nextCircuit;
    });
  }, []);

  const undo = useCallback(() => {
    const undo = undoRef.current;
    const prev = undo.undo();
    if (prev) setCircuit(prev);
  }, []);

  const redo = useCallback(() => {
    const undo = undoRef.current;
    const next = undo.redo();
    if (next) setCircuit(next);
  }, []);

  const clearAll = useCallback(() => {
    commit({ components: [], wires: [], camera: circuit.camera, version: 1 });
    setSelected(null);
    setMode('move');
    setPlacingType(null);
  }, [commit, circuit.camera]);

  const onPickPalette = useCallback((type) => {
    if (simRunning) return;
    setPlacingType(type);
    setMode('placing');
  }, [simRunning]);

  const aiContext = useMemo(() => {
    return {
      components: circuit.components.map((c) => ({ type: c.type, value: c.value, position: c.anchor })),
      wires: circuit.wires.length,
      simulation: sim?.summary || null,
      issues: sim?.issues || [],
      nets: sim?.nets ? { count: sim.nets.size } : null,
    };
  }, [circuit, sim]);

  const actionKey = (action) => keybinds[action] || DEFAULT_KEYBINDS[action];

  // Keyboard shortcuts (core)
  useEffect(() => {
    const onKeyDown = (e) => {
      const k = normalizeKeyEvent(e);
      if (k === actionKey('showShortcuts')) setShowShortcuts(true);
      if (k === actionKey('escape')) {
        setMode('move');
        setPlacingType(null);
        setSelected(null);
      }
      if (k === actionKey('toggleSim')) {
        e.preventDefault();
        setSimRunning((s) => !s);
      }
      if (k === actionKey('undo')) {
        e.preventDefault();
        undo();
      }
      if (k === actionKey('redo')) {
        e.preventDefault();
        redo();
      }
      if (k === actionKey('wireMode')) {
        if (simRunning) return;
        setMode((m) => (m === 'wire' ? 'move' : 'wire'));
        setPlacingType(null);
      }
      if (k === actionKey('moveMode')) {
        setMode('move');
        setPlacingType(null);
      }
      if (k === actionKey('rotate')) {
        if (selected?.kind === 'component') {
          const idx = circuit.components.findIndex((c) => c.id === selected.id);
          if (idx >= 0) {
            const comp = circuit.components[idx];
            commit({
              ...circuit,
              components: circuit.components.map((c) => (c.id === comp.id ? { ...c, rot: ((c.rot || 0) + 90) % 360 } : c)),
            });
          }
        }
      }
      if (k === actionKey('delete') && selected) {
        if (selected.kind === 'component') {
          commit({ ...circuit, components: circuit.components.filter((c) => c.id !== selected.id) });
          setSelected(null);
        }
        if (selected.kind === 'wire') {
          commit({ ...circuit, wires: circuit.wires.filter((w) => w.id !== selected.id) });
          setSelected(null);
        }
      }
      if (k === actionKey('duplicate')) {
        e.preventDefault();
        if (selected?.kind === 'component') {
          const comp = circuit.components.find((c) => c.id === selected.id);
          if (comp) {
            const dup = { ...comp, id: crypto.randomUUID?.() || `${Date.now()}_${Math.random()}` };
            commit({ ...circuit, components: [...circuit.components, dup] });
            setSelected({ kind: 'component', id: dup.id });
          }
        }
      }
      if (k === actionKey('toggleLeft')) setLeftOpen((v) => !v);
      if (k === actionKey('toggleRight')) setRightOpen((v) => !v);
      if (k === actionKey('fitToView')) {
        window.dispatchEvent(new CustomEvent('prototyper:fitToView'));
      }
      if (k === '1' || k === '2' || k === '3' || k === '4') {
        window.dispatchEvent(new CustomEvent('prototyper:presetView', { detail: { preset: Number(k) } }));
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [actionKey, circuit, commit, redo, selected, simRunning, undo]);

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      <Toolbar
        simRunning={simRunning}
        onToggleSim={() => setSimRunning((s) => !s)}
        mode={mode}
        onModeChange={(m) => { if (!simRunning) setMode(m); if (m !== 'placing') setPlacingType(null); }}
        onUndo={undo}
        onRedo={redo}
        onClear={clearAll}
        onShare={() => setShowShare(true)}
        onToggleFullscreen={() => {
          if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
          else document.exitFullscreen?.();
        }}
        score={sim?.summary?.score ?? null}
      />

      <div className="flex-1 flex min-h-0 overflow-hidden">
        <LeftPanel
          open={leftOpen}
          width={leftW}
          onResize={setLeftW}
          onToggle={() => setLeftOpen((v) => !v)}
          defs={DEFAULT_COMPONENT_DEFS}
          onPick={onPickPalette}
          disabled={simRunning}
          circuit={circuit}
          onSelect={(sel) => setSelected(sel)}
          onUpdateCircuit={commit}
        />

        <div className="flex-1 min-w-0 min-h-0 relative">
          <Viewport3D
            defs={DEFAULT_COMPONENT_DEFS}
            circuit={circuit}
            setCircuit={setCircuit}
            commit={commit}
            mode={mode}
            placingType={placingType}
            simRunning={simRunning}
            sim={sim}
            selected={selected}
            setSelected={setSelected}
            hovered={hovered}
            setHovered={setHovered}
          />
        </div>

        <RightPanel
          open={rightOpen}
          width={rightW}
          onResize={setRightW}
          onToggle={() => setRightOpen((v) => !v)}
          defs={DEFAULT_COMPONENT_DEFS}
          circuit={circuit}
          selected={selected}
          onUpdateCircuit={commit}
          sim={sim}
        >
          <div className="mt-3">
            <AIPanel context={aiContext} toolId="prototyper" />
          </div>
        </RightPanel>
      </div>

      <StatusBar
        mode={mode}
        hovered={hovered}
        selected={selected}
        parts={circuit.components.length}
        wires={circuit.wires.length}
        score={sim?.summary?.score ?? null}
      />

      {showShare && (
        <ShareModal
          onClose={() => setShowShare(false)}
          url={encodeCircuitToUrl(window.location.href, circuit)}
        />
      )}

      {showShortcuts && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="w-[720px] max-w-[95vw] rounded-2xl border p-4"
            style={{ background: 'color-mix(in srgb, var(--sc-surface) 85%, transparent)', borderColor: 'var(--sc-border)', backdropFilter: 'blur(10px)' }}>
            <div className="flex items-center justify-between">
              <div className="text-sm font-bold" style={{ color: 'var(--sc-text)' }}>Keyboard shortcuts</div>
              <div className="flex items-center gap-2">
                <button className="text-xs px-2 py-1 rounded border" style={{ borderColor: 'var(--sc-border)', color: 'var(--sc-dim)' }} onClick={() => { setKeybinds(DEFAULT_KEYBINDS); saveKeybinds(DEFAULT_KEYBINDS); }}>
                  Reset
                </button>
                <button className="text-xs px-2 py-1 rounded border" style={{ borderColor: 'var(--sc-border)', color: 'var(--sc-dim)' }} onClick={() => setShowShortcuts(false)}>Close</button>
              </div>
            </div>
            <KeybindEditor keybinds={keybinds} setKeybinds={setKeybinds} />
          </div>
        </div>
      )}
    </div>
  );
}

const DEFAULT_KEYBINDS = {
  toggleSim: 'Space',
  wireMode: 'W',
  moveMode: 'M',
  rotate: 'R',
  delete: 'Delete',
  undo: 'Ctrl+Z',
  redo: 'Ctrl+Shift+Z',
  duplicate: 'Ctrl+D',
  fitToView: 'F',
  toggleLeft: 'H',
  toggleRight: 'L',
  escape: 'Escape',
  showShortcuts: '?',
};

function normalizeKeyEvent(e) {
  const parts = [];
  if (e.ctrlKey || e.metaKey) parts.push('Ctrl');
  if (e.shiftKey) parts.push('Shift');
  if (e.altKey) parts.push('Alt');
  const k = e.key === ' ' ? 'Space' : e.key.length === 1 ? e.key.toUpperCase() : e.key;
  if (k === 'Dead') return '';
  if (['Control', 'Shift', 'Alt', 'Meta'].includes(k)) return '';
  parts.push(k);
  return parts.join('+');
}

function loadKeybinds() {
  try {
    const raw = localStorage.getItem('sparkcalc-prototyper-keybinds');
    if (!raw) return DEFAULT_KEYBINDS;
    const obj = JSON.parse(raw);
    return { ...DEFAULT_KEYBINDS, ...(obj || {}) };
  } catch {
    return DEFAULT_KEYBINDS;
  }
}

function saveKeybinds(b) {
  try {
    localStorage.setItem('sparkcalc-prototyper-keybinds', JSON.stringify(b));
  } catch {}
}

function KeybindEditor({ keybinds, setKeybinds }) {
  const rows = [
    ['toggleSim', 'Toggle simulation'],
    ['wireMode', 'Wire mode'],
    ['moveMode', 'Move mode'],
    ['rotate', 'Rotate selected'],
    ['delete', 'Delete selected'],
    ['undo', 'Undo'],
    ['redo', 'Redo'],
    ['duplicate', 'Duplicate selected'],
    ['fitToView', 'Fit to view'],
    ['toggleLeft', 'Toggle left panel'],
    ['toggleRight', 'Toggle right panel'],
    ['showShortcuts', 'Show shortcuts'],
  ];

  const setAction = (action, value) => {
    const next = { ...keybinds, [action]: value };
    setKeybinds(next);
    saveKeybinds(next);
  };

  return (
    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs" style={{ color: 'var(--sc-dim)' }}>
      {rows.map(([action, label]) => (
        <KeybindRow key={action} action={action} label={label} value={keybinds[action] || ''} onChange={(v) => setAction(action, v)} />
      ))}
      <div className="md:col-span-2 text-[10px]" style={{ color: 'var(--sc-dim)' }}>
        Tip: click a key field and press a new key combo.
      </div>
    </div>
  );
}

function KeybindRow({ action, label, value, onChange }) {
  return (
    <div className="flex items-center justify-between gap-3 border rounded-lg px-2 py-1" style={{ borderColor: 'var(--sc-border)' }}>
      <div className="min-w-0">
        <div className="text-[11px]" style={{ color: 'var(--sc-text)' }}>{label}</div>
        <div className="text-[10px]" style={{ color: 'var(--sc-dim)' }}>{action}</div>
      </div>
      <KeyCaptureInput value={value} onChange={onChange} />
    </div>
  );
}

function KeyCaptureInput({ value, onChange }) {
  return (
    <input
      value={value}
      readOnly
      className="w-28 px-2 py-1 rounded border bg-transparent font-mono text-[11px] outline-none text-right cursor-pointer"
      style={{ borderColor: 'var(--sc-border)', color: 'var(--sc-accent)' }}
      onKeyDown={(e) => {
        e.preventDefault();
        const k = normalizeKeyEvent(e);
        if (k) onChange(k);
      }}
      onFocus={(e) => e.target.select()}
    />
  );
}


