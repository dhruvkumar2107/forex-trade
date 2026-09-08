'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import type { Metadata } from 'next';
import {
  ClipboardCheck,
  Link2,
  ShieldCheck,
  Play,
  ArrowRight,
  User,
  Cpu,
  Gauge,
  Building2,
  TrendingUp,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';

const steps = [
  {
    icon: ClipboardCheck,
    number: '01',
    title: 'Book Your Slot',
    description: 'Submit your onboarding information through our secure form. Provide your personal details, trading experience, and account preferences to reserve your place in the system.',
    details: [
      'Complete the multi-step onboarding form',
      'Provide personal and trading background',
      'Select your preferred configuration options',
      'Receive confirmation and next steps',
    ],
  },
  {
    icon: Link2,
    number: '02',
    title: 'Connect MT5',
    description: 'Provide your broker and account details. We establish a secure, read-only connection to your MT5 account — no withdrawal capability, ever.',
    details: [
      'Enter your MT5 account number',
      'Provide your broker server details',
      'Submit read-only investor password',
      'Encrypted credential handling with AES-256-GCM',
    ],
  },
  {
    icon: ShieldCheck,
    number: '03',
    title: 'Configure Risk',
    description: 'Set risk parameters tailored to your account. Define position sizing, maximum drawdown limits, and exposure controls to protect your capital.',
    details: [
      'Set maximum risk per trade',
      'Configure daily loss limits',
      'Define position size multipliers',
      'Enable or disable specific symbol groups',
    ],
  },
  {
    icon: Play,
    number: '04',
    title: 'Start Copying',
    description: 'Trades from the master account are automatically mirrored to your broker account in real-time. Monitor performance through your dashboard.',
    details: [
      'Real-time trade mirroring',
      'Sub-second execution latency',
      'Automatic lot size scaling',
      'Live performance monitoring',
    ],
  },
];

const architecture = [
  { icon: User, label: 'Master', sublabel: 'Signal Provider', color: 'text-accent-teal' },
  { icon: Cpu, label: 'Copy Engine', sublabel: 'Trade Router', color: 'text-accent-blue' },
  { icon: Gauge, label: 'Risk Engine', sublabel: 'Protection Layer', color: 'text-accent-gold' },
  { icon: Building2, label: 'Broker', sublabel: 'MT5 Execution', color: 'text-accent-purple' },
  { icon: TrendingUp, label: 'Client', sublabel: 'Your Account', color: 'text-accent-green' },
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

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="section pt-32 pb-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-50" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent-teal/5 rounded-full blur-3xl" />
        <div className="section-container relative z-10">
          <AnimatedSection className="section-header">
            <p className="section-label">Process</p>
            <h1 className="section-title">
              How <span className="text-gradient">Profitwalla</span> Works
            </h1>
            <p className="section-subtitle">
              A streamlined four-step process to connect your MT5 account and start copying trades with institutional-grade precision.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* Steps */}
      <section className="section">
        <div className="section-container">
          <div className="space-y-8">
            {steps.map((step, index) => (
              <AnimatedSection key={step.number}>
                <motion.div
                  initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: '-80px' }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="card p-8 md:p-10"
                >
                  <div className="flex flex-col md:flex-row gap-6 md:gap-10">
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 rounded-2xl bg-accent-teal/10 border border-accent-teal/20 flex items-center justify-center">
                        <step.icon className="w-7 h-7 text-accent-teal" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-xs font-mono text-accent-teal/60">{step.number}</span>
                        <h3 className="text-xl font-heading font-bold text-white">{step.title}</h3>
                      </div>
                      <p className="text-gray-400 leading-relaxed mb-4">{step.description}</p>
                      <ul className="space-y-2">
                        {step.details.map((detail) => (
                          <li key={detail} className="flex items-start gap-2 text-sm text-gray-300">
                            <CheckCircle2 className="w-4 h-4 text-accent-teal mt-0.5 flex-shrink-0" />
                            {detail}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </motion.div>
                {index < steps.length - 1 && (
                  <div className="flex justify-center my-4">
                    <ChevronRight className="w-6 h-6 text-surface-400 rotate-90" />
                  </div>
                )}
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Architecture Diagram */}
      <section className="section bg-surface-100/50">
        <div className="section-container">
          <AnimatedSection className="section-header">
            <p className="section-label">Architecture</p>
            <h2 className="text-2xl md:text-3xl font-heading font-bold text-white">
              Trade Flow Architecture
            </h2>
            <p className="section-subtitle">
              Understand how trades flow from the master account through our engine to your broker.
            </p>
          </AnimatedSection>

          <AnimatedSection>
            <div className="card p-8 md:p-12 overflow-x-auto">
              <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-0 min-w-[600px]">
                {architecture.map((node, index) => (
                  <div key={node.label} className="flex items-center">
                    <div className="flex flex-col items-center text-center">
                      <div className="w-16 h-16 rounded-2xl bg-surface-200 border border-white/10 flex items-center justify-center mb-3">
                        <node.icon className={`w-7 h-7 ${node.color}`} />
                      </div>
                      <span className="text-sm font-heading font-semibold text-white">{node.label}</span>
                      <span className="text-xs text-gray-500">{node.sublabel}</span>
                    </div>
                    {index < architecture.length - 1 && (
                      <div className="hidden md:flex items-center mx-4">
                        <div className="w-8 h-px bg-gradient-to-r from-surface-400 to-surface-300" />
                        <ChevronRight className="w-4 h-4 text-surface-400 -ml-1" />
                      </div>
                    )}
                    {index < architecture.length - 1 && (
                      <div className="md:hidden my-2">
                        <ChevronRight className="w-5 h-5 text-surface-400 rotate-90" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </AnimatedSection>
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
                  Ready to Get Started?
                </h2>
                <p className="text-gray-400 mb-8 max-w-xl mx-auto">
                  Book your slot today and join traders who are already using Profitwalla&apos;s professional copy-trading infrastructure.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/book-now" className="btn-primary btn-lg">
                    Book Your Slot
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                  <Link href="/security" className="btn-secondary btn-lg">
                    Learn About Security
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
