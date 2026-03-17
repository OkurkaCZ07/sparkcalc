'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import AIPanel from '@/components/AIPanel';
import { useLanguage } from '@/lib/LanguageContext';
import { COMP_DEFS, CATEGORIES, simulate } from '@/lib/circuitSim';

// ─── Constants ───
const COLS = 30, ROWS = 10, GAP = 5; // gap between row 4 and 5 (channel)
const CELL = 22; // pixels per cell
const PAD_X = 60, PAD_Y = 50; // padding around breadboard
const BB_W = COLS * CELL, BB_H = (ROWS + 1) * CELL; // +1 for channel gap
const CANVAS_W = BB_W + PAD_X * 2;
const CANVAS_H = BB_H + PAD_Y * 2;

// Hole pixel position
function holePos(col, row) {
  let y = row * CELL;
  if (row >= GAP) y += CELL; // shift bottom half down for channel
  return { x: PAD_X + col * CELL, y: PAD_Y + y };
}

// Hit test: find hole near pixel coords
function hitTest(px, py, zoom, panX, panY) {
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r < ROWS; r++) {
      const { x, y } = holePos(c, r);
      const sx = x * zoom + panX, sy = y * zoom + panY;
      if (Math.abs(px - sx) < CELL * zoom * 0.45 && Math.abs(py - sy) < CELL * zoom * 0.45) {
        return { col: c, row: r };
      }
    }
  }
  return null;
}

