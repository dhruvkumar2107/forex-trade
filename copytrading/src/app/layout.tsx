import type { Metadata } from 'next';
import './globals.css';
import SessionProvider from '@/components/SessionProvider';

export const metadata: Metadata = {
  title: 'Copy Trading Dashboard',
  description: 'Trade mirroring management and monitoring',
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
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
