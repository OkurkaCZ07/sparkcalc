'use client';
import Script from 'next/script';
import './globals.css';
import { LanguageProvider } from '@/lib/LanguageContext';
import { ThemeProvider } from '@/lib/ThemeContext';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <title>SparkCalc — Free AI-Powered Electronics Calculators</title>
        <meta name="description" content="Free online electronics calculators with AI-powered design assistance." />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="canonical" href="https://sparkcalc.app" />

        {/* CookieYes GDPR Banner — must load BEFORE analytics */}
        <Script
          id="cookieyes"
          src="https://cdn-cookieyes.com/client_data/b4ac1ccfb3a11a0a2579128f214f6f8c/script.js"
          strategy="beforeInteractive"
        />

        {/* Google Analytics — CookieYes will auto-block until consent */}
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-M6HYVG907E" strategy="afterInteractive" />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-M6HYVG907E');
          `}
        </Script>
      </head>
      <body className="font-display min-h-screen antialiased" style={{ background: 'var(--sc-bg)', color: 'var(--sc-text)' }}>
        <ThemeProvider>
          <LanguageProvider>
            {children}
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
