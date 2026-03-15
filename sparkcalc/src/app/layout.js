import './globals.css';

export const metadata = {
  title: { default: 'SparkCalc — Free AI-Powered Electronics Calculators', template: '%s | SparkCalc' },
  description: 'Free online electronics calculators with AI-powered design assistance. Voltage divider, LED resistor, RC filter, Ohm\'s law, 555 timer, LC resonance and more.',
  keywords: ['electronics calculator', 'voltage divider calculator', 'LED resistor calculator', 'ohms law calculator', 'circuit design tool', '555 timer calculator', 'LC resonance calculator', 'PCB trace width calculator'],
  authors: [{ name: 'SparkCalc' }],
  openGraph: { title: 'SparkCalc — Free AI-Powered Electronics Calculators', description: 'Free online electronics calculators with AI-powered design assistance.', url: 'https://sparkcalc.app', siteName: 'SparkCalc', type: 'website' },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
      </head>
      <body className="bg-sc-bg text-sc-text font-display min-h-screen antialiased">{children}</body>
    </html>
  );
}
