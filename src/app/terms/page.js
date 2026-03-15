import Layout from '@/components/Layout';

export const metadata = { title: 'Terms of Service', description: 'SparkCalc terms of service.' };

export default function TermsPage() {
  return (
    <Layout>
      <div className="max-w-2xl mx-auto py-8">
        <h1 className="text-2xl font-bold mb-6" style={{color:'var(--sc-text)'}}>Terms of Service</h1>
        <div className="space-y-4 text-sm leading-relaxed" style={{color:'var(--sc-dim)'}}>
          <p><strong style={{color:'var(--sc-text)'}}>Last updated:</strong> March 2026</p>
          <h2 className="text-lg font-bold mt-6" style={{color:'var(--sc-text)'}}>Use of Service</h2>
          <p>SparkCalc provides free online electronics calculators for educational and reference purposes. Our tools are provided "as is" without warranty of any kind.</p>
          <h2 className="text-lg font-bold mt-6" style={{color:'var(--sc-text)'}}>Accuracy</h2>
          <p>While we strive for accuracy, SparkCalc calculators are intended for reference only. Always verify critical calculations independently. We are not responsible for errors in circuit design resulting from use of our calculators.</p>
          <h2 className="text-lg font-bold mt-6" style={{color:'var(--sc-text)'}}>AI Assistant</h2>
          <p>The AI assistant provides general guidance and suggestions. It may occasionally provide incorrect information. Always verify AI recommendations against datasheets and standard engineering practices.</p>
          <h2 className="text-lg font-bold mt-6" style={{color:'var(--sc-text)'}}>Affiliate Links</h2>
          <p>Some component recommendations may include affiliate links to distributors like Mouser, Digikey, or TME. We may earn a commission on purchases made through these links at no additional cost to you.</p>
          <h2 className="text-lg font-bold mt-6" style={{color:'var(--sc-text)'}}>Changes</h2>
          <p>We may update these terms at any time. Continued use of SparkCalc constitutes acceptance of the current terms.</p>
          <h2 className="text-lg font-bold mt-6" style={{color:'var(--sc-text)'}}>Contact</h2>
          <p>For questions, contact us at info@sparkcalc.app.</p>
        </div>
      </div>
    </Layout>
  );
}
