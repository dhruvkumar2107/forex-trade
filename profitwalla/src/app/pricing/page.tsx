'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import {
  ArrowRight,
  User,
  Users,
  CheckCircle2,
  Mail,
  TrendingUp,
} from 'lucide-react';

const plans = [
  {
    icon: User,
    title: 'Individual Traders',
    description: 'For personal accounts seeking professional copy-trading infrastructure.',
    features: [
      'Personal MT5 account connection',
      'Custom risk configuration',
      'Full dashboard access',
      'Real-time trade mirroring',
      'Performance reporting',
      'Standard support',
    ],
    badge: 'Popular',
  },
  {
    icon: Users,
    title: 'Professional & Partners',
    description: 'For portfolio managers, prop firms, and institutional partners.',
    features: [
      'Multi-account management',
      'Portfolio-level risk controls',
      'Dedicated account manager',
      'Priority support channel',
      'Custom integration options',
      'White-label possibilities',
    ],
    badge: 'Enterprise',
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

export default function PricingPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="section pt-32 pb-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-50" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent-gold/5 rounded-full blur-3xl" />
        <div className="section-container relative z-10">
          <AnimatedSection className="section-header">
            <p className="section-label">Pricing</p>
            <h1 className="section-title">
              Simple, Transparent <span className="text-gradient">Pricing</span>
            </h1>
            <p className="section-subtitle">
              We operate on a performance-based model. Your success is our success.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* Pricing Model */}
      <section className="section">
        <div className="section-container">
          <AnimatedSection className="section-header mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent-teal/10 border border-accent-teal/20 mb-4">
              <TrendingUp className="w-4 h-4 text-accent-teal" />
              <span className="text-sm font-medium text-accent-teal">Performance-Based Model</span>
            </div>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Pricing is customized based on your specific requirements, account size, and configuration needs. No hidden fees, no surprises.
            </p>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`card p-8 ${index === 1 ? 'border-accent-teal/30 ring-1 ring-accent-teal/10' : ''}`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-accent-teal/10 border border-accent-teal/20 flex items-center justify-center">
                    <plan.icon className="w-6 h-6 text-accent-teal" />
                  </div>
                  <div>
                    <h3 className="text-lg font-heading font-bold text-white">{plan.title}</h3>
                    <span className={`badge-${index === 1 ? 'teal' : 'muted'}`}>{plan.badge}</span>
                  </div>
                </div>
                <p className="text-gray-400 text-sm mb-6">{plan.description}</p>
                <div className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-2 text-sm text-gray-300">
                      <CheckCircle2 className="w-4 h-4 text-accent-teal mt-0.5 flex-shrink-0" />
                      {feature}
                    </div>
                  ))}
                </div>
                <Link
                  href="/contact"
                  className={`btn w-full ${index === 1 ? 'btn-primary' : 'btn-secondary'}`}
                >
                  <Mail className="w-4 h-4" />
                  Contact for Quote
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Note */}
      <section className="section bg-surface-100/50">
        <div className="section-container">
          <AnimatedSection>
            <div className="card p-8 text-center">
              <p className="text-sm text-gray-400 max-w-2xl mx-auto">
                Pricing is customized based on your specific requirements. Contact us for a personalized quote based on your account size, number of accounts, and configuration needs.
              </p>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* CTA */}
      <section className="section">
        <div className="section-container">
          <AnimatedSection>
            <div className="card-glass p-12 md:p-16 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-accent-teal/5 via-transparent to-accent-gold/5" />
              <div className="relative z-10">
                <h2 className="text-2xl md:text-3xl font-heading font-bold text-white mb-4">
                  Get a Custom Quote
                </h2>
                <p className="text-gray-400 mb-8 max-w-xl mx-auto">
                  Tell us about your requirements and we&apos;ll provide a transparent, customized pricing proposal.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/contact" className="btn-primary btn-lg">
                    <Mail className="w-5 h-5" />
                    Contact Sales
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
    </div>
  );
}
