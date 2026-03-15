import Layout from '@/components/Layout';
import OhmsLawCalc from '@/components/calculators/OhmsLaw';
export const metadata = { title: "Ohm's Law Calculator", description: "Calculate voltage, current, resistance and power." };
export default function Page() { return (<Layout><div className="mb-5"><h1 className="text-2xl font-bold tracking-tight">Ω Ohm&#39;s Law <span className="text-sc-accent">Calculator</span></h1><p className="text-sm text-sc-dim mt-1">Calculate any electrical quantity from the other two.</p></div><OhmsLawCalc /></Layout>); }
