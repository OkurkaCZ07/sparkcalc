'use client';
import Layout from '@/components/Layout';
import CircuitPrototyper from '@/components/calculators/CircuitPrototyper';
import { useLanguage } from '@/lib/LanguageContext';

export default function PrototyperPage() {
  const { lang } = useLanguage();
  return (
    <Layout>
      <div className="mb-5">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--sc-text)' }}>
          🔧 3D Circuit <span style={{ color: 'var(--sc-accent)' }}>Prototyper</span>
          <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: 'color-mix(in srgb, var(--sc-accent) 15%, transparent)', color: 'var(--sc-accent)' }}>BETA</span>
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--sc-dim)' }}>
          Build circuits on a 3D breadboard. Place components, set values, and let AI analyze your design.
        </p>
      </div>
      <CircuitPrototyper />
    </Layout>
  );
}
