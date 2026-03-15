import Layout from '@/components/Layout';
import Timer555Calc from '@/components/calculators/Timer555';
export const metadata = { title: '555 Timer Calculator', description: 'Calculate frequency and duty cycle for 555 timer astable mode.' };
export default function Page() { return (<Layout><div className="mb-5"><h1 className="text-2xl font-bold tracking-tight">⏱️ 555 Timer <span className="text-sc-accent">Calculator</span></h1><p className="text-sm text-sc-dim mt-1">Calculate frequency and duty cycle for 555 timer astable oscillator.</p></div><Timer555Calc /></Layout>); }
