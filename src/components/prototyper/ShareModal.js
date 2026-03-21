'use client';

import { useEffect, useMemo, useState } from 'react';

export default function ShareModal({ onClose, url }) {
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [qrError, setQrError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Optional dependency: qrcode
        const mod = await import('qrcode');
        const QR = mod.default || mod;
        const dataUrl = await QR.toDataURL(url, { margin: 1, width: 220 });
        if (!cancelled) setQrDataUrl(dataUrl);
      } catch (e) {
        if (!cancelled) setQrError('QR generator unavailable (install dependency "qrcode").');
      }
    })();
    return () => { cancelled = true; };
  }, [url]);

  const shortUrl = useMemo(() => {
    try {
      const u = new URL(url);
      return `${u.origin}${u.pathname}?…`;
    } catch {
      return url;
    }
  }, [url]);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}>
      <div
        className="w-[720px] max-w-[95vw] rounded-2xl border p-4"
        style={{ background: 'color-mix(in srgb, var(--sc-surface) 85%, transparent)', borderColor: 'var(--sc-border)', backdropFilter: 'blur(10px)' }}
      >
        <div className="flex items-center justify-between">
          <div className="text-sm font-bold" style={{ color: 'var(--sc-text)' }}>Share your circuit</div>
          <button className="text-xs px-2 py-1 rounded border" style={{ borderColor: 'var(--sc-border)', color: 'var(--sc-dim)' }} onClick={onClose}>
            Close
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-[1fr_240px] gap-4">
          <div className="space-y-2">
            <div className="text-[11px] font-bold" style={{ color: 'var(--sc-dim)' }}>Link</div>
            <div className="flex gap-2">
              <input
                value={url}
                readOnly
                className="flex-1 px-2 py-2 rounded-lg border bg-transparent text-[11px] font-mono outline-none"
                style={{ borderColor: 'var(--sc-border)', color: 'var(--sc-text)' }}
              />
              <button
                className="px-3 py-2 rounded-lg border text-xs font-bold"
                style={{ borderColor: 'var(--sc-border)', background: 'var(--sc-surface2)', color: 'var(--sc-text)' }}
                onClick={async () => {
                  try { await navigator.clipboard.writeText(url); } catch {}
                }}
              >
                Copy
              </button>
            </div>
            <div className="text-[10px]" style={{ color: 'var(--sc-dim)' }}>{shortUrl}</div>
          </div>

          <div className="rounded-xl border p-3 flex flex-col items-center justify-center"
            style={{ borderColor: 'var(--sc-border)', background: 'var(--sc-surface2)' }}>
            <div className="text-[11px] font-bold mb-2" style={{ color: 'var(--sc-dim)' }}>QR Code</div>
            {qrDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qrDataUrl} alt="QR" className="rounded-lg border" style={{ borderColor: 'var(--sc-border)' }} />
            ) : (
              <div className="text-[11px] text-center" style={{ color: 'var(--sc-dim)' }}>
                {qrError ? qrError : 'Generating…'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

