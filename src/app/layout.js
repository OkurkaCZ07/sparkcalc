'use client';
import './globals.css';
import { LanguageProvider } from '@/lib/LanguageContext';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <title>SparkCalc — Free AI-Powered Electronics Calculators</title>
        <meta name="description" content="Free online electronics calculators with AI-powered design assistance. Voltage divider, LED resistor, RC filter, Ohm's law, 555 timer, LC resonance and more." />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
      </head>
      <body className="bg-sc-bg text-sc-text font-display min-h-screen antialiased">
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
