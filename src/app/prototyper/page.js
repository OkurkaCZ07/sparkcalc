'use client';
import PrototyperApp from '@/components/prototyper/PrototyperApp';

export default function PrototyperPage() {
  return (
    <div className="w-screen h-screen overflow-hidden" style={{ background: 'var(--sc-bg)', color: 'var(--sc-text)' }}>
      <PrototyperApp />
    </div>
  );
}
