import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Copy Trading Dashboard',
  description: 'Trade mirroring management and monitoring',
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
