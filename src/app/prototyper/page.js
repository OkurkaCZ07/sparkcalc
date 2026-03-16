'use client';
import Layout from '@/components/Layout';
import CircuitPrototyper from '@/components/calculators/CircuitPrototyper';

export default function PrototyperPage() {
  return (
    <Layout>
      <div className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--sc-text)' }}>
          🔧 3D Circuit <span style={{ color: 'var(--sc-accent)' }}>Prototyper</span>
          <span className="ml-2 text-[10px] font-semibold px-2 py-0.5 rounded-full align-middle" style={{ background: 'color-mix(in srgb, var(--sc-accent) 15%, transparent)', color: 'var(--sc-accent)' }}>BETA</span>
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--sc-dim)' }}>
          Place components on a 3D breadboard, connect them with wires, and let AI analyze your circuit design.
        </p>
      </div>
      <CircuitPrototyper />
    </Layout>
  );
}
