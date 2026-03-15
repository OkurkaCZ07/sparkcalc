import Link from 'next/link';
import Layout from '@/components/Layout';
import { CALCULATORS } from '@/lib/utils';

export default function HomePage() {
  return (
    <Layout>
      <div className="text-center py-10">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3">
          Electronics Calculators,{' '}
          <span className="text-sc-accent">Supercharged with AI</span>
        </h1>
        <p className="text-sc-dim text-sm max-w-lg mx-auto leading-relaxed">
          Free, fast, and accurate calculators for circuit design.
          Ask the AI assistant for component recommendations and practical advice — no registration needed.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
        {CALCULATORS.map((calc, i) => (
          <Link key={calc.id} href={`/calculators/${calc.id}`}
            className="tool-card block bg-sc-surface border border-sc-border rounded-2xl p-5 no-underline group"
            style={{ animationDelay: `${i * 50}ms` }}>
            <div className="flex items-start gap-3">
              <span className="text-3xl">{calc.icon}</span>
              <div>
                <h2 className="text-base font-bold text-sc-text group-hover:text-sc-accent transition-colors">{calc.name}</h2>
                <p className="text-xs text-sc-dim mt-1 leading-relaxed">{calc.desc}</p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-[10px] text-sc-accent font-semibold uppercase tracking-wider">
              <div className="w-1.5 h-1.5 rounded-full bg-sc-green shadow-[0_0_4px_theme(colors.sc.green)]" />
              AI Assistant Available
            </div>
          </Link>
        ))}
      </div>

      <section className="max-w-2xl mx-auto mt-12 text-sm text-sc-dim leading-relaxed space-y-4">
        <h2 className="text-lg font-bold text-sc-text">Why SparkCalc?</h2>
        <p>SparkCalc offers free, browser-based electronics calculators designed for hobbyists, students, and professional engineers. Our AI assistant provides real-world design guidance — telling you which standard resistor values to use, whether your MOSFET needs a heatsink, or how to optimize your 555 timer circuit.</p>
        <p>All calculators work instantly with no registration. The AI assistant is free with a daily limit. We recommend components from trusted distributors like Mouser, Digikey, and TME.</p>
        <h2 className="text-lg font-bold text-sc-text mt-6">Available Calculators</h2>
        <ul className="space-y-1.5">
          {CALCULATORS.map((c) => (
            <li key={c.id}><Link href={`/calculators/${c.id}`} className="text-sc-accent hover:underline">{c.name}</Link>{' — '}{c.desc}</li>
          ))}
        </ul>
      </section>
    </Layout>
  );
}
