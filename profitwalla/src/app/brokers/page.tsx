'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import {
  ArrowRight,
  Building2,
  Mail,
  Plus,
} from 'lucide-react';

const brokers = [
  { name: 'Exness', badge: 'Supported' },
  { name: 'IC Markets', badge: 'Supported' },
  { name: 'FP Markets', badge: 'Supported' },
  { name: 'Pepperstone', badge: 'Supported' },
  { name: 'XM', badge: 'Supported' },
  { name: 'Tickmill', badge: 'Supported' },
  { name: 'RoboForex', badge: 'Supported' },
  { name: 'FXTM', badge: 'Supported' },
  { name: 'Octa', badge: 'Supported' },
  { name: 'Alpari', badge: 'Supported' },
  { name: 'Admiral Markets', badge: 'Supported' },
  { name: 'Axiory', badge: 'Supported' },
  { name: 'HotForex', badge: 'Supported' },
  { name: 'InstaForex', badge: 'Supported' },
  { name: 'Alpari International', badge: 'Supported' },
];

function AnimatedSection({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function BrokersPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="section pt-32 pb-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-50" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent-teal/5 rounded-full blur-3xl" />
        <div className="section-container relative z-10">
          <AnimatedSection className="section-header">
            <p className="section-label">Brokers</p>
            <h1 className="section-title">
              Supported <span className="text-gradient">Brokers</span>
            </h1>
            <p className="section-subtitle">
              Profitwalla integrates with leading MT5 brokers worldwide. Connect your existing account seamlessly.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* Broker Grid */}
      <section className="section">
        <div className="section-container">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {brokers.map((broker, index) => (
              <motion.div
                key={broker.name}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.4, delay: index * 0.04 }}
                className="card card-hover p-6 flex items-center gap-4"
              >
                <div className="w-12 h-12 rounded-xl bg-surface-300 border border-white/10 flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-6 h-6 text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-heading font-semibold text-white truncate">
                    {broker.name}
                  </h3>
                  <span className="badge-teal text-[10px] mt-1">{broker.badge}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Don't see your broker */}
      <section className="section bg-surface-100/50">
        <div className="section-container">
          <AnimatedSection>
            <div className="card-glass p-10 md:p-14 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-accent-teal/5 via-transparent to-accent-blue/5" />
              <div className="relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-accent-teal/10 border border-accent-teal/20 flex items-center justify-center mx-auto mb-6">
                  <Plus className="w-7 h-7 text-accent-teal" />
                </div>
                <h2 className="text-2xl md:text-3xl font-heading font-bold text-white mb-3">
                  Don&apos;t See Your Broker?
                </h2>
                <p className="text-gray-400 mb-4 max-w-lg mx-auto">
                  We continuously add support for new brokers. Contact us to request your broker and we&apos;ll evaluate adding it to our platform.
                </p>
                <p className="text-sm text-gray-500 mb-8">
                  We prioritize brokers based on demand, reliability, and MT5 API compatibility.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/contact" className="btn-primary btn-lg">
                    <Mail className="w-5 h-5" />
                    Contact Us
                  </Link>
                  <Link href="/book-now" className="btn-secondary btn-lg">
                    Book Your Slot
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Note */}
      <section className="section">
        <div className="section-container">
          <AnimatedSection>
            <div className="card p-8 text-center">
              <p className="text-sm text-gray-400 max-w-2xl mx-auto">
                We continuously add support for new brokers. Contact us to request your broker.
                Broker availability may vary based on region and MT5 server configuration.
              </p>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </div>
  );
}
