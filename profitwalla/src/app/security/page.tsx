'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import {
  ArrowRight,
  Building2,
  ShieldCheck,
  Lock,
  Eye,
  Activity,
  Gauge,
  FileSearch,
  Ban,
  Server,
  Key,
  Shield,
  Users,
} from 'lucide-react';

const securityFeatures = [
  {
    icon: Building2,
    title: 'Broker-Held Funds',
    description: 'Your capital remains in your broker account at all times. Profitwalla never takes custody of client funds. We only provide the copy-trading infrastructure.',
  },
  {
    icon: Users,
    title: 'Account Isolation',
    description: 'Each connected account operates independently. Issues with one account do not affect others. Full isolation ensures your account is protected.',
  },
  {
    icon: ShieldCheck,
    title: 'Access Controls',
    description: 'Strict role-based access controls limit who can view and modify account settings. Only authorized personnel can access system components.',
  },
  {
    icon: Key,
    title: 'Secure Credential Handling',
    description: 'MT5 credentials are encrypted using AES-256-GCM, the same standard used by banks and governments. Credentials are never stored in plain text.',
  },
  {
    icon: Activity,
    title: 'Real-Time Monitoring',
    description: 'Continuous monitoring of all system components, connections, and trade activity. Instant detection and response to anomalies.',
  },
  {
    icon: Gauge,
    title: 'Risk Controls',
    description: 'Automated risk management enforces position limits, drawdown caps, and exposure rules. Protection is always active, 24/7.',
  },
  {
    icon: FileSearch,
    title: 'Audit Trail',
    description: 'Complete logging of every trade, configuration change, and system event. Full traceability for compliance and security review.',
  },
  {
    icon: Ban,
    title: 'No Withdrawal Capability',
    description: 'Profitwalla has zero withdrawal capability. We can only place trades — never move or access your funds. Your capital stays with your broker.',
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

export default function SecurityPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="section pt-32 pb-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-50" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent-teal/5 rounded-full blur-3xl" />
        <div className="section-container relative z-10">
          <AnimatedSection className="section-header">
            <p className="section-label">Security</p>
            <h1 className="section-title">
              Security & <span className="text-gradient">Trust</span>
            </h1>
            <p className="section-subtitle">
              Your security is our foundation. Built with institutional-grade protections to safeguard your capital and data.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* Core Principle */}
      <section className="section">
        <div className="section-container">
          <AnimatedSection>
            <div className="card p-10 md:p-14 border-accent-teal/20 bg-accent-teal/[0.02]">
              <div className="flex flex-col md:flex-row items-start gap-8">
                <div className="w-16 h-16 rounded-2xl bg-accent-teal/10 border border-accent-teal/20 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-8 h-8 text-accent-teal" />
                </div>
                <div>
                  <h2 className="text-2xl md:text-3xl font-heading font-bold text-white mb-4">
                    Your Capital Stays With Your Broker
                  </h2>
                  <div className="space-y-4 text-gray-400 leading-relaxed">
                    <p>
                      Profitwalla does not custody client funds. Your capital remains in your broker account at all times. We never have the ability to withdraw, transfer, or access your funds.
                    </p>
                    <p>
                      We only provide copy-trading infrastructure — the technology that mirrors trades from a master account to follower accounts. Your broker handles all fund custody, deposits, and withdrawals.
                    </p>
                    <p>
                      This fundamental architecture means your capital is protected by your broker&apos;s security measures, regulatory oversight, and investor protection schemes — independent of Profitwalla.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Security Features */}
      <section className="section bg-surface-100/50">
        <div className="section-container">
          <AnimatedSection className="section-header">
            <p className="section-label">Protections</p>
            <h2 className="text-2xl md:text-3xl font-heading font-bold text-white">
              Security Features
            </h2>
            <p className="section-subtitle">
              Multiple layers of protection to ensure the safety of your accounts and data.
            </p>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {securityFeatures.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className="card p-6"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-accent-teal/10 border border-accent-teal/20 flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-6 h-6 text-accent-teal" />
                  </div>
                  <div>
                    <h3 className="text-lg font-heading font-semibold text-white mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-gray-400 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
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
                  Questions About Security?
                </h2>
                <p className="text-gray-400 mb-8 max-w-xl mx-auto">
                  Our team is ready to answer any questions about how we protect your accounts and data.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/contact" className="btn-primary btn-lg">
                    Contact Us
                  </Link>
                  <Link href="/risk-disclosure" className="btn-secondary btn-lg">
                    Risk Disclosure
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
