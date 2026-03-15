import Layout from '@/components/Layout';
import PCBTraceCalc from '@/components/calculators/PCBTrace';
export const metadata = { title: 'PCB Trace Width Calculator', description: 'Calculate minimum PCB trace width using IPC-2221 standard.' };
export default function Page() { return (<Layout><div className="mb-5"><h1 className="text-2xl font-bold tracking-tight">📐 PCB Trace Width <span className="text-sc-accent">Calculator</span></h1><p className="text-sm text-sc-dim mt-1">Calculate minimum trace width for your current using IPC-2221 standard.</p></div><PCBTraceCalc /></Layout>); }
