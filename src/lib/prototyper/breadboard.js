export const BB = {
  COLS: 30,
  TOP_ROWS: 5, // rows 0-4 (a-e)
  BOT_ROWS: 5, // rows 5-9 (f-j)
  TOTAL_ROWS: 10,
  RAILS: ['top+', 'top-', 'bot+', 'bot-'],
};

/**
 * Hole reference:
 * - Main: { kind:'main', col:number, row:number } row 0..9
 * - Rail: { kind:'rail', rail:'top+'|'top-'|'bot+'|'bot-', col:number }
 */
export function isHoleRef(x) {
  return x && (x.kind === 'main' || x.kind === 'rail');
}

export function mainHole(col, row) {
  return { kind: 'main', col, row };
}

export function railHole(rail, col) {
  return { kind: 'rail', rail, col };
}

export function holeKey(h) {
  if (!h) return '';
  if (h.kind === 'rail') return `rail:${h.rail}:${h.col}`;
  return `main:${h.col}:${h.row}`;
}

export function parseHoleKey(k) {
  if (typeof k !== 'string') return null;
  const parts = k.split(':');
  if (parts[0] === 'main' && parts.length === 3) return mainHole(Number(parts[1]), Number(parts[2]));
  if (parts[0] === 'rail' && parts.length === 3) return railHole(parts[1], Number(parts[2]));
  // Backward compatibility for older saved links.
  if (parts[0] === 'm' && parts.length === 3) return mainHole(Number(parts[1]), Number(parts[2]));
  if (parts[0] === 'r' && parts.length === 3) return railHole(parts[1], Number(parts[2]));
  return null;
}

export function inBounds(h) {
  if (!h || h.kind !== 'main') return false;
  return h.col >= 0 && h.col < BB.COLS && h.row >= 0 && h.row < BB.TOTAL_ROWS;
}

export function nodeIdOfHole(h) {
  if (!h) return '';
  if (h.kind === 'rail') return `R:${h.rail}`;
  const half = h.row < BB.TOP_ROWS ? 'top' : 'bot';
  return `H:${h.col}:${half}`;
}

