'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import {
  ArrowRight,
  Eye,
  Target,
  Shield,
  HeartHandshake,
  Users,
  Zap,
} from 'lucide-react';

const values = [
  {
    icon: Shield,
    title: 'Transparency',
    description: 'We operate with complete openness. Real performance data, honest disclosures, and clear communication. No hidden fees, no misleading claims.',
  },
  {
    icon: Target,
    title: 'Security',
    description: 'Your capital and data security is our foundation. Broker-held funds, encrypted credentials, and strict access controls protect what matters most.',
  },
  {
    icon: Zap,
    title: 'Reliability',
    description: 'Institutional-grade infrastructure built for uptime. Redundant systems, real-time monitoring, and automatic failover ensure continuous operation.',
  },
  {
    icon: Users,
    title: 'Professionalism',
    description: 'We treat every client with the respect and attention they deserve. Dedicated support, timely responses, and a commitment to excellence.',
  },
];

const team = [
  { role: 'Engineering', description: 'Building the infrastructure' },
  { role: 'Operations', description: 'Managing daily systems' },
  { role: 'Support', description: 'Helping our clients' },
  { role: 'Risk', description: 'Protecting capital' },
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

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="section pt-32 pb-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-50" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent-teal/5 rounded-full blur-3xl" />
        <div className="section-container relative z-10">
          <AnimatedSection className="section-header">
            <p className="section-label">About</p>
            <h1 className="section-title">
              About <span className="text-gradient">Profitwalla</span>
            </h1>
            <p className="section-subtitle">
              Building professional copy-trading infrastructure for traders who demand precision and reliability.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* Mission */}
      <section className="section">
        <div className="section-container">
          <AnimatedSection>
            <div className="card p-10 md:p-14">
              <div className="flex flex-col md:flex-row gap-10">
                <div className="flex-1">
                  <div className="w-14 h-14 rounded-2xl bg-accent-teal/10 border border-accent-teal/20 flex items-center justify-center mb-6">
                    <Target className="w-7 h-7 text-accent-teal" />
                  </div>
                  <h2 className="text-2xl font-heading font-bold text-white mb-4">Our Mission</h2>
                  <p className="text-gray-400 leading-relaxed">
                    To provide professional-grade copy-trading infrastructure that empowers traders with automated trade mirroring, robust risk management, and complete transparency. We believe every trader deserves access to institutional-quality technology.
                  </p>
                </div>
                <div className="flex-1">
                  <div className="w-14 h-14 rounded-2xl bg-accent-blue/10 border border-accent-blue/20 flex items-center justify-center mb-6">
                    <Eye className="w-7 h-7 text-accent-blue" />
                  </div>
                  <h2 className="text-2xl font-heading font-bold text-white mb-4">Our Vision</h2>
                  <p className="text-gray-400 leading-relaxed">
                    To democratize institutional-grade trading technology, making professional copy-trading accessible to every trader. We envision a future where technology levels the playing field between retail and institutional traders.
                  </p>
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Values */}
      <section className="section bg-surface-100/50">
        <div className="section-container">
          <AnimatedSection className="section-header">
            <p className="section-label">Values</p>
            <h2 className="text-2xl md:text-3xl font-heading font-bold text-white">
              What We Stand For
            </h2>
            <p className="section-subtitle">
              The principles that guide every decision we make.
            </p>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="card p-8"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-accent-teal/10 border border-accent-teal/20 flex items-center justify-center flex-shrink-0">
                    <value.icon className="w-6 h-6 text-accent-teal" />
                  </div>
                  <div>
                    <h3 className="text-lg font-heading font-semibold text-white mb-2">
                      {value.title}
                    </h3>
                    <p className="text-sm text-gray-400 leading-relaxed">
                      {value.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="section">
        <div className="section-container">
          <AnimatedSection className="section-header">
            <p className="section-label">Team</p>
            <h2 className="text-2xl md:text-3xl font-heading font-bold text-white">
              Our Team
            </h2>
            <p className="section-subtitle">
              A dedicated team of engineers, operators, and support professionals committed to your success.
            </p>
          </AnimatedSection>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {team.map((member, index) => (
              <motion.div
                key={member.role}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="card p-6 text-center"
              >
                <div className="w-16 h-16 rounded-full bg-surface-300 border border-white/10 flex items-center justify-center mx-auto mb-4">
                  <Users className="w-7 h-7 text-gray-400" />
                </div>
                <h3 className="text-sm font-heading font-semibold text-white mb-1">
                  {member.role}
                </h3>
                <p className="text-xs text-gray-500">{member.description}</p>
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
                  Join Us
                </h2>
                <p className="text-gray-400 mb-8 max-w-xl mx-auto">
                  Experience professional copy-trading infrastructure built by a team that cares about your success.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/book-now" className="btn-primary btn-lg">
                    Book Your Slot
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                  <Link href="/contact" className="btn-secondary btn-lg">
                    Contact Us
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
