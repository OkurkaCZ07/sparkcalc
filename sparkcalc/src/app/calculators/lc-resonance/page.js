import Layout from '@/components/Layout';
import LCResonanceCalc from '@/components/calculators/LCResonance';
export const metadata = { title: 'LC Resonance Calculator', description: 'Calculate resonant frequency for LC circuits and tank circuits.' };
export default function Page() { return (<Layout><div className="mb-5"><h1 className="text-2xl font-bold tracking-tight">🔄 LC Resonance <span className="text-sc-accent">Calculator</span></h1><p className="text-sm text-sc-dim mt-1">Calculate resonant frequency for LC circuits, tank circuits and filters.</p></div><LCResonanceCalc /></Layout>); }
