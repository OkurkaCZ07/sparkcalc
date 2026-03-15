import Layout from '@/components/Layout';
import ResistorCodeCalc from '@/components/calculators/ResistorCode';
export const metadata = { title: 'Resistor Color Code Calculator', description: 'Decode 4-band resistor color codes visually.' };
export default function Page() { return (<Layout><div className="mb-5"><h1 className="text-2xl font-bold tracking-tight">🎨 Resistor Color Code <span className="text-sc-accent">Decoder</span></h1><p className="text-sm text-sc-dim mt-1">Click on color bands to decode a 4-band resistor.</p></div><ResistorCodeCalc /></Layout>); }
