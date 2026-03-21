'use client';
import { useEffect, useMemo, useRef, useState, useCallback, useReducer } from 'react';
import AIPanel from '@/components/AIPanel';
import { useLanguage } from '@/lib/LanguageContext';
import { CATEGORIES, COMP_DEFS, simulatePrototyper as simulate } from '@/lib/circuitSim';
import { BB, holeKey, inBounds, mainHole, railHole } from '@/lib/prototyper/breadboard';
import { queryParamToState, stateToQueryParam } from '@/lib/prototyper/serialize';

// ─── Constants ───
const COLS = 30, ROWS = 10, GAP = 5; // GAP is first row of bottom half
const CELL = 22; // pixels per cell
const PAD_X = 60, PAD_Y = 50; // padding around breadboard
const BB_W = COLS * CELL, BB_H = (ROWS + 1) * CELL; // +1 for channel gap
const RAIL_GAP = 0.9 * CELL;
const RAIL_Y = {
  'top+': PAD_Y - (2 * CELL + RAIL_GAP),
  'top-': PAD_Y - (1 * CELL + RAIL_GAP),
  'bot+': PAD_Y + BB_H + (1 * CELL + RAIL_GAP),
  'bot-': PAD_Y + BB_H + (2 * CELL + RAIL_GAP),
};

const WIRE_COLORS = ['#3b82f6','#ef4444','#22c55e','#eab308','#f97316','#a855f7','#ec4899','#06b6d4','#f43f5e','#8b5cf6'];

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

function holePos(hole) {
  const x = PAD_X + hole.col * CELL;
  if (hole.kind === 'rail') return { x, y: RAIL_Y[hole.rail] };
  let y = hole.row * CELL;
  if (hole.row >= GAP) y += CELL; // shift bottom half down for channel
  return { x, y: PAD_Y + y };
}

function hitTestHole(px, py, zoom, panX, panY) {
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r < ROWS; r++) {
      const { x, y } = holePos(mainHole(c, r));
      const sx = x * zoom + panX, sy = y * zoom + panY;
      if (Math.abs(px - sx) < CELL * zoom * 0.45 && Math.abs(py - sy) < CELL * zoom * 0.45) {
        return mainHole(c, r);
      }
    }
  }
  for (const rail of BB.RAILS) {
    for (let c = 0; c < COLS; c++) {
      const { x, y } = holePos(railHole(rail, c));
      const sx = x * zoom + panX, sy = y * zoom + panY;
      if (Math.abs(px - sx) < CELL * zoom * 0.45 && Math.abs(py - sy) < CELL * zoom * 0.45) {
        return railHole(rail, c);
      }
    }
  }
  return null;
}

function distPointToSeg(px, py, x1, y1, x2, y2) {
  const vx = x2 - x1, vy = y2 - y1;
  const wx = px - x1, wy = py - y1;
  const c1 = vx * wx + vy * wy;
  if (c1 <= 0) return Math.hypot(px - x1, py - y1);
  const c2 = vx * vx + vy * vy;
  if (c2 <= c1) return Math.hypot(px - x2, py - y2);
  const t = c1 / c2;
  const projx = x1 + t * vx, projy = y1 + t * vy;
  return Math.hypot(px - projx, py - projy);
}

function computePinsAbs(anchor, rot, def) {
  const rr = ((rot || 0) % 360 + 360) % 360;
  const rotate = (dx, dy) => {
    if (rr === 0) return { dx, dy };
    if (rr === 90) return { dx: -dy, dy: dx };
    if (rr === 180) return { dx: -dx, dy: -dy };
    if (rr === 270) return { dx: dy, dy: -dx };
    return { dx, dy };
  };
  return def.pins.map((p) => {
    const r = rotate(p.dx, p.dy);
    return mainHole(anchor.col + r.dx, anchor.row + r.dy);
  });
}

function fitsOnBoard(anchor, rot, def) {
  if (!anchor || anchor.kind !== 'main') return false;
  const pins = computePinsAbs(anchor, rot, def);
  return pins.every(inBounds);
}