// ─── Canvas Renderer ───
function drawScene(ctx, w, h, zoom, panX, panY, components, wires, hovered, simResult, selectedTool, wireStart, simRunning) {
  ctx.save();
  ctx.clearRect(0, 0, w, h);
  
  // Background
  ctx.fillStyle = '#0e1018';
  ctx.fillRect(0, 0, w, h);

  // Subtle grid
  ctx.strokeStyle = '#161825';
  ctx.lineWidth = 0.5;
  for (let i = 0; i < w; i += 20) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, h); ctx.stroke(); }
  for (let i = 0; i < h; i += 20) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(w, i); ctx.stroke(); }

  ctx.translate(panX, panY);
  ctx.scale(zoom, zoom);

  // ─── Breadboard body ───
  const bbX = PAD_X - 15, bbY = PAD_Y - 15;
  const bbW = BB_W + 10, bbH2 = BB_H + 15;
  
  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(bbX + 4, bbY + 4, bbW, bbH2);
  
  // Board
  ctx.fillStyle = '#f0ebe0';
  ctx.strokeStyle = '#c8c0a8';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(bbX, bbY, bbW, bbH2, 6);
  ctx.fill();
  ctx.stroke();

  // Center channel
  const chanY = PAD_Y + GAP * CELL - 2;
  ctx.fillStyle = '#d5cdb8';
  ctx.fillRect(bbX + 5, chanY, bbW - 10, CELL + 4);

  // Power rail lines
  const drawRail = (y, color) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 4]);
    ctx.beginPath();
    ctx.moveTo(PAD_X, y);
    ctx.lineTo(PAD_X + (COLS - 1) * CELL, y);
    ctx.stroke();
    ctx.setLineDash([]);
  };
  drawRail(PAD_Y - 8, '#cc3333');
  drawRail(PAD_Y + BB_H + 8, '#cc3333');

  // Row labels
  ctx.fillStyle = '#666';
  ctx.font = '9px monospace';
  ctx.textAlign = 'right';
  const rowLabels = ['a','b','c','d','e','f','g','h','i','j'];
  for (let r = 0; r < ROWS; r++) {
    const { y } = holePos(0, r);
    ctx.fillText(rowLabels[r], PAD_X - 20, y + 3);
  }
  // Col labels
  ctx.textAlign = 'center';
  for (let c = 0; c < COLS; c++) {
    const { x } = holePos(c, 0);
    ctx.fillText(String(c + 1), x, PAD_Y - 22);
  }

  // ─── Holes ───
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r < ROWS; r++) {
      const { x, y } = holePos(c, r);
      const isHovered = hovered && hovered.col === c && hovered.row === r;
      
      ctx.beginPath();
      ctx.arc(x, y, isHovered ? 4.5 : 3.5, 0, Math.PI * 2);
      
      if (isHovered) {
        ctx.fillStyle = '#ff8c42';
        ctx.shadowColor = '#ff8c42';
        ctx.shadowBlur = 8;
      } else {
        ctx.fillStyle = '#2a2a2a';
        ctx.shadowBlur = 0;
      }
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  // ─── Wires ───
  const wireColors = ['#3b82f6','#ef4444','#22c55e','#eab308','#f97316','#a855f7','#ec4899','#06b6d4','#f43f5e','#8b5cf6'];
  
  wires.forEach((w, i) => {
    const p1 = holePos(w.sc, w.sr);
    const p2 = holePos(w.ec, w.er);
    const color = wireColors[i % wireColors.length];
    
    // Wire shadow
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(p1.x + 1, p1.y + 1);
    ctx.lineTo(p2.x + 1, p2.y + 1);
    ctx.stroke();
    
    // Wire
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
    
    // Endpoints
    [p1, p2].forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    });
  });

  // Wire preview
  if (wireStart && hovered) {
    const p1 = holePos(wireStart.col, wireStart.row);
    const p2 = holePos(hovered.col, hovered.row);
    ctx.strokeStyle = 'rgba(255,140,66,0.5)';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // ─── Components ───
  components.forEach((comp, idx) => {
    const def = COMP_DEFS[comp.type];
    if (!def) return;
    
    const ledState = simResult?.ledStates?.[idx];
    const isPowered = simRunning && ledState?.powered;
    const brightness = ledState?.brightness || 0;

    // Pin positions
    const pinPositions = def.pins.map(p => holePos(comp.col + p.dx, comp.row + p.dy));

    // Draw based on type
    if (comp.type.startsWith('resistor')) {
      // Resistor: body between pins with color bands
      const p1 = pinPositions[0], p2 = pinPositions[1];
      const mx = (p1.x + p2.x) / 2, my = (p1.y + p2.y) / 2;
      const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
      
      // Leads
      ctx.strokeStyle = '#888';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(mx - 15 * Math.cos(angle), my - 15 * Math.sin(angle)); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(p2.x, p2.y); ctx.lineTo(mx + 15 * Math.cos(angle), my + 15 * Math.sin(angle)); ctx.stroke();
      
      // Body
      ctx.save();
      ctx.translate(mx, my);
      ctx.rotate(angle);
      ctx.fillStyle = '#c9935a';
      ctx.strokeStyle = '#a07838';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.roundRect(-15, -5, 30, 10, 3); ctx.fill(); ctx.stroke();
      
      // Color bands
      const bandColors = ['#8B4513','#000','#EA580C','#CFB53B'];
      bandColors.forEach((c, i) => {
        ctx.fillStyle = c;
        ctx.fillRect(-10 + i * 6, -5, 3, 10);
      });
      ctx.restore();
      
    } else if (comp.type.startsWith('led-')) {
      // LED with glow when powered
      const p1 = pinPositions[0], p2 = pinPositions[1];
      const mx = (p1.x + p2.x) / 2, my = (p1.y + p2.y) / 2;
      const color = def.color;
      
      // Leads
      ctx.strokeStyle = '#999';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(mx - 4, my); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(p2.x, p2.y); ctx.lineTo(mx + 4, my); ctx.stroke();
      
      // LED glow (when simulating)
      if (isPowered && brightness > 0) {
        const glowRadius = 15 + brightness * 20;
        const gradient = ctx.createRadialGradient(mx, my, 0, mx, my, glowRadius);
        gradient.addColorStop(0, color + 'aa');
        gradient.addColorStop(0.3, color + '44');
        gradient.addColorStop(1, color + '00');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(mx, my, glowRadius, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // LED body (triangle + line)
      ctx.fillStyle = isPowered && brightness > 0 ? color : color + '88';
      ctx.beginPath();
      ctx.moveTo(mx - 5, my - 6);
      ctx.lineTo(mx - 5, my + 6);
      ctx.lineTo(mx + 5, my);
      ctx.closePath();
      ctx.fill();
      
      // Cathode line
      ctx.strokeStyle = isPowered ? color : '#666';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(mx + 5, my - 6); ctx.lineTo(mx + 5, my + 6); ctx.stroke();
      
      // Polarity marker
      ctx.fillStyle = '#666';
      ctx.font = '7px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('+', p1.x, p1.y - 7);
      ctx.fillText('−', p2.x, p2.y - 7);
      
    } else if (comp.type === 'capacitor') {
      const p1 = pinPositions[0], p2 = pinPositions[1];
      const mx = (p1.x + p2.x) / 2, my = (p1.y + p2.y) / 2;
      // Leads
      ctx.strokeStyle = '#888';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(mx - 3, my); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(p2.x, p2.y); ctx.lineTo(mx + 3, my); ctx.stroke();
      // Plates
      ctx.strokeStyle = '#2563eb';
      ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(mx - 3, my - 7); ctx.lineTo(mx - 3, my + 7); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(mx + 3, my - 7); ctx.lineTo(mx + 3, my + 7); ctx.stroke();
      
    } else if (comp.type === 'cap-elec') {
      const p1 = pinPositions[0], p2 = pinPositions[1];
      const mx = (p1.x + p2.x) / 2, my = (p1.y + p2.y) / 2;
      ctx.strokeStyle = '#888';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(mx - 3, my); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(p2.x, p2.y); ctx.lineTo(mx + 3, my); ctx.stroke();
      // Cylinder body
      ctx.fillStyle = '#1a1a4a';
      ctx.beginPath(); ctx.arc(mx, my, 8, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#888';
      ctx.lineWidth = 0.5;
      ctx.beginPath(); ctx.arc(mx, my, 8, -0.5, 0.5); ctx.stroke();
      // + marker
      ctx.fillStyle = '#aaa';
      ctx.font = '8px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('+', p1.x, p1.y - 7);
      
    } else if (comp.type === 'diode') {
      const p1 = pinPositions[0], p2 = pinPositions[1];
      const mx = (p1.x + p2.x) / 2, my = (p1.y + p2.y) / 2;
      const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
      ctx.strokeStyle = '#888';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
      ctx.save();
      ctx.translate(mx, my);
      ctx.rotate(angle);
      ctx.fillStyle = '#1a1a1a';
      ctx.beginPath(); ctx.roundRect(-10, -4, 20, 8, 2); ctx.fill();
      ctx.fillStyle = '#ccc';
      ctx.fillRect(6, -4, 3, 8);
      ctx.restore();
      
    } else if (comp.type === 'npn' || comp.type === 'mosfet-n') {
      const p = pinPositions[1] || pinPositions[0]; // center pin
      ctx.fillStyle = '#1a1a1a';
      ctx.beginPath(); ctx.arc(p.x, p.y, 8, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#aaa';
      ctx.font = '6px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(comp.type === 'npn' ? 'NPN' : 'FET', p.x, p.y + 2);
      // Leads
      pinPositions.forEach((pp, i) => {
        ctx.strokeStyle = '#888';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(pp.x, pp.y); ctx.lineTo(p.x, p.y); ctx.stroke();
        ctx.fillStyle = '#666';
        ctx.font = '6px monospace';
        ctx.fillText(def.pinLabels?.[i] || '', pp.x, pp.y - 6);
      });
      
    } else if (comp.type === 'ic555') {
      const p0 = pinPositions[0];
      const px = p0.x - 2, py = p0.y - 2;
      const icW = 3 * CELL + 4, icH = 6 * CELL + 4;
      // IC body
      ctx.fillStyle = '#111';
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.roundRect(px, py, icW, icH, 2); ctx.fill(); ctx.stroke();
      // Notch
      ctx.beginPath(); ctx.arc(px + icW / 2, py + 1, 3, 0, Math.PI); ctx.stroke();
      // Label
      ctx.fillStyle = '#888';
      ctx.font = '8px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('555', px + icW / 2, py + icH / 2 + 3);
      // Pin labels
      pinPositions.forEach((pp, i) => {
        ctx.fillStyle = '#aaa';
        ctx.beginPath(); ctx.arc(pp.x, pp.y, 2.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#666';
        ctx.font = '5px monospace';
        ctx.textAlign = i < 4 ? 'right' : 'left';
        const labelX = i < 4 ? pp.x - 6 : pp.x + 6;
        ctx.fillText(def.pinLabels?.[i] || '', labelX, pp.y + 2);
      });
      
    } else if (comp.type === 'battery' || comp.type === 'dc5v') {
      const p1 = pinPositions[0], p2 = pinPositions[1];
      const mx = (p1.x + p2.x) / 2, my = (p1.y + p2.y) / 2;
      // Battery symbol
      ctx.strokeStyle = '#888';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(mx - 4, my); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(p2.x, p2.y); ctx.lineTo(mx + 4, my); ctx.stroke();
      // Long line (+)
      ctx.strokeStyle = comp.type === 'battery' ? '#22aa44' : '#ff8c42';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(mx - 4, my - 10); ctx.lineTo(mx - 4, my + 10); ctx.stroke();
      // Short line (-)
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(mx + 4, my - 6); ctx.lineTo(mx + 4, my + 6); ctx.stroke();
      // Labels
      ctx.fillStyle = '#aaa';
      ctx.font = '7px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('+', p1.x, p1.y - 7);
      ctx.fillText('−', p2.x, p2.y - 7);
      ctx.fillText(comp.value, mx, my - 14);
      
    } else if (comp.type === 'button') {
      const p1 = pinPositions[0], p2 = pinPositions[1];
      const mx = (p1.x + p2.x) / 2, my = (p1.y + p2.y) / 2;
      ctx.strokeStyle = '#888';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(mx, my - 8); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(p2.x, p2.y); ctx.lineTo(mx, my + 8); ctx.stroke();
      // Button body
      ctx.fillStyle = '#222';
      ctx.beginPath(); ctx.roundRect(mx - 8, my - 8, 16, 16, 3); ctx.fill();
      ctx.fillStyle = '#cc3333';
      ctx.beginPath(); ctx.arc(mx, my, 4, 0, Math.PI * 2); ctx.fill();
      
    } else if (comp.type === 'buzzer') {
      const p1 = pinPositions[0], p2 = pinPositions[1];
      const mx = (p1.x + p2.x) / 2, my = (p1.y + p2.y) / 2;
      ctx.strokeStyle = '#888';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(mx, my); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(p2.x, p2.y); ctx.lineTo(mx, my); ctx.stroke();
      ctx.fillStyle = '#111';
      ctx.beginPath(); ctx.arc(mx, my, 9, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#444';
      ctx.beginPath(); ctx.arc(mx, my, 3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#888';
      ctx.font = '6px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('♪', mx, my - 12);
      
    } else {
      // Generic component
      const p1 = pinPositions[0];
      const pLast = pinPositions[pinPositions.length - 1];
      const mx = (p1.x + pLast.x) / 2, my = (p1.y + pLast.y) / 2;
      ctx.fillStyle = def.color + '44';
      ctx.strokeStyle = def.color;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.roundRect(mx - 10, my - 8, 20, 16, 3); ctx.fill(); ctx.stroke();
      ctx.fillStyle = def.color;
      ctx.font = '7px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(def.symbol || def.name.slice(0, 3), mx, my + 3);
      pinPositions.forEach(pp => {
        ctx.strokeStyle = '#888';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(pp.x, pp.y); ctx.lineTo(mx, my); ctx.stroke();
      });
    }

    // Component value label
    ctx.fillStyle = '#888';
    ctx.font = '7px monospace';
    ctx.textAlign = 'center';
    const labelPos = pinPositions[0];
    if (!comp.type.startsWith('battery') && !comp.type.startsWith('dc')) {
      ctx.fillText(comp.value, labelPos.x, labelPos.y + CELL + 5);
    }
  });

  ctx.restore();
}

// ─── Main Component ───
export default function CircuitPrototyper() {
  const { lang } = useLanguage();
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [tool, setTool] = useState(null);
  const [wireMode, setWireMode] = useState(false);
  const [wireStart, setWireStart] = useState(null);
  const [placed, setPlaced] = useState([]);
  const [wires, setWires] = useState([]);
  const [hovered, setHovered] = useState(null);
  const [simResult, setSimResult] = useState(null);
  const [simRunning, setSimRunning] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [cat, setCat] = useState('passive');
  const zoomRef = useRef(2.2);
  const panRef = useRef({ x: 0, y: 0 });
  const dragRef = useRef({ on: false, lx: 0, ly: 0, moved: false, btn: -1 });

  // Run simulation
  useEffect(() => {
    const r = simulate(placed, wires);
    setSimResult(r);
  }, [placed, wires, simRunning]);

  // Render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf;
    const render = () => {
      const rect = canvas.parentElement.getBoundingClientRect();
      canvas.width = rect.width * devicePixelRatio;
      canvas.height = rect.height * devicePixelRatio;
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
      ctx.scale(devicePixelRatio, devicePixelRatio);
      drawScene(ctx, rect.width, rect.height, zoomRef.current, panRef.current.x, panRef.current.y,
        placed, wires, hovered, simResult, tool, wireStart, simRunning);
      raf = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(raf);
  }, [placed, wires, hovered, simResult, tool, wireStart, simRunning]);

  // ─── Input Handlers ───
  const getHole = useCallback((e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    return hitTest(px, py, zoomRef.current, panRef.current.x, panRef.current.y);
  }, []);

  const onPointerDown = (e) => {
    dragRef.current = { on: true, lx: e.clientX, ly: e.clientY, moved: false, btn: e.button };
    e.preventDefault();
  };

  const onPointerMove = (e) => {
    const d = dragRef.current;
    if (d.on) {
      const dx = e.clientX - d.lx, dy = e.clientY - d.ly;
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) d.moved = true;
      if ((d.btn === 1 || d.btn === 2) || (d.btn === 0 && !tool && !wireMode)) {
        panRef.current.x += dx;
        panRef.current.y += dy;
      }
      d.lx = e.clientX;
      d.ly = e.clientY;
    }
    setHovered(getHole(e));
  };

  const onPointerUp = (e) => {
    if (!dragRef.current.moved) {
      const hole = getHole(e);
      if (hole) {
        if (wireMode) {
          if (!wireStart) { setWireStart(hole); }
          else {
            if (wireStart.col !== hole.col || wireStart.row !== hole.row) {
              setWires(p => [...p, { sc: wireStart.col, sr: wireStart.row, ec: hole.col, er: hole.row }]);
            }
            setWireStart(null);
          }
        } else if (tool) {
          const def = COMP_DEFS[tool];
          // Check if pins fit on board
          const fits = def.pins.every(p => hole.col + p.dx >= 0 && hole.col + p.dx < COLS && hole.row + p.dy >= 0 && hole.row + p.dy < ROWS);
          if (fits) {
            setPlaced(p => [...p, { type: tool, col: hole.col, row: hole.row, value: def.defaultVal }]);
          }
        }
      }
    }
    dragRef.current.on = false;
  };

  const onWheel = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    zoomRef.current = Math.max(0.8, Math.min(5, zoomRef.current * delta));
  }, []);

  // Prevent page scroll on canvas
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = (e) => { e.preventDefault(); };
    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') { setTool(null); setWireMode(false); setWireStart(null); }
      if (e.key === 'w' || e.key === 'W') { setWireMode(m => !m); setTool(null); }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (placed.length > 0) setPlaced(p => p.slice(0, -1));
        else if (wires.length > 0) setWires(w => w.slice(0, -1));
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [placed, wires]);

  const toggleFullscreen = () => {
    if (!fullscreen) {
      containerRef.current?.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setFullscreen(!fullscreen);
  };

  // Listen for fullscreen change
  useEffect(() => {
    const handler = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const filtered = Object.entries(COMP_DEFS).filter(([_, d]) => d.cat === cat);
  const scoreColor = !simResult ? '#666' : simResult.score >= 80 ? '#22c55e' : simResult.score >= 50 ? '#f59e0b' : '#ef4444';

  const ctx = {
    components: placed.map(c => ({ type: COMP_DEFS[c.type]?.name, value: c.value, pos: `col:${c.col} row:${c.row}` })),
    wires: wires.length,
    simulation: simResult ? { score: simResult.score, errors: simResult.errors.length, warnings: simResult.warnings.length } : null,
  };

  return (
    <div className="space-y-3">
      {/* Canvas + toolbar */}
      <div ref={containerRef} className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--sc-border)', background: '#0e1018' }}>
        {/* Toolbar */}
        <div className="flex items-center justify-between px-3 py-2 border-b" style={{ background: 'var(--sc-surface)', borderColor: 'var(--sc-border)' }}>
          <div className="flex items-center gap-2">
            <button onClick={() => setSimRunning(!simRunning)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer border transition-all"
              style={{
                background: simRunning ? 'rgba(34,197,94,0.15)' : 'var(--sc-surface2)',
                borderColor: simRunning ? '#22c55e' : 'var(--sc-border)',
                color: simRunning ? '#22c55e' : 'var(--sc-dim)',
              }}>
              {simRunning ? '⏹ Stop Simulation' : '▶ Start Simulation'}
            </button>
            <button onClick={() => { setWireMode(!wireMode); setTool(null); setWireStart(null); }}
              className="px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer border"
              style={{
                background: wireMode ? 'rgba(59,130,246,0.15)' : 'var(--sc-surface2)',
                borderColor: wireMode ? '#3b82f6' : 'var(--sc-border)',
                color: wireMode ? '#3b82f6' : 'var(--sc-dim)',
              }}>
              {wireMode ? '🔗 Wire Mode ON' : '🔗 Wire (W)'}
            </button>
            <span className="text-[9px] font-mono" style={{ color: 'var(--sc-dim)' }}>
              ESC: deselect · DEL: undo · W: wire toggle
            </span>
          </div>
          <div className="flex items-center gap-2">
            {simResult && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: scoreColor + '22', color: scoreColor }}>
                Score: {simResult.score}/100
              </span>
            )}
            <button onClick={toggleFullscreen} className="px-2 py-1 rounded text-xs cursor-pointer border"
              style={{ background: 'var(--sc-surface2)', borderColor: 'var(--sc-border)', color: 'var(--sc-dim)' }}>
              {fullscreen ? '⊡ Exit' : '⛶ Fullscreen'}
            </button>
          </div>
        </div>

        {/* Canvas */}
        <div style={{ height: fullscreen ? 'calc(100vh - 80px)' : '450px', cursor: tool || wireMode ? 'crosshair' : 'grab' }}
          onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp}
          onContextMenu={e => e.preventDefault()}>
          <canvas ref={canvasRef} className="w-full h-full" />
        </div>

        {/* Status bar */}
        <div className="flex items-center justify-between px-3 py-1 text-[9px] border-t" style={{ background: 'var(--sc-surface)', borderColor: 'var(--sc-border)', color: 'var(--sc-dim)' }}>
          <span>
            {tool ? `📌 Placing: ${COMP_DEFS[tool]?.name} — click hole` :
             wireMode ? (wireStart ? `🔗 Click second hole (from ${wireStart.col},${wireStart.row})` : '🔗 Click first hole') :
             '🖱️ Drag: pan · Scroll: zoom · Click: select tool first'}
          </span>
          <span className="font-mono">
            {hovered ? `Hole: ${String.fromCharCode(97 + hovered.row)}${hovered.col + 1}` : ''}
            {' · '}{placed.length} parts · {wires.length} wires
          </span>
        </div>
      </div>

      {/* Simulation errors/warnings */}
      {simResult && (simResult.errors.length > 0 || simResult.warnings.length > 0 || simResult.info.length > 0) && (
        <div className="rounded-2xl border p-3 space-y-1.5" style={{ background: 'var(--sc-surface)', borderColor: 'var(--sc-border)' }}>
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--sc-dim)' }}>⚡ Circuit Analysis</h3>
            <div className="h-1.5 flex-1 mx-4 rounded-full overflow-hidden" style={{ background: 'var(--sc-surface2)' }}>
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${simResult.score}%`, background: scoreColor }} />
            </div>
          </div>
          <div className="space-y-1 max-h-[150px] overflow-auto text-[11px]">
            {simResult.errors.map((e, i) => <div key={'e' + i} className="p-1.5 rounded" style={{ background: 'rgba(239,68,68,0.08)', color: '#fca5a5' }}>{e}</div>)}
            {simResult.warnings.map((w, i) => <div key={'w' + i} className="p-1.5 rounded" style={{ background: 'rgba(245,158,11,0.06)', color: '#fcd34d' }}>{w}</div>)}
            {simResult.info.map((inf, i) => <div key={'i' + i} className="p-1.5 rounded" style={{ background: 'rgba(59,130,246,0.05)', color: 'var(--sc-dim)' }}>{inf}</div>)}
          </div>
        </div>
      )}

      {/* Bottom panels */}
      <div className="flex gap-3 flex-wrap">
        {/* Component palette */}
        <div className="flex-1 min-w-[250px] space-y-3">
          <div className="rounded-2xl border p-3" style={{ background: 'var(--sc-surface)', borderColor: 'var(--sc-border)' }}>
            <h3 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--sc-dim)' }}>Components</h3>
            <div className="flex gap-1 mb-2 flex-wrap">
              {CATEGORIES.map(c => (
                <button key={c.id} onClick={() => setCat(c.id)}
                  className="px-1.5 py-0.5 rounded text-[9px] font-semibold cursor-pointer border"
                  style={{
                    background: cat === c.id ? 'color-mix(in srgb, var(--sc-accent) 10%, transparent)' : 'var(--sc-surface2)',
                    borderColor: cat === c.id ? 'var(--sc-accent)' : 'var(--sc-border)',
                    color: cat === c.id ? 'var(--sc-accent)' : 'var(--sc-dim)',
                  }}>
                  {c.icon} {c.name}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-1 max-h-[180px] overflow-auto">
              {filtered.map(([id, def]) => (
                <button key={id} onClick={() => { setTool(tool === id ? null : id); setWireMode(false); setWireStart(null); }}
                  className="flex items-center gap-1.5 p-1.5 rounded-lg text-left cursor-pointer border"
                  style={{
                    background: tool === id ? 'color-mix(in srgb, var(--sc-accent) 10%, transparent)' : 'var(--sc-surface2)',
                    borderColor: tool === id ? 'var(--sc-accent)' : 'var(--sc-border)',
                  }}>
                  <div className="w-3 h-3 rounded-sm" style={{ background: def.color }} />
                  <div className="min-w-0">
                    <div className="text-[9px] font-semibold truncate" style={{ color: 'var(--sc-text)' }}>{def.name}</div>
                    <div className="text-[7px] truncate" style={{ color: 'var(--sc-dim)' }}>{def.defaultVal}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* BOM */}
          <div className="rounded-2xl border p-3" style={{ background: 'var(--sc-surface)', borderColor: 'var(--sc-border)' }}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--sc-dim)' }}>BOM ({placed.length})</h3>
              {placed.length > 0 && <button onClick={() => { setPlaced([]); setWires([]); }} className="text-[9px] cursor-pointer" style={{ color: 'var(--sc-accent)' }}>Clear</button>}
            </div>
            <div className="space-y-1 max-h-[120px] overflow-auto">
              {placed.map((c, i) => {
                const d = COMP_DEFS[c.type];
                return (
                  <div key={i} className="flex items-center gap-1 p-1 rounded border text-[9px]" style={{ background: 'var(--sc-surface2)', borderColor: 'var(--sc-border)' }}>
                    <div className="w-2 h-2 rounded-sm" style={{ background: d?.color }} />
                    <span className="flex-1 truncate font-semibold" style={{ color: 'var(--sc-text)' }}>{d?.name}</span>
                    <input type="text" value={c.value} onChange={e => setPlaced(p => p.map((x, j) => j === i ? { ...x, value: e.target.value } : x))}
                      className="w-14 bg-transparent border-none outline-none text-right font-mono text-[8px]" style={{ color: 'var(--sc-accent)' }} />
                    <button onClick={() => setPlaced(p => p.filter((_, j) => j !== i))} className="opacity-40 hover:opacity-100 cursor-pointer">✕</button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* AI Panel */}
        <div className="flex-1 min-w-[300px]">
          <AIPanel context={ctx} toolId="prototyper" />
        </div>
      </div>
    </div>
  );
}
