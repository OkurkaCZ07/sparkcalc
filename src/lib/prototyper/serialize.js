import { holeKey, parseHoleKey } from './breadboard';
import { normalizeComponent, normalizeWire, wireToSerializable } from './connectivity';

const VERSION = 1;

function compactComponent(c) {
  const nc = normalizeComponent(c);
  return [
    nc.type,
    holeKey(nc.anchor),
    nc.rot || 0,
    nc.value ?? '',
    nc.props ?? null,
  ];
}

function expandComponent(arr) {
  if (!Array.isArray(arr)) return null;
  const [type, anchorK, rot, value, props] = arr;
  const anchor = parseHoleKey(anchorK);
  if (!type || !anchor) return null;
  return { id: cryptoId(), type, anchor, rot: rot || 0, value: value ?? '', props: props ?? {} };
}

function compactWire(w) {
  const nw = normalizeWire(w);
  if (!nw) return null;
  return [holeKey(nw.a), holeKey(nw.b), nw.color ?? null];
}

function expandWire(arr) {
  if (!Array.isArray(arr)) return null;
  const [aK, bK, color] = arr;
  const a = parseHoleKey(aK);
  const b = parseHoleKey(bK);
  if (!a || !b) return null;
  return { id: cryptoId(), a, b, color: color ?? null };
}

export function encodeState(state) {
  const payload = {
    v: VERSION,
    c: (state.components || []).map(compactComponent),
    w: (state.wires || []).map(compactWire).filter(Boolean),
  };
  const json = JSON.stringify(payload);
  return base64UrlEncode(json);
}

export function decodeState(encoded) {
  try {
    const json = base64UrlDecode(encoded);
    if (!json) return null;
    const obj = JSON.parse(json);
    if (!obj || typeof obj !== 'object') return null;
    if (obj.v !== VERSION) {
      // Future: migrations here
    }
    const components = Array.isArray(obj.c) ? obj.c.map(expandComponent).filter(Boolean) : [];
    const wires = Array.isArray(obj.w) ? obj.w.map(expandWire).filter(Boolean) : [];
    return { components, wires };
  } catch {
    return null;
  }
}

export function stateToQueryParam(state) {
  return encodeState(state);
}

export function queryParamToState(param) {
  return decodeState(param);
}

export function normalizeStateForSave(state) {
  return {
    components: (state.components || []).map((c) => normalizeComponent(c)),
    wires: (state.wires || []).map((w) => wireToSerializable(w)).filter(Boolean),
  };
}

function cryptoId() {
  // Netlify/Next runs in browser; crypto should exist. Fallback for safety.
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `id_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

function base64UrlEncode(str) {
  const b64 = btoa(unescape(encodeURIComponent(str)));
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlDecode(b64url) {
  if (!b64url) return '';
  const padLen = (4 - (b64url.length % 4)) % 4;
  const b64 = (b64url + '='.repeat(padLen)).replace(/-/g, '+').replace(/_/g, '/');
  return decodeURIComponent(escape(atob(b64)));
}

