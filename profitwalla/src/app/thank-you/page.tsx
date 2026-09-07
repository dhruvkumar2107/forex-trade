'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const STATUS_INFO: Record<string, { label: string; color: string; description: string }> = {
  submitted: { label: 'Submitted', color: 'text-accent-blue', description: 'Your application has been received and is in our queue.' },
  reviewing: { label: 'Under Review', color: 'text-accent-gold', description: 'Our team is verifying your MT5 account details.' },
  approved: { label: 'Approved', color: 'text-accent-green', description: 'Your account has been approved and will be connected shortly.' },
  connected: { label: 'Connected', color: 'text-accent-teal', description: 'Your account is live and trades are being mirrored.' },
  rejected: { label: 'Not Approved', color: 'text-accent-red', description: 'Your application could not be approved. Please contact support.' },
};

export default function ThankYouPage() {
  const [status, setStatus] = useState('submitted');
  const [clientName, setClientName] = useState('');

  useEffect(() => {
    // In production, get this from URL params or local storage
    const params = new URLSearchParams(window.location.search);
    const clientId = params.get('clientId');
    if (clientId) {
      fetch(`/api/clients/status?clientId=${clientId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setStatus(data.data.status);
            setClientName(data.data.fullName);
          }
        })
        .catch(() => {});
    }
  }, []);

  const info = STATUS_INFO[status] || STATUS_INFO.submitted;

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="glass-card p-10 max-w-md w-full text-center animate-slide-up">
        <div className="relative inline-block mb-6">
          <div className={`w-20 h-20 rounded-full border-2 flex items-center justify-center ${
            status === 'connected' ? 'border-accent-teal bg-accent-teal/10' :
            status === 'approved' ? 'border-accent-green bg-accent-green/10' :
            status === 'rejected' ? 'border-accent-red bg-accent-red/10' :
            'border-accent-gold bg-accent-gold/10'
          }`}>
            <span className="text-4xl">
              {status === 'connected' ? '⚡' : status === 'approved' ? '✓' : status === 'rejected' ? '✕' : '⏳'}
            </span>
          </div>
          {status === 'reviewing' && (
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-accent-gold animate-pulse flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-terminal-bg" />
            </div>
          )}
        </div>

        <h1 className={`font-heading text-2xl font-bold mb-2 ${info.color}`}>
          {info.label}
        </h1>
        {clientName && (
          <p className="text-gray-400 text-sm mb-1">Hi {clientName}</p>
        )}
        <p className="text-gray-400 mb-6">{info.description}</p>

        {/* Progress Tracker */}
        <div className="glass-card p-4 mb-6">
          <div className="space-y-3">
            {['submitted', 'reviewing', 'approved', 'connected'].map((s, i) => {
              const isActive = ['submitted', 'reviewing', 'approved', 'connected'].indexOf(status) >= i;
              return (
                <div key={s} className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                    isActive ? 'bg-accent-teal text-terminal-bg' : 'bg-terminal-border text-gray-500'
                  }`}>
                    {isActive ? '✓' : i + 1}
                  </div>
                  <span className={`text-sm ${isActive ? 'text-white' : 'text-gray-500'}`}>
                    {STATUS_INFO[s]?.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <p className="text-gray-500 text-xs mb-6">
          You&apos;ll receive an SMS notification when your status changes. 
          You can also check back here anytime.
        </p>

        <Link href="/" className="btn-secondary inline-block">
          Back to Home
        </Link>
      </div>
    </div>
  );
}
