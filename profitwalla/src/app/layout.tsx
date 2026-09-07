import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Profitwalla — Premium Copy Trading',
  description: 'Connect your MT5 account to our professional copy trading system. Automated trade mirroring with institutional-grade risk management.',
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-terminal-bg candlestick-bg">
        {children}
      </body>
    </html>
  );
}
