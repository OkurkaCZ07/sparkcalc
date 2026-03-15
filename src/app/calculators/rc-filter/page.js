import Layout from '@/components/Layout';
import RCFilterCalc from '@/components/calculators/RCFilter';
export const metadata = { title: 'RC Filter Calculator', description: 'Calculate cutoff frequency for RC low-pass and high-pass filters.' };
export default function Page() { return (<Layout><div className="mb-5"><h1 className="text-2xl font-bold tracking-tight">〰️ RC Filter <span className="text-sc-accent">Calculator</span></h1><p className="text-sm text-sc-dim mt-1">Calculate cutoff frequency for first-order RC filters.</p></div><RCFilterCalc /></Layout>); }
