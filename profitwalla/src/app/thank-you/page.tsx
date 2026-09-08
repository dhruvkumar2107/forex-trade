'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Check,
  ArrowRight,
  Shield,
  Clock,
  UserCheck,
  Settings,
  Play,
} from 'lucide-react';

const STEPS = [
  { icon: Clock, label: 'Our team reviews your information', status: 'completed' },
  { icon: UserCheck, label: 'We verify your trading account', status: 'pending' },
  { icon: Settings, label: 'We configure risk parameters', status: 'pending' },
  { icon: Play, label: "You'll be notified when copying starts", status: 'pending' },
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.15 + i * 0.1, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  }),
};

const draw = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: { duration: 0.8, delay: 0.4, ease: 'easeInOut' as const },
  },
};

const scalePop = {
  hidden: { scale: 0.8, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: { type: 'spring' as const, stiffness: 200, damping: 18, delay: 0.2 },
  },
};

export default function ThankYouPage() {
  const [clientId, setClientId] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('clientId');
    if (id) setClientId(id);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16 relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent-green/5 rounded-full blur-[120px]" />
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-accent-teal/5 rounded-full blur-[100px]" />
      </div>

      <div className="w-full max-w-lg relative z-10">
        {/* Checkmark */}
        <motion.div
          className="flex justify-center mb-8"
          variants={scalePop}
          initial="hidden"
          animate="visible"
        >
          <div className="relative">
            {/* Outer ring pulse */}
            <div className="absolute inset-0 rounded-full bg-accent-green/20 animate-ping" style={{ animationDuration: '2s' }} />

            {/* Circle container */}
            <div className="w-24 h-24 rounded-full bg-accent-green/10 border-2 border-accent-green/30 flex items-center justify-center relative">
              <svg
                className="w-12 h-12 text-accent-green"
                viewBox="0 0 52 52"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <motion.path
                  d="M14 27l7.5 7.5L38 18"
                  variants={draw}
                  initial="hidden"
                  animate="visible"
                />
              </svg>
            </div>
          </div>
        </motion.div>

        {/* Header */}
        <motion.div
          className="text-center mb-10"
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0}
        >
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-white mb-3">
            Application Submitted
          </h1>
          <p className="text-gray-400 text-base md:text-lg leading-relaxed max-w-md mx-auto">
            Your onboarding information has been received successfully.
          </p>
        </motion.div>

        {/* What happens next */}
        <motion.div
          className="card p-6 mb-8"
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={1}
        >
          <h2 className="font-heading text-sm font-semibold text-white uppercase tracking-wider mb-5">
            What happens next
          </h2>
          <div className="space-y-0">
            {STEPS.map((step, i) => {
              const StepIcon = step.icon;
              const isFirst = i === 0;
              const isLast = i === STEPS.length - 1;
              return (
                <motion.div
                  key={i}
                  className="flex items-start gap-4 relative"
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  custom={i + 2}
                >
                  {/* Vertical line */}
                  {!isLast && (
                    <div className="absolute left-4 top-8 w-px h-full bg-white/10" />
                  )}

                  {/* Icon */}
                  <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                    isFirst
                      ? 'bg-accent-green text-surface shadow-glow-sm'
                      : 'bg-surface-200 border border-white/10 text-gray-500'
                  }`}>
                    {isFirst ? (
                      <Check className="w-4 h-4" strokeWidth={3} />
                    ) : (
                      <StepIcon className="w-3.5 h-3.5" />
                    )}
                  </div>

                  {/* Text */}
                  <div className="pb-6">
                    <p className={`text-sm font-medium ${isFirst ? 'text-white' : 'text-gray-400'}`}>
                      {step.label}
                    </p>
                    {isFirst && (
                      <span className="badge-green text-xs mt-1 inline-flex">
                        Complete
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Status Tracker */}
        <motion.div
          className="card p-6 mb-8"
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={3}
        >
          <h2 className="font-heading text-sm font-semibold text-white uppercase tracking-wider mb-5">
            Application Status
          </h2>
          <div className="flex items-center justify-between relative">
            {/* Progress line */}
            <div className="absolute top-4 left-0 right-0 h-px bg-white/10" />
            <div className="absolute top-4 left-0 w-1/4 h-px bg-accent-green" />

            {['Submitted', 'Review', 'Verification', 'Live'].map((label, i) => (
              <div key={label} className="relative z-10 flex flex-col items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium border-2 transition-all ${
                  i === 0
                    ? 'bg-accent-green border-accent-green text-surface shadow-glow-sm'
                    : 'bg-surface-100 border-white/10 text-gray-500'
                }`}>
                  {i === 0 ? <Check className="w-3.5 h-3.5" strokeWidth={3} /> : i + 1}
                </div>
                <span className={`text-xs font-medium whitespace-nowrap ${
                  i === 0 ? 'text-accent-green' : 'text-gray-500'
                }`}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Security note */}
        <motion.div
          className="flex items-start gap-3 p-4 rounded-xl bg-accent-gold/5 border border-accent-gold/10 mb-8"
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={4}
        >
          <Shield className="w-5 h-5 text-accent-gold flex-shrink-0 mt-0.5" />
          <p className="text-sm text-gray-400 leading-relaxed">
            <span className="text-accent-gold font-medium">Important:</span>{' '}
            Do not share your trading password with anyone. Profitwalla staff will never ask for your password.
          </p>
        </motion.div>

        {/* CTAs */}
        <motion.div
          className="flex flex-col sm:flex-row gap-3"
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={5}
        >
          {clientId && (
            <Link
              href={`/dashboard?clientId=${clientId}`}
              className="btn-primary flex-1"
            >
              View Status
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
          <Link
            href="/"
            className="btn-secondary flex-1"
          >
            Return to Home
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
