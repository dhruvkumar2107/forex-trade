import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Profitwalla — Premium Copy Trading',
  description: 'Connect your MT5 account to our professional copy trading system. Automated trade mirroring with institutional-grade risk management.',
  keywords: ['copy trading', 'MT5', 'forex', 'automated trading', 'profitwalla', 'trade mirroring'],
  openGraph: {
    title: 'Profitwalla — Professional Copy Trading, Simplified',
    description: 'Connect your MT5 account to our institutional copy trading system. Trades replicate in under 200ms.',
    type: 'website',
    locale: 'en_IN',
    siteName: 'Profitwalla',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Profitwalla — Professional Copy Trading, Simplified',
    description: 'Connect your MT5 account to our institutional copy trading system.',
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: ['/favicon.ico', '/favicon.svg'],
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FinancialService',
  name: 'Profitwalla',
  description: 'Professional MT5 copy trading service with automated trade mirroring and institutional-grade risk management.',
  url: 'https://profitwalla.com',
  logo: 'https://profitwalla.com/favicon.svg',
  areaServed: {
    '@type': 'Country',
    name: 'India',
  },
  serviceType: 'Copy Trading',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
    description: 'Performance-based fee — no upfront charges',
  },
  sameAs: [],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen bg-terminal-bg candlestick-bg">
        {children}
      </body>
    </html>
  );
}
