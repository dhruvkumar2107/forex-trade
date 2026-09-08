import type { Metadata } from 'next';
import { Space_Grotesk, Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://profitwalla.com'),
  title: {
    default: 'Profitwalla — Professional Copy Trading Infrastructure',
    template: '%s | Profitwalla',
  },
  description:
    'Connect your MT5 account to Profitwalla\'s professional copy-trading infrastructure. Automated trade mirroring, risk management, and real-time monitoring. Your capital stays with your broker.',
  keywords: [
    'copy trading',
    'MT5 copy trading',
    'trade copier',
    'automated copy trading',
    'forex copy trading',
    'professional copy trading',
    'MT5 trade copier',
    'copy trading platform',
    'trade copying infrastructure',
    'broker connectivity',
    'risk management',
  ],
  authors: [{ name: 'Profitwalla' }],
  creator: 'Profitwalla',
  publisher: 'Profitwalla',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://profitwalla.com',
    siteName: 'Profitwalla',
    title: 'Profitwalla — Professional Copy Trading Infrastructure',
    description:
      'Professional copy-trading infrastructure built for precision. Connect your MT5 account and start copying trades with automated risk controls.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Profitwalla — Professional Copy Trading Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Profitwalla — Professional Copy Trading Infrastructure',
    description:
      'Professional copy-trading infrastructure built for precision. Automated trade mirroring, risk management, and real-time monitoring.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'SoftwareApplication',
              name: 'Profitwalla',
              applicationCategory: 'FinanceApplication',
              operatingSystem: 'Web',
              description:
                'Professional copy-trading infrastructure for MT5 accounts. Automated trade mirroring, risk management, and real-time monitoring.',
              url: 'https://profitwalla.com',
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'USD',
                description: 'Contact for pricing',
              },
            }),
          }}
        />
      </head>
      <body className="min-h-screen bg-surface text-gray-200 font-body antialiased">
        <Navigation />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
