import Layout from '@/components/Layout';

export const metadata = { title: 'Privacy Policy', description: 'SparkCalc privacy policy.' };

export default function PrivacyPage() {
  return (
    <Layout>
      <div className="max-w-2xl mx-auto py-8">
        <h1 className="text-2xl font-bold mb-6" style={{color:'var(--sc-text)'}}>Privacy Policy</h1>
        <div className="space-y-4 text-sm leading-relaxed" style={{color:'var(--sc-dim)'}}>
          <p><strong style={{color:'var(--sc-text)'}}>Last updated:</strong> March 2026</p>
          <h2 className="text-lg font-bold mt-6" style={{color:'var(--sc-text)'}}>Information We Collect</h2>
          <p>SparkCalc is designed to work without registration. We do not collect personal information, emails, or account data. Our calculators run entirely in your browser.</p>
          <h2 className="text-lg font-bold mt-6" style={{color:'var(--sc-text)'}}>Cookies & Local Storage</h2>
          <p>We use browser localStorage to save your language preference, theme choice, and AI usage counter. This data stays on your device and is never sent to our servers.</p>
          <h2 className="text-lg font-bold mt-6" style={{color:'var(--sc-text)'}}>Analytics</h2>
          <p>We use Google Analytics to understand how visitors use our site (pages visited, time on site, device type). This data is anonymized and helps us improve SparkCalc.</p>
          <h2 className="text-lg font-bold mt-6" style={{color:'var(--sc-text)'}}>Advertising</h2>
          <p>We display ads through Google AdSense. Google may use cookies to serve ads based on your browsing history. You can opt out of personalized advertising at <a href="https://adssettings.google.com" className="underline" style={{color:'var(--sc-accent)'}}>Google Ad Settings</a>.</p>
          <h2 className="text-lg font-bold mt-6" style={{color:'var(--sc-text)'}}>AI Assistant</h2>
          <p>When you use the AI assistant, your calculator values and question are sent to our server to generate a response. We do not store these conversations.</p>
          <h2 className="text-lg font-bold mt-6" style={{color:'var(--sc-text)'}}>Contact</h2>
          <p>For questions about this policy, contact us at privacy@sparkcalc.app.</p>
        </div>
      </div>
    </Layout>
  );
}
