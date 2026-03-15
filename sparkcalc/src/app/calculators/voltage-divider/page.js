import Layout from '@/components/Layout';
import VoltageDividerCalc from '@/components/calculators/VoltageDivider';
export const metadata = { title: 'Voltage Divider Calculator', description: 'Free online voltage divider calculator with AI assistance.' };
export default function Page() { return (<Layout><div className="mb-5"><h1 className="text-2xl font-bold tracking-tight">⚡ Voltage Divider <span className="text-sc-accent">Calculator</span></h1><p className="text-sm text-sc-dim mt-1">Calculate output voltage from a resistive voltage divider with AI guidance.</p></div><VoltageDividerCalc /></Layout>); }
