import Layout from '@/components/Layout';
import MOSFETPowerCalc from '@/components/calculators/MOSFETPower';
export const metadata = { title: 'MOSFET Power Dissipation Calculator', description: 'Calculate MOSFET power dissipation and junction temperature.' };
export default function Page() { return (<Layout><div className="mb-5"><h1 className="text-2xl font-bold tracking-tight">🔥 MOSFET Power <span className="text-sc-accent">Calculator</span></h1><p className="text-sm text-sc-dim mt-1">Calculate conduction losses, junction temperature, and heatsink requirements.</p></div><MOSFETPowerCalc /></Layout>); }