// ─── Canvas Renderer ───
function drawScene(ctx, w, h, zoom, panX, panY, components, wires, hovered, simOut, ui, tMs) {
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
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

  // Power rail lines (+ red, - blue)
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
  drawRail(RAIL_Y['top+'], '#cc3333');
  drawRail(RAIL_Y['top-'], '#2b6cff');
  drawRail(RAIL_Y['bot+'], '#cc3333');
  drawRail(RAIL_Y['bot-'], '#2b6cff');

  // Row labels
  ctx.fillStyle = '#666';
  ctx.font = '9px monospace';
  ctx.textAlign = 'right';
  const rowLabels = ['a','b','c','d','e','f','g','h','i','j'];
  for (let r = 0; r < ROWS; r++) {
    const { y } = holePos(mainHole(0, r));
    ctx.fillText(rowLabels[r], PAD_X - 20, y + 3);
  }
  // Col labels
  ctx.textAlign = 'center';
  for (let c = 0; c < COLS; c++) {
    const { x } = holePos(mainHole(c, 0));
    ctx.fillText(String(c + 1), x, PAD_Y - 22);
  }

  // ─── Holes ───
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r < ROWS; r++) {
      const h = mainHole(c, r);
      const { x, y } = holePos(h);
      const isHovered = hovered && hovered.kind === 'main' && hovered.col === c && hovered.row === r;
      
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

  // Rail holes
  for (const rail of BB.RAILS) {
    for (let c = 0; c < COLS; c++) {
      const h = railHole(rail, c);
      const { x, y } = holePos(h);
      const isHovered = hovered && hovered.kind === 'rail' && hovered.rail === rail && hovered.col === c;
      ctx.beginPath();
      ctx.arc(x, y, isHovered ? 4.2 : 3.2, 0, Math.PI * 2);
      ctx.fillStyle = isHovered ? '#ff8c42' : '#2a2a2a';
      if (isHovered) {
        ctx.shadowColor = '#ff8c42';
        ctx.shadowBlur = 8;
      } else {
        ctx.shadowBlur = 0;
      }
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  // ─── Wires ───
  wires.forEach((w, i) => {
    const p1 = holePos(w.a);
    const p2 = holePos(w.b);
    const color = w.color || WIRE_COLORS[i % WIRE_COLORS.length];
    const isSelected = ui?.selected?.kind === 'wire' && ui.selected.id === w.id;
    
    // Wire shadow
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = isSelected ? 6 : 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(p1.x + 1, p1.y + 1);
    ctx.lineTo(p2.x + 1, p2.y + 1);
    ctx.stroke();
    
    // Wire
    ctx.strokeStyle = color;
    ctx.lineWidth = isSelected ? 4 : 3;
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
  if (ui?.wireStart && hovered) {
    const p1 = holePos(ui.wireStart);
    const p2 = holePos(hovered);
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
    
    const ledState = simOut?.result?.ledStates?.get?.(comp.id);
    const isPowered = ledState?.powered;
    const brightness = ledState?.brightness || 0;
    const burned = ledState?.burned;
    const isSelected = ui?.selected?.kind === 'component' && ui.selected.id === comp.id;

    // Pin positions
    const pinsAbs = comp.pinsAbs || (comp.anchor?.kind === 'main' ? computePinsAbs(comp.anchor, comp.rot, def) : []);
    const pinPositions = pinsAbs.map((p) => holePos(p));

    // Selection highlight
    if (isSelected && pinPositions.length) {
      const p1 = pinPositions[0];
      const p2 = pinPositions[pinPositions.length - 1];
      const mx = (p1.x + p2.x) / 2, my = (p1.y + p2.y) / 2;
      ctx.strokeStyle = 'rgba(255,140,66,0.9)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.roundRect(mx - 18, my - 14, 36, 28, 6);
      ctx.stroke();
      ctx.setLineDash([]);
    }

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

      // Burned LED: warning + red blinking
      if (burned) {
        const phase = (tMs || 0) / 180;
        const a = 0.35 + 0.35 * (0.5 + 0.5 * Math.sin(phase));
        ctx.strokeStyle = `rgba(239,68,68,${a})`;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(mx, my, 10, 0, Math.PI * 2);
        ctx.stroke();
      }
      
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
      const pts = pinPositions;
      const pTL = pts[0], pTR = pts[1], pBL = pts[2], pBR = pts[3];
      const mx = (pTL.x + pBR.x) / 2, my = (pTL.y + pBR.y) / 2;
      ctx.strokeStyle = '#888';
      ctx.lineWidth = 1.5;
      // Leads
      [pTL, pTR, pBL, pBR].forEach((p) => {
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(mx, my); ctx.stroke();
      });
      // Button body bridging channel
      ctx.fillStyle = '#222';
      ctx.beginPath(); ctx.roundRect(mx - 10, my - 10, 20, 20, 4); ctx.fill();
      ctx.strokeStyle = '#444';
      ctx.stroke();
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

    // Issue icon (burned LED, sim issues)
    if (burned && pinPositions.length) {
      const p0 = pinPositions[0];
      ctx.fillStyle = '#f59e0b';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('⚠', p0.x + 6, p0.y - 6);
    }
  });

  // Ghost preview (placement)
  if (ui?.ghost && ui.ghost.def && ui.ghost.anchor) {
    const { def, anchor, rot, ok } = ui.ghost;
    const pins = computePinsAbs(anchor, rot, def);
    const pinPositions = pins.map((p) => holePos(p));
    ctx.globalAlpha = 0.55;
    ctx.strokeStyle = ok ? 'rgba(34,197,94,0.9)' : 'rgba(239,68,68,0.9)';
    ctx.lineWidth = 2;
    pinPositions.forEach((pp) => {
      ctx.beginPath();
      ctx.arc(pp.x, pp.y, 5.5, 0, Math.PI * 2);
      ctx.stroke();
    });
    ctx.globalAlpha = 1;
  }

  ctx.restore();
}

// ─── History Reducer ───
function historyReducer(state, action) {
  switch (action.type) {
    case 'SET': {
      return { past: [], present: action.present, future: [] };
    }
    case 'PATCH': {
      // Live updates (e.g., dragging) without polluting undo history.
      return { ...state, present: action.present };
    }
    case 'COMMIT': {
      const next = action.present;
      if (JSON.stringify(next) === JSON.stringify(state.present)) return state;
      return { past: [...state.past, state.present], present: next, future: [] };
    }
    case 'COMMIT_WITH_PAST': {
      const next = action.present;
      return { past: [...state.past, action.pastEntry], present: next, future: [] };
    }
    case 'UNDO': {
      if (state.past.length === 0) return state;
      const past = state.past.slice(0, -1);
      const prev = state.past[state.past.length - 1];
      return { past, present: prev, future: [state.present, ...state.future] };
    }
    case 'REDO': {
      if (state.future.length === 0) return state;
      const [next, ...rest] = state.future;
      return { past: [...state.past, state.present], present: next, future: rest };
    }
    default:
      return state;
  }
}

function cryptoId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `id_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

// ─── Main Component ───
export default function CircuitPrototyper() {
  const { lang } = useLanguage();
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [tool, setTool] = useState(null); // component type to place
  const [wireMode, setWireMode] = useState(false);
  const [meterMode, setMeterMode] = useState(false);
  const [wireStart, setWireStart] = useState(null);
  const [hovered, setHovered] = useState(null);
  const [selected, setSelected] = useState(null); // {kind:'component'|'wire', id}
  const [meterA, setMeterA] = useState(null);
  const [meterB, setMeterB] = useState(null);
  const [simOut, setSimOut] = useState(null);
  const [simRunning, setSimRunning] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [cat, setCat] = useState('passive');
  const [paletteQuery, setPaletteQuery] = useState('');
  const zoomRef = useRef(2.2);
  const panRef = useRef({ x: 0, y: 0 });
  const dragRef = useRef({ on: false, lx: 0, ly: 0, moved: false, btn: -1, draggingPartId: null, dragStartPresent: null });
  const colorIdxRef = useRef(0);

  const [hist, dispatch] = useReducer(historyReducer, {
    past: [],
    present: { components: [], wires: [] },
    future: [],
  });
  const components = hist.present.components;
  const wires = hist.present.wires;

  // Load state from URL (shareable)
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const c = sp.get('c');
    if (c) {
      const decoded = queryParamToState(c);
      if (decoded) {
        dispatch({ type: 'SET', present: { components: decoded.components, wires: decoded.wires } });
      }
    }
  }, []);

  // Persist state to URL (debounced)
  useEffect(() => {
    const t = setTimeout(() => {
      const sp = new URLSearchParams(window.location.search);
      sp.set('c', stateToQueryParam({ components, wires }));
      const next = `${window.location.pathname}?${sp.toString()}`;
      window.history.replaceState(null, '', next);
    }, 250);
    return () => clearTimeout(t);
  }, [components, wires]);

  // Run simulation
  useEffect(() => {
    const out = simulate(components, wires, { simRunning });
    setSimOut(out);
  }, [components, wires, simRunning]);

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
      ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
      drawScene(ctx, rect.width, rect.height, zoomRef.current, panRef.current.x, panRef.current.y,
        simOut?.comps || components, simOut?.wires || wires, hovered, simOut, {
          selected,
          wireStart,
          ghost: (() => {
            if (!tool || !hovered || hovered.kind !== 'main') return null;
            const def = COMP_DEFS[tool];
            if (!def) return null;
            const ok = fitsOnBoard(hovered, 0, def);
            return { def, anchor: hovered, rot: 0, ok };
          })(),
        }, performance.now());
      raf = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(raf);
  }, [components, wires, hovered, simOut, tool, wireStart, simRunning, selected]);

  // ─── Input Handlers ───
  const getHole = useCallback((e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    return hitTestHole(px, py, zoomRef.current, panRef.current.x, panRef.current.y);
  }, []);

  const hitTestWire = useCallback((e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    // Convert to world space
    const wx = (px - panRef.current.x) / zoomRef.current;
    const wy = (py - panRef.current.y) / zoomRef.current;
    let best = null;
    let bestD = 6;
    for (const w of wires) {
      const p1 = holePos(w.a);
      const p2 = holePos(w.b);
      const d = distPointToSeg(wx, wy, p1.x, p1.y, p2.x, p2.y);
      if (d < bestD) {
        bestD = d;
        best = w;
      }
    }
    return best;
  }, [wires]);

  const hitTestComponent = useCallback((e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const wx = (px - panRef.current.x) / zoomRef.current;
    const wy = (py - panRef.current.y) / zoomRef.current;
    // Prefer closest component center
    let best = null;
    let bestD = 9999;
    for (const c of (simOut?.comps || components)) {
      const def = COMP_DEFS[c.type];
      if (!def) continue;
      const pins = c.pinsAbs || (c.anchor?.kind === 'main' ? computePinsAbs(c.anchor, c.rot, def) : []);
      if (!pins.length) continue;
      const p1 = holePos(pins[0]);
      const p2 = holePos(pins[pins.length - 1]);
      const mx = (p1.x + p2.x) / 2;
      const my = (p1.y + p2.y) / 2;
      const d = Math.hypot(wx - mx, wy - my);
      if (d < 18 && d < bestD) {
        bestD = d;
        best = c;
      }
    }
    return best;
  }, [components, simOut]);

  const onPointerDown = (e) => {
    dragRef.current = { on: true, lx: e.clientX, ly: e.clientY, moved: false, btn: e.button };
    e.preventDefault();

    // Start dragging selected component if clicked on it
    if (e.button === 0 && !wireMode && !tool && !meterMode) {
      const comp = hitTestComponent(e);
      if (comp) {
        setSelected({ kind: 'component', id: comp.id });
        dragRef.current.draggingPartId = comp.id;
        dragRef.current.dragStartPresent = hist.present;
      } else {
        const w = hitTestWire(e);
        if (w) setSelected({ kind: 'wire', id: w.id });
        else setSelected(null);
      }
    }
  };

  const onPointerMove = (e) => {
    const d = dragRef.current;
    if (d.on) {
      const dx = e.clientX - d.lx, dy = e.clientY - d.ly;
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) d.moved = true;
      if (d.draggingPartId) {
        // Drag component anchor (snap to hovered main hole)
        const h = getHole(e);
        if (h && h.kind === 'main') {
          const idx = components.findIndex((c) => c.id === d.draggingPartId);
          const comp = components[idx];
          if (comp) {
            const def = COMP_DEFS[comp.type];
            if (def && fitsOnBoard(h, comp.rot || 0, def)) {
              const next = {
                components: components.map((c) => (c.id === d.draggingPartId ? { ...c, anchor: h } : c)),
                wires,
              };
              dispatch({ type: 'PATCH', present: next });
            }
          }
        }
      } else if ((d.btn === 1 || d.btn === 2) || (d.btn === 0 && !tool && !wireMode && !meterMode)) {
        panRef.current.x += dx;
        panRef.current.y += dy;
      }
      d.lx = e.clientX;
      d.ly = e.clientY;
    }
    setHovered(getHole(e));
  };

  const onPointerUp = (e) => {
    // If we were dragging a component and actually moved, commit once for undo.
    if (dragRef.current.draggingPartId && dragRef.current.moved) {
      dispatch({ type: 'COMMIT_WITH_PAST', pastEntry: dragRef.current.dragStartPresent, present: { components, wires } });
    }
    if (!dragRef.current.moved) {
      const hole = getHole(e);
      if (hole) {
        if (meterMode) {
          if (!meterA) setMeterA(hole);
          else if (!meterB) setMeterB(hole);
          else { setMeterA(hole); setMeterB(null); }
        } else if (wireMode) {
          if (!wireStart) { setWireStart(hole); }
          else {
            if (holeKey(wireStart) !== holeKey(hole)) {
              const color = WIRE_COLORS[colorIdxRef.current % WIRE_COLORS.length];
              colorIdxRef.current++;
              const next = {
                components,
                wires: [...wires, { id: cryptoId(), a: wireStart, b: hole, color }],
              };
              dispatch({ type: 'COMMIT', present: next });
            }
            setWireStart(null);
          }
        } else if (tool) {
          const def = COMP_DEFS[tool];
          if (def && hole.kind === 'main') {
            const fits = fitsOnBoard(hole, 0, def);
            if (fits) {
              const next = {
                components: [...components, { id: cryptoId(), type: tool, anchor: hole, rot: 0, value: def.defaultVal, props: {} }],
                wires,
              };
              dispatch({ type: 'COMMIT', present: next });
            }
          }
        }
      }
    }
    dragRef.current.on = false;
    dragRef.current.draggingPartId = null;
  };

  const onWheel = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const rect = canvasRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const wx = (mx - panRef.current.x) / zoomRef.current;
    const wy = (my - panRef.current.y) / zoomRef.current;
    const nextZoom = clamp(zoomRef.current * delta, 0.8, 5);
    // Zoom to cursor
    panRef.current.x = mx - wx * nextZoom;
    panRef.current.y = my - wy * nextZoom;
    zoomRef.current = nextZoom;
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
      const key = e.key;
      if (key === 'Escape') { setTool(null); setWireMode(false); setMeterMode(false); setWireStart(null); setSelected(null); }
      if (key === 'w' || key === 'W') { setWireMode(m => !m); setMeterMode(false); setTool(null); setWireStart(null); }
      if (key === 'm' || key === 'M') { setMeterMode(m => !m); setWireMode(false); setTool(null); setWireStart(null); setMeterA(null); setMeterB(null); }
      if (key === ' ') { e.preventDefault(); setSimRunning(s => !s); }
      if ((e.ctrlKey || e.metaKey) && (key === 'z' || key === 'Z')) {
        e.preventDefault();
        if (e.shiftKey) dispatch({ type: 'REDO' });
        else dispatch({ type: 'UNDO' });
      }
      if (key === 'r' || key === 'R') {
        if (selected?.kind === 'component') {
          const idx = components.findIndex((c) => c.id === selected.id);
          const comp = components[idx];
          const def = comp ? COMP_DEFS[comp.type] : null;
          if (comp && def) {
            const nextRot = ((comp.rot || 0) + 90) % 360;
            if (fitsOnBoard(comp.anchor, nextRot, def)) {
              dispatch({
                type: 'COMMIT',
                present: {
                  components: components.map((c) => (c.id === comp.id ? { ...c, rot: nextRot } : c)),
                  wires,
                },
              });
            }
          }
        }
      }
      if (key === 'Delete' || key === 'Backspace') {
        if (selected?.kind === 'component') {
          dispatch({ type: 'COMMIT', present: { components: components.filter((c) => c.id !== selected.id), wires } });
          setSelected(null);
        } else if (selected?.kind === 'wire') {
          dispatch({ type: 'COMMIT', present: { components, wires: wires.filter((w) => w.id !== selected.id) } });
          setSelected(null);
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [components, wires, selected, meterMode]);

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

  const filtered = Object.entries(COMP_DEFS).filter(([id, d]) => {
    if (d.cat !== cat) return false;
    const q = paletteQuery.trim().toLowerCase();
    if (!q) return true;
    return id.toLowerCase().includes(q) || d.name.toLowerCase().includes(q) || String(d.defaultVal || '').toLowerCase().includes(q);
  });
  const score = simOut?.result?.score;
  const scoreColor = score == null ? '#666' : score >= 80 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#ef4444';

  const meterRead = useMemo(() => {
    if (!meterA || !meterB || !simOut?.result?.nodeV || !simOut?.ds) return null;
    const na = simOut.netIdOfHole(meterA);
    const nb = simOut.netIdOfHole(meterB);
    const va = simOut.result.nodeV.get(na) ?? 0;
    const vb = simOut.result.nodeV.get(nb) ?? 0;
    return { v: va - vb, va, vb };
  }, [meterA, meterB, simOut]);

  const ctx = {
    components: components.map(c => ({ type: COMP_DEFS[c.type]?.name, value: c.value, pos: c.anchor ? holeKey(c.anchor) : '' })),
    wires: wires.length,
    simulation: simOut?.result ? { score: simOut.result.score, issues: simOut.result.issues.length } : null,
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
              <button
                onClick={() => dispatch({ type: 'UNDO' })}
                className="px-2.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer border"
                style={{ background: 'var(--sc-surface2)', borderColor: 'var(--sc-border)', color: 'var(--sc-dim)' }}
                title="Undo (Ctrl+Z)"
              >
                ↩ Undo
              </button>
              <button
                onClick={() => dispatch({ type: 'REDO' })}
                className="px-2.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer border"
                style={{ background: 'var(--sc-surface2)', borderColor: 'var(--sc-border)', color: 'var(--sc-dim)' }}
                title="Redo (Ctrl+Shift+Z)"
              >
                ↪ Redo
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
              <button onClick={() => { setMeterMode(!meterMode); setWireMode(false); setTool(null); setWireStart(null); setMeterA(null); setMeterB(null); }}
                className="px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer border"
                style={{
                  background: meterMode ? 'rgba(6,182,212,0.12)' : 'var(--sc-surface2)',
                  borderColor: meterMode ? '#06b6d4' : 'var(--sc-border)',
                  color: meterMode ? '#06b6d4' : 'var(--sc-dim)',
                }}>
                {meterMode ? '📟 Meter ON' : '📟 Meter (M)'}
              </button>
            <span className="text-[9px] font-mono" style={{ color: 'var(--sc-dim)' }}>
              Space: sim · ESC: clear · DEL: delete · W: wire · M: meter · R: rotate · Ctrl+Z: undo
            </span>
          </div>
          <div className="flex items-center gap-2">
            {score != null && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: scoreColor + '22', color: scoreColor }}>
                Score: {score}/100
              </span>
            )}
            {(meterMode && meterRead) && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full" style={{ background: 'rgba(6,182,212,0.10)', color: '#67e8f9', border: '1px solid rgba(6,182,212,0.35)' }}>
                V = {meterRead.v.toFixed(3)}V
              </span>
            )}
            <button
              onClick={() => { dispatch({ type: 'SET', present: { components: [], wires: [] } }); setSelected(null); setTool(null); setWireMode(false); setMeterMode(false); setWireStart(null); }}
              className="px-2 py-1 rounded text-xs cursor-pointer border"
              style={{ background: 'var(--sc-surface2)', borderColor: 'var(--sc-border)', color: 'var(--sc-dim)' }}
              title="Clear All"
            >
              🗑 Clear
            </button>
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
             meterMode ? (meterA ? (meterB ? '📟 Click hole to reset A' : '📟 Click second hole (B)') : '📟 Click first hole (A)') :
             wireMode ? (wireStart ? `🔗 Click second hole` : '🔗 Click first hole') :
             selected ? `✅ Selected ${selected.kind}` :
             '🖱️ Drag: pan · Scroll: zoom · Click: select'}
          </span>
          <span className="font-mono">
            {hovered && hovered.kind === 'main' ? `Hole: ${String.fromCharCode(97 + hovered.row)}${hovered.col + 1}` : hovered && hovered.kind === 'rail' ? `Rail: ${hovered.rail} ${hovered.col + 1}` : ''}
            {' · '}{components.length} parts · {wires.length} wires
          </span>
        </div>
      </div>

      {/* Simulation errors/warnings */}
      {simOut?.result && simOut.result.issues.length > 0 && (
        <div className="rounded-2xl border p-3 space-y-1.5" style={{ background: 'var(--sc-surface)', borderColor: 'var(--sc-border)' }}>
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--sc-dim)' }}>⚡ Circuit Analysis</h3>
            <div className="h-1.5 flex-1 mx-4 rounded-full overflow-hidden" style={{ background: 'var(--sc-surface2)' }}>
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${score || 0}%`, background: scoreColor }} />
            </div>
          </div>
          {(() => {
            const errs = simOut.result.issues.filter((x) => x.severity === 'error');
            const warns = simOut.result.issues.filter((x) => x.severity === 'warn');
            const tips = simOut.result.issues.filter((x) => x.severity === 'info');
            const Row = (it, i) => (
              <div
                key={i}
                className="p-1.5 rounded cursor-pointer"
                onClick={() => { if (it.target?.kind === 'component') setSelected({ kind: 'component', id: it.target.id }); }}
                style={{
                  background: it.severity === 'error' ? 'rgba(239,68,68,0.08)' : it.severity === 'warn' ? 'rgba(245,158,11,0.06)' : 'rgba(59,130,246,0.05)',
                  color: it.severity === 'error' ? '#fca5a5' : it.severity === 'warn' ? '#fcd34d' : 'var(--sc-dim)',
                }}
              >
                {it.message}
              </div>
            );
            return (
              <div className="space-y-2 max-h-[180px] overflow-auto text-[11px]">
                {errs.length > 0 && (
                  <div className="space-y-1">
                    <div className="text-[10px] font-bold" style={{ color: '#fca5a5' }}>🔴 Errors</div>
                    {errs.map(Row)}
                  </div>
                )}
                {warns.length > 0 && (
                  <div className="space-y-1">
                    <div className="text-[10px] font-bold" style={{ color: '#fcd34d' }}>🟡 Warnings</div>
                    {warns.map(Row)}
                  </div>
                )}
                {tips.length > 0 && (
                  <div className="space-y-1">
                    <div className="text-[10px] font-bold" style={{ color: 'var(--sc-dim)' }}>💡 Tips</div>
                    {tips.map(Row)}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* Bottom panels */}
      <div className="flex gap-3 flex-wrap">
        {/* Component palette */}
        <div className="flex-1 min-w-[250px] space-y-3">
          <div className="rounded-2xl border p-3" style={{ background: 'var(--sc-surface)', borderColor: 'var(--sc-border)' }}>
            <h3 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--sc-dim)' }}>Components</h3>
            <input
              value={paletteQuery}
              onChange={(e) => setPaletteQuery(e.target.value)}
              placeholder="Search..."
              className="w-full mb-2 px-2 py-1 rounded-lg border text-[10px] outline-none"
              style={{ background: 'var(--sc-surface2)', borderColor: 'var(--sc-border)', color: 'var(--sc-text)' }}
            />
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
              <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--sc-dim)' }}>BOM ({components.length})</h3>
              {components.length > 0 && <button onClick={() => { dispatch({ type: 'SET', present: { components: [], wires: [] } }); setSelected(null); }} className="text-[9px] cursor-pointer" style={{ color: 'var(--sc-accent)' }}>Clear</button>}
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] font-mono" style={{ color: 'var(--sc-dim)' }}>
                {components.length} parts · {wires.length} wires
              </span>
              <button
                onClick={() => {
                  const rows = components.map((c) => {
                    const d = COMP_DEFS[c.type];
                    const pos = c.anchor?.kind === 'main' ? `${String.fromCharCode(97 + c.anchor.row)}${c.anchor.col + 1}` : holeKey(c.anchor);
                    return [d?.name || c.type, c.value || '', pos].join(',');
                  });
                  const csv = ['name,value,position', ...rows].join('\n');
                  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'sparkcalc_bom.csv';
                  a.click();
                  setTimeout(() => URL.revokeObjectURL(url), 1000);
                }}
                className="text-[9px] cursor-pointer"
                style={{ color: 'var(--sc-accent)' }}
              >
                Export CSV
              </button>
            </div>
            <div className="space-y-1 max-h-[120px] overflow-auto">
              {components.map((c, i) => {
                const d = COMP_DEFS[c.type];
                return (
                  <div key={c.id} onClick={() => setSelected({ kind: 'component', id: c.id })} className="flex items-center gap-1 p-1 rounded border text-[9px] cursor-pointer" style={{ background: selected?.kind === 'component' && selected.id === c.id ? 'color-mix(in srgb, var(--sc-accent) 8%, var(--sc-surface2))' : 'var(--sc-surface2)', borderColor: 'var(--sc-border)' }}>
                    <div className="w-2 h-2 rounded-sm" style={{ background: d?.color }} />
                    <span className="flex-1 truncate font-semibold" style={{ color: 'var(--sc-text)' }}>{d?.name}</span>
                    <input type="text" value={c.value} onChange={e => dispatch({ type: 'COMMIT', present: { components: components.map((x) => x.id === c.id ? { ...x, value: e.target.value } : x), wires } })}
                      className="w-14 bg-transparent border-none outline-none text-right font-mono text-[8px]" style={{ color: 'var(--sc-accent)' }} />
                    <button onClick={(ev) => { ev.stopPropagation(); dispatch({ type: 'COMMIT', present: { components: components.filter((x) => x.id !== c.id), wires } }); if (selected?.id === c.id) setSelected(null); }} className="opacity-40 hover:opacity-100 cursor-pointer">✕</button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Properties */}
          {selected && (
            <div className="rounded-2xl border p-3 space-y-2" style={{ background: 'var(--sc-surface)', borderColor: 'var(--sc-border)' }}>
              <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--sc-dim)' }}>Properties</h3>
              {selected.kind === 'wire' && (() => {
                const w = wires.find((x) => x.id === selected.id);
                if (!w) return null;
                return (
                  <div className="flex items-center justify-between gap-2 text-[10px]">
                    <span style={{ color: 'var(--sc-dim)' }}>Wire color</span>
                    <input type="color" value={w.color || '#3b82f6'} onChange={(e) => dispatch({ type: 'COMMIT', present: { components, wires: wires.map((x) => x.id === w.id ? { ...x, color: e.target.value } : x) } })} />
                  </div>
                );
              })()}
              {selected.kind === 'component' && (() => {
                const c = components.find((x) => x.id === selected.id);
                if (!c) return null;
                const d = COMP_DEFS[c.type];
                return (
                  <div className="space-y-2 text-[10px]">
                    <div className="text-[11px] font-semibold" style={{ color: 'var(--sc-text)' }}>
                      {d?.name || c.type}
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span style={{ color: 'var(--sc-dim)' }}>Position</span>
                      <span className="font-mono" style={{ color: 'var(--sc-text)' }}>
                        {c.anchor?.kind === 'main' ? `${String.fromCharCode(97 + c.anchor.row)}${c.anchor.col + 1}` : holeKey(c.anchor)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span style={{ color: 'var(--sc-dim)' }}>Value</span>
                      <input
                        className="px-2 py-1 rounded border bg-transparent font-mono text-[10px]"
                        style={{ borderColor: 'var(--sc-border)', color: 'var(--sc-accent)' }}
                        value={c.value}
                        onChange={(e) => dispatch({ type: 'COMMIT', present: { components: components.map((x) => x.id === c.id ? { ...x, value: e.target.value } : x), wires } })}
                      />
                    </div>
                    {c.type.startsWith('led-') && (
                      <div className="flex items-center justify-between gap-2">
                        <span style={{ color: 'var(--sc-dim)' }}>LED color</span>
                        <select
                          className="px-2 py-1 rounded border bg-transparent text-[10px]"
                          style={{ borderColor: 'var(--sc-border)', color: 'var(--sc-text)', background: 'var(--sc-surface2)' }}
                          value={c.type}
                          onChange={(e) => dispatch({ type: 'COMMIT', present: { components: components.map((x) => x.id === c.id ? { ...x, type: e.target.value } : x), wires } })}
                        >
                          {['led-red','led-green','led-blue','led-yellow','led-white'].map((t) => (
                            <option key={t} value={t}>{COMP_DEFS[t]?.name || t}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    {(COMP_DEFS[c.type]?.isSource) && (
                      <div className="flex items-center justify-between gap-2">
                        <span style={{ color: 'var(--sc-dim)' }}>Voltage</span>
                        <input
                          className="px-2 py-1 rounded border bg-transparent font-mono text-[10px]"
                          style={{ borderColor: 'var(--sc-border)', color: 'var(--sc-accent)' }}
                          value={c.value}
                          onChange={(e) => dispatch({ type: 'COMMIT', present: { components: components.map((x) => x.id === c.id ? { ...x, value: e.target.value } : x), wires } })}
                        />
                      </div>
                    )}
                    <div className="flex items-center justify-between gap-2">
                      <span style={{ color: 'var(--sc-dim)' }}>Rotation</span>
                      <span className="font-mono" style={{ color: 'var(--sc-text)' }}>{c.rot || 0}°</span>
                    </div>
                    {(c.type === 'switch' || c.type === 'button') && (
                      <label className="flex items-center justify-between gap-2">
                        <span style={{ color: 'var(--sc-dim)' }}>Closed</span>
                        <input type="checkbox" checked={!!(c.props?.closed ?? COMP_DEFS[c.type]?.isClosed)} onChange={(e) => dispatch({ type: 'COMMIT', present: { components: components.map((x) => x.id === c.id ? { ...x, props: { ...(x.props || {}), closed: e.target.checked } } : x), wires } })} />
                      </label>
                    )}
                    <button
                      onClick={() => {
                        const def = COMP_DEFS[c.type];
                        if (!def) return;
                        const nextRot = ((c.rot || 0) + 90) % 360;
                        if (fitsOnBoard(c.anchor, nextRot, def)) {
                          dispatch({ type: 'COMMIT', present: { components: components.map((x) => x.id === c.id ? { ...x, rot: nextRot } : x), wires } });
                        }
                      }}
                      className="w-full px-2 py-1 rounded border text-[10px] font-semibold"
                      style={{ borderColor: 'var(--sc-border)', background: 'var(--sc-surface2)', color: 'var(--sc-text)' }}
                    >
                      Rotate (R)
                    </button>
                    <button
                      onClick={() => {
                        const base = c.anchor?.kind === 'main' ? c.anchor : null;
                        const def = COMP_DEFS[c.type];
                        let anchor = base;
                        if (base && def) {
                          const tryA = mainHole(base.col + 1, base.row);
                          anchor = fitsOnBoard(tryA, c.rot || 0, def) ? tryA : base;
                        }
                        const dup = { ...c, id: cryptoId(), anchor };
                        dispatch({ type: 'COMMIT', present: { components: [...components, dup], wires } });
                        setSelected({ kind: 'component', id: dup.id });
                      }}
                      className="w-full px-2 py-1 rounded border text-[10px] font-semibold"
                      style={{ borderColor: 'var(--sc-border)', background: 'var(--sc-surface2)', color: 'var(--sc-text)' }}
                    >
                      Duplicate
                    </button>
                    <button
                      onClick={() => {
                        dispatch({ type: 'COMMIT', present: { components: components.filter((x) => x.id !== c.id), wires } });
                        setSelected(null);
                      }}
                      className="w-full px-2 py-1 rounded border text-[10px] font-semibold"
                      style={{ borderColor: 'rgba(239,68,68,0.35)', background: 'rgba(239,68,68,0.08)', color: '#fca5a5' }}
                    >
                      Delete
                    </button>
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        {/* AI Panel */}
        <div className="flex-1 min-w-[300px]">
          <AIPanel context={ctx} toolId="prototyper" />
        </div>
      </div>
    </div>
  );
}
