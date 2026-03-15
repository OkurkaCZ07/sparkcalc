import Layout from '@/components/Layout';
import BatteryLifeCalc from '@/components/calculators/BatteryLife';
export const metadata = { title: 'Battery Life Calculator', description: 'Estimate battery runtime from capacity and load current.' };
export default function Page() { return (<Layout><div className="mb-5"><h1 className="text-2xl font-bold tracking-tight">🔋 Battery Life <span className="text-sc-accent">Calculator</span></h1><p className="text-sm text-sc-dim mt-1">Estimate how long your battery will last with common battery presets.</p></div><BatteryLifeCalc /></Layout>); }
