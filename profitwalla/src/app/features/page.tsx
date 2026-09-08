'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import {
  Zap,
  Shield,
  Activity,
  Globe,
  Sliders,
  UserCog,
  RefreshCw,
  Wifi,
  BarChart3,
  Ban,
  FileSearch,
  Users,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

const features = [
  {
    icon: Zap,
    title: 'Ultra-Fast Trade Mirroring',
    description: 'Sub-second trade replication from master account to follower accounts. Our infrastructure minimizes latency to ensure execution prices closely match the signal provider.',
  },
  {
    icon: Shield,
    title: 'Automated Risk Controls',
    description: 'Built-in risk engine enforces position limits, drawdown caps, and exposure rules automatically. Protect capital without manual intervention.',
  },
  {
    icon: Activity,
    title: 'Real-Time Monitoring',
    description: 'Live dashboard showing copy status, trade execution, account health, and performance metrics. Full transparency into every operation.',
  },
  {
    icon: Globe,
    title: 'Broker Connectivity',
    description: 'Direct integration with major MT5 brokers. Established connections ensure reliable, stable communication with your trading account.',
  },
  {
    icon: Sliders,
    title: 'Symbol Controls',
    description: 'Enable or disable specific trading instruments per account. Fine-tune which symbols are copied based on your preferences and broker availability.',
  },
  {
    icon: UserCog,
    title: 'Account-Level Configuration',
    description: 'Each connected account has independent risk settings, lot multipliers, and symbol preferences. Tailor the copy behavior to your individual needs.',
  },
  {
    icon: RefreshCw,
    title: 'Trade Synchronization',
    description: 'Automatic synchronization ensures all open positions are tracked and managed correctly. Partial closes, modifications, and stops are handled seamlessly.',
  },
  {
    icon: Wifi,
    title: 'Connection Monitoring',
    description: 'Continuous health checks on all broker connections. Instant alerts if a connection drops or encounters issues, with automatic reconnection logic.',
  },
  {
    icon: BarChart3,
    title: 'Transparent Performance',
    description: 'Detailed performance reports with real P&L tracking. No artificial smoothing or misleading metrics — just honest, accurate results.',
  },
  {
    icon: Ban,
    title: 'Emergency Stop',
    description: 'One-click emergency stop halts all copying instantly. Immediate protection when market conditions require manual intervention.',
  },
  {
    icon: FileSearch,
    title: 'Audit Trail',
    description: 'Complete logging of every trade, modification, and system event. Full accountability and traceability for compliance and review.',
  },
  {
    icon: Users,
    title: 'Multi-Account Management',
    description: 'Manage multiple follower accounts from a single dashboard. Ideal for portfolio managers, prop firms, and traders with diversified accounts.',
  },
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

export default function FeaturesPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="section pt-32 pb-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-50" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent-blue/5 rounded-full blur-3xl" />
        <div className="section-container relative z-10">
          <AnimatedSection className="section-header">
            <p className="section-label">Platform</p>
            <h1 className="section-title">
              Platform <span className="text-gradient">Features</span>
            </h1>
            <p className="section-subtitle">
              Every feature is designed for reliability, transparency, and the protection of your capital.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* Features Grid */}
      <section className="section">
        <div className="section-container">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                className="card card-hover p-6 group"
              >
                <div className="w-12 h-12 rounded-xl bg-accent-teal/10 border border-accent-teal/20 flex items-center justify-center mb-4 group-hover:bg-accent-teal/15 transition-colors">
                  <feature.icon className="w-6 h-6 text-accent-teal" />
                </div>
                <h3 className="text-lg font-heading font-semibold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section">
        <div className="section-container">
          <AnimatedSection>
            <div className="card-glass p-12 md:p-16 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-accent-teal/5 via-transparent to-accent-blue/5" />
              <div className="relative z-10">
                <h2 className="text-2xl md:text-3xl font-heading font-bold text-white mb-4">
                  Experience the Platform
                </h2>
                <p className="text-gray-400 mb-8 max-w-xl mx-auto">
                  See how Profitwalla&apos;s features work together to provide a professional copy-trading experience.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/book-now" className="btn-primary btn-lg">
                    Book Your Slot
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                  <Link href="/how-it-works" className="btn-secondary btn-lg">
                    How It Works
                  </Link>
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </div>
  );
}
