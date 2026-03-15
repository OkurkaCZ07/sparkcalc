import Layout from '@/components/Layout';
import LEDResistorCalc from '@/components/calculators/LEDResistor';
export const metadata = { title: 'LED Resistor Calculator', description: 'Calculate the correct series resistor for driving LEDs.' };
export default function Page() { return (<Layout><div className="mb-5"><h1 className="text-2xl font-bold tracking-tight">💡 LED Resistor <span className="text-sc-accent">Calculator</span></h1><p className="text-sm text-sc-dim mt-1">Find the correct current-limiting resistor for your LED circuit.</p></div><LEDResistorCalc /></Layout>); }
