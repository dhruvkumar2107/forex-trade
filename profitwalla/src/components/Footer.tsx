import Link from 'next/link';
import { Twitter, Linkedin, Send, Mail } from 'lucide-react';

const footerColumns = [
  {
    title: 'Platform',
    links: [
      { label: 'Features', href: '/features' },
      { label: 'How It Works', href: '/how-it-works' },
      { label: 'Supported Brokers', href: '/brokers' },
      { label: 'Risk Management', href: '/security' },
      { label: 'Account Monitoring', href: '/#platform' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Contact', href: '/contact' },
      { label: 'Support', href: 'mailto:support@profitwalla.com' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Risk Disclosure', href: '/risk-disclosure' },
      { label: 'Privacy Policy', href: '/risk-disclosure' },
      { label: 'Terms of Service', href: '/risk-disclosure' },
    ],
  },
  {
    title: 'Account',
    links: [
      { label: 'Book Your Slot', href: '/book-now' },
      { label: 'Client Login', href: '/login' },
      { label: 'Staff Login', href: '/admin/login' },
    ],
  },
];

const bottomLinks = [
  { label: 'Privacy Policy', href: '/risk-disclosure' },
  { label: 'Terms', href: '/risk-disclosure' },
  { label: 'Risk Disclosure', href: '/risk-disclosure' },
];

export default function Footer() {
  return (
    <footer className="bg-surface-100 border-t border-white/5">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand Column */}
          <div className="lg:col-span-1">
            <Link href="/" className="inline-block">
              <span className="text-xl font-bold tracking-tight text-white">
                Profit<span className="text-primary-400">walla</span>
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-surface-400">
              Professional copy-trading infrastructure. Built for precision.
            </p>
            <div className="mt-6 flex items-center gap-4">
              <a
                href="https://twitter.com/profitwalla"
                target="_blank"
                rel="noopener noreferrer"
                className="text-surface-400 transition-colors hover:text-white"
                aria-label="Follow us on X (Twitter)"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                href="https://linkedin.com/company/profitwalla"
                target="_blank"
                rel="noopener noreferrer"
                className="text-surface-400 transition-colors hover:text-white"
                aria-label="Follow us on LinkedIn"
              >
                <Linkedin className="h-5 w-5" />
              </a>
              <a
                href="https://t.me/profitwalla"
                target="_blank"
                rel="noopener noreferrer"
                className="text-surface-400 transition-colors hover:text-white"
                aria-label="Join our Telegram"
              >
                <Send className="h-5 w-5" />
              </a>
              <a
                href="mailto:support@profitwalla.com"
                className="text-surface-400 transition-colors hover:text-white"
                aria-label="Email us"
              >
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Link Columns */}
          {footerColumns.map((column) => (
            <div key={column.title}>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
                {column.title}
              </h3>
              <ul className="mt-4 space-y-3">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-surface-400 transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 border-t border-white/5 pt-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-xs text-surface-400">
              &copy; {new Date().getFullYear()} Profitwalla. All rights reserved.
            </p>
            <p className="max-w-lg text-center text-xs leading-relaxed text-surface-500 sm:text-left">
              Trading involves risk. Past performance does not guarantee future
              results.
            </p>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-surface-400 sm:justify-start">
            {bottomLinks.map((link, index) => (
              <span key={link.href} className="flex items-center gap-4">
                <Link
                  href={link.href}
                  className="transition-colors hover:text-white"
                >
                  {link.label}
                </Link>
                {index < bottomLinks.length - 1 && (
                  <span className="text-surface-600">|</span>
                )}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
