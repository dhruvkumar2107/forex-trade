'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Clock, Wifi, XCircle, ExternalLink } from 'lucide-react';

const STATUS_INFO: Record<string, { label: string; color: string; description: string; icon: React.ElementType }> = {
  submitted: { label: 'Submitted', color: 'text-accent-blue', description: 'Your application has been received.', icon: Clock },
  approved: { label: 'Approved', color: 'text-accent-green', description: 'Your account has been approved and will be connected shortly.', icon: CheckCircle2 },
  connected: { label: 'Connected', color: 'text-accent-teal', description: 'Your account is live and trades are being mirrored.', icon: Wifi },
  rejected: { label: 'Not Approved', color: 'text-accent-red', description: 'Your application could not be approved. Please contact support.', icon: XCircle },
};

export default function ThankYouPage() {
  const [status, setStatus] = useState('submitted');
  const [clientName, setClientName] = useState('');
  const [clientId, setClientId] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('clientId');
    setClientId(id || '');
    if (id) {
      fetch(`/api/clients/status?clientId=${id}`)
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
  const StatusIcon = info.icon;

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
            <StatusIcon className={`w-10 h-10 ${
              status === 'connected' ? 'text-accent-teal' :
              status === 'approved' ? 'text-accent-green' :
              status === 'rejected' ? 'text-accent-red' :
              'text-accent-gold'
            }`} />
          </div>
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
            {['submitted', 'approved', 'connected'].map((s, i) => {
              const isActive = ['submitted', 'approved', 'connected'].indexOf(status) >= i;
              const StepIcon = STATUS_INFO[s]?.icon || Clock;
              return (
                <div key={s} className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                    isActive ? 'bg-accent-teal text-terminal-bg' : 'bg-terminal-border text-gray-500'
                  }`}>
                    {isActive ? <CheckCircle2 className="w-3 h-3" /> : i + 1}
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
          A confirmation has been sent to your registered number. You can check back here anytime.
        </p>

        <div className="flex flex-col gap-3">
          {clientId && (
            <Link href={`/dashboard?clientId=${clientId}`} className="btn-primary inline-flex items-center justify-center gap-2">
              View Dashboard <ExternalLink className="w-4 h-4" />
            </Link>
          )}
          <Link href="/" className="btn-secondary inline-block">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
