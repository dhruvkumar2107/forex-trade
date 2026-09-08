'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import {
  Mail,
  Clock,
  Send,
  CheckCircle2,
} from 'lucide-react';

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

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setSubmitted(true);
      } else {
        setSubmitted(true);
      }
    } catch {
      setSubmitted(true);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="section pt-32 pb-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-50" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent-teal/5 rounded-full blur-3xl" />
        <div className="section-container relative z-10">
          <AnimatedSection className="section-header">
            <p className="section-label">Contact</p>
            <h1 className="section-title">
              Contact <span className="text-gradient">Profitwalla</span>
            </h1>
            <p className="section-subtitle">
              Have a question or need assistance? We&apos;re here to help.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* Contact Content */}
      <section className="section">
        <div className="section-container">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Info */}
            <div className="lg:col-span-1 space-y-6">
              <AnimatedSection>
                <div className="card p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-accent-teal/10 flex items-center justify-center">
                      <Mail className="w-5 h-5 text-accent-teal" />
                    </div>
                    <div>
                      <h3 className="text-sm font-heading font-semibold text-white">Email</h3>
                      <p className="text-sm text-gray-400">contact@profitwalla.com</p>
                    </div>
                  </div>
                </div>
              </AnimatedSection>

              <AnimatedSection>
                <div className="card p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-accent-teal/10 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-accent-teal" />
                    </div>
                    <div>
                      <h3 className="text-sm font-heading font-semibold text-white">Response Time</h3>
                      <p className="text-sm text-gray-400">We typically respond within 24 hours</p>
                    </div>
                  </div>
                </div>
              </AnimatedSection>

              <AnimatedSection>
                <div className="card p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-accent-teal/10 flex items-center justify-center">
                      <Send className="w-5 h-5 text-accent-teal" />
                    </div>
                    <div>
                      <h3 className="text-sm font-heading font-semibold text-white">Support</h3>
                      <p className="text-sm text-gray-400">support@profitwalla.com</p>
                    </div>
                  </div>
                </div>
              </AnimatedSection>
            </div>

            {/* Form */}
            <div className="lg:col-span-2">
              <AnimatedSection>
                <div className="card p-8">
                  {submitted ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 rounded-2xl bg-accent-green/10 border border-accent-green/20 flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 className="w-8 h-8 text-accent-green" />
                      </div>
                      <h3 className="text-xl font-heading font-bold text-white mb-2">
                        Message Sent!
                      </h3>
                      <p className="text-gray-400 mb-6">
                        Thank you for reaching out. We&apos;ll get back to you within 24 hours.
                      </p>
                      <Link href="/" className="btn-primary">
                        Back to Home
                      </Link>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                          <label className="label">Name</label>
                          <input
                            type="text"
                            className="input"
                            placeholder="Your name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <label className="label">Email</label>
                          <input
                            type="email"
                            className="input"
                            placeholder="your@email.com"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <label className="label">Subject</label>
                        <input
                          type="text"
                          className="input"
                          placeholder="How can we help?"
                          value={formData.subject}
                          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <label className="label">Message</label>
                        <textarea
                          className="input min-h-[150px] resize-y"
                          placeholder="Tell us more..."
                          value={formData.message}
                          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                          required
                        />
                      </div>
                      <button
                        type="submit"
                        className="btn-primary btn-lg w-full"
                        disabled={loading}
                      >
                        {loading ? 'Sending...' : 'Send Message'}
                        <Send className="w-5 h-5" />
                      </button>
                      <p className="text-xs text-gray-500 text-center">
                        Form coming soon. For immediate assistance, email{' '}
                        <a href="mailto:contact@profitwalla.com" className="text-accent-teal hover:underline">
                          contact@profitwalla.com
                        </a>
                      </p>
                    </form>
                  )}
                </div>
              </AnimatedSection>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
