const PARAM = 'circuit';
const VERSION = 1;

export function encodeCircuitToUrl(currentHref, circuit) {
  const url = new URL(currentHref);
  const payload = {
    v: VERSION,
    components: circuit.components || [],
    wires: circuit.wires || [],
    camera: circuit.camera || null,
  };
  const encoded = base64UrlEncode(JSON.stringify(payload));
  url.searchParams.set(PARAM, encoded);
  return url.toString();
}

export function decodeCircuitFromUrl(href) {
  try {
    const url = new URL(href);
    const enc = url.searchParams.get(PARAM);
    if (!enc) return null;
    const json = base64UrlDecode(enc);
    if (!json) return null;
    const obj = JSON.parse(json);
    if (!obj || typeof obj !== 'object') return null;
    return {
      version: obj.v || 1,
      components: Array.isArray(obj.components) ? obj.components : [],
      wires: Array.isArray(obj.wires) ? obj.wires : [],
      camera: obj.camera || null,
    };
  } catch {
    return null;
  }
}

export function saveAutoSave(key, circuit) {
  try {
    localStorage.setItem(key, JSON.stringify({ v: VERSION, circuit }));
  } catch {}
}

export function loadAutoSave(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const obj = JSON.parse(raw);
    if (!obj?.circuit) return null;
    return obj.circuit;
  } catch {
    return null;
  }
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

