'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, X, ChevronDown, ArrowRight } from 'lucide-react';

const products = [
  { label: 'Copy Trading', href: '/#features' },
  { label: 'Trade Copier', href: '/#how-it-works' },
  { label: 'Risk Management', href: '/#risk' },
  { label: 'Account Monitoring', href: '/#platform' },
  { label: 'Broker Connectivity', href: '/#brokers' },
];

const platform = [
  { label: 'How It Works', href: '/how-it-works' },
  { label: 'Supported Brokers', href: '/#brokers' },
  { label: 'Features', href: '/features' },
  { label: 'Security', href: '/security' },
  { label: 'FAQ', href: '/#faq' },
];

const resources = [
  { label: 'Risk Disclosure', href: '/risk-disclosure' },
  { label: 'Support', href: 'mailto:support@profitwalla.com' },
];

const company = [
  { label: 'About', href: '/#trust' },
  { label: 'Contact', href: 'mailto:contact@profitwalla.com' },
];

type NavItem = { label: string; href: string };

const navSections: { label: string; items: NavItem[] }[] = [
  { label: 'Products', items: products },
  { label: 'Platform', items: platform },
  { label: 'Resources', items: resources },
  { label: 'Company', items: company },
];

export default function Navigation() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [openAccordions, setOpenAccordions] = useState<string[]>([]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const handleDropdownEnter = useCallback((label: string) => {
    setActiveDropdown(label);
  }, []);

  const handleDropdownLeave = useCallback(() => {
    setActiveDropdown(null);
  }, []);

  const toggleAccordion = useCallback((label: string) => {
    setOpenAccordions((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  }, []);

  const isActive = (href: string) => {
    if (href.startsWith('/#') || href.startsWith('mailto:')) return false;
    return pathname === href;
  };

  return (
    <>
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-surface/80 backdrop-blur-xl shadow-lg shadow-black/10 border-b border-white/5'
            : 'bg-transparent'
        }`}
      >
        <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="Main navigation">
          <div className="flex h-16 items-center justify-between lg:h-18">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group" aria-label="Profitwalla home">
              <span className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500/15 transition-colors group-hover:bg-teal-500/25">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-4.5 w-4.5 text-teal-400"
                  aria-hidden="true"
                >
                  <path
                    d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <span className="text-lg font-semibold text-white tracking-tight">
                Profit<span className="text-teal-400">walla</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex lg:items-center lg:gap-1">
              {navSections.map((section) => (
                <div
                  key={section.label}
                  className="relative"
                  onMouseEnter={() => handleDropdownEnter(section.label)}
                  onMouseLeave={handleDropdownLeave}
                >
                  <button
                    className={`flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      activeDropdown === section.label
                        ? 'text-white'
                        : 'text-white/60 hover:text-white'
                    }`}
                    aria-expanded={activeDropdown === section.label}
                    aria-haspopup="true"
                  >
                    {section.label}
                    <ChevronDown
                      className={`h-3.5 w-3.5 transition-transform duration-200 ${
                        activeDropdown === section.label ? 'rotate-180' : ''
                      }`}
                      aria-hidden="true"
                    />
                  </button>

                  <AnimatePresence>
                    {activeDropdown === section.label && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.96 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        className="absolute left-1/2 -translate-x-1/2 top-full pt-2"
                      >
                        <div className="min-w-[220px] rounded-xl border border-white/10 bg-surface/95 backdrop-blur-xl p-2 shadow-2xl shadow-black/40">
                          {section.items.map((item) => (
                            <Link
                              key={item.label}
                              href={item.href}
                              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors group ${
                                isActive(item.href)
                                  ? 'bg-teal-500/10 text-teal-400'
                                  : 'text-white/70 hover:bg-white/5 hover:text-white'
                              }`}
                            >
                              <span className="flex-1">{item.label}</span>
                              <ArrowRight
                                className="h-3.5 w-3.5 opacity-0 -translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-x-0"
                                aria-hidden="true"
                              />
                            </Link>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>

            {/* Desktop CTAs */}
            <div className="hidden lg:flex lg:items-center lg:gap-3">
              <Link
                href="/book-now"
                className="inline-flex items-center gap-2 rounded-lg bg-teal-500 px-4 py-2.5 text-sm font-medium text-black transition-all hover:bg-teal-400 hover:shadow-lg hover:shadow-teal-500/25 active:scale-[0.98]"
              >
                Book Your Slot
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2.5 text-sm font-medium text-white/80 transition-all hover:border-white/20 hover:text-white hover:bg-white/5 active:scale-[0.98]"
              >
                Client Login
              </Link>
            </div>

            {/* Mobile Hamburger */}
            <button
              className="relative flex h-10 w-10 items-center justify-center rounded-lg text-white/70 transition-colors hover:text-white lg:hidden"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col bg-surface border-l border-white/5 lg:hidden"
          >
            <div className="flex h-16 items-center justify-between px-4 border-b border-white/5">
              <Link
                href="/"
                className="flex items-center gap-2.5"
                onClick={() => setMobileOpen(false)}
                aria-label="Profitwalla home"
              >
                <span className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500/15">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="h-4.5 w-4.5 text-teal-400"
                    aria-hidden="true"
                  >
                    <path
                      d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <span className="text-lg font-semibold text-white tracking-tight">
                  Profit<span className="text-teal-400">walla</span>
                </span>
              </Link>
              <button
                className="flex h-10 w-10 items-center justify-center rounded-lg text-white/70 transition-colors hover:text-white"
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4">
              <div className="space-y-1">
                {navSections.map((section) => {
                  const isOpen = openAccordions.includes(section.label);
                  return (
                    <div key={section.label} className="rounded-xl">
                      <button
                        className={`flex w-full items-center justify-between rounded-lg px-3 py-3 text-sm font-medium transition-colors ${
                          isOpen ? 'text-white bg-white/5' : 'text-white/70 hover:text-white hover:bg-white/5'
                        }`}
                        onClick={() => toggleAccordion(section.label)}
                        aria-expanded={isOpen}
                      >
                        {section.label}
                        <ChevronDown
                          className={`h-4 w-4 transition-transform duration-200 ${
                            isOpen ? 'rotate-180' : ''
                          }`}
                          aria-hidden="true"
                        />
                      </button>
                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2, ease: 'easeInOut' }}
                            className="overflow-hidden"
                          >
                            <div className="pl-4 pb-1 pt-1">
                              {section.items.map((item) => (
                                <Link
                                  key={item.label}
                                  href={item.href}
                                  onClick={() => setMobileOpen(false)}
                                  className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                                    isActive(item.href)
                                      ? 'text-teal-400 bg-teal-500/10'
                                      : 'text-white/60 hover:text-white hover:bg-white/5'
                                  }`}
                                >
                                  {item.label}
                                </Link>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-white/5 p-4 space-y-3">
              <Link
                href="/book-now"
                onClick={() => setMobileOpen(false)}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-teal-500 px-4 py-3 text-sm font-medium text-black transition-all hover:bg-teal-400 active:scale-[0.98]"
              >
                Book Your Slot
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 px-4 py-3 text-sm font-medium text-white/80 transition-all hover:border-white/20 hover:text-white hover:bg-white/5 active:scale-[0.98]"
              >
                Client Login
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
