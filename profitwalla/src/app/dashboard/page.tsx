'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { User, CheckCircle2, Clock, XCircle, Wifi, TrendingUp, Shield, AlertTriangle } from 'lucide-react';

interface ClientData {
  id: string;
  fullName: string;
  status: string;
  createdAt: string;
  brokerServer: string;
  mt5AccountNumber: string;
  startingEquity: number;
  city: string;
  state: string;
  pushedToCopyTrading: boolean;
  pushedAt: string | null;
}

const STATUS_CONFIG: Record<string, {
  label: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  description: string;
}> = {
  submitted: {
    label: 'Application Submitted',
    icon: Clock,
    color: 'text-accent-blue',
    bgColor: 'bg-accent-blue/10 border-accent-blue/20',
    description: 'Your application has been received.',
  },
  approved: {
    label: 'Approved',
    icon: CheckCircle2,
    color: 'text-accent-green',
    bgColor: 'bg-accent-green/10 border-accent-green/20',
    description: 'Your account has been approved and will be connected shortly.',
  },
  pushed: {
    label: 'Connecting',
    icon: Clock,
    color: 'text-accent-gold',
    bgColor: 'bg-accent-gold/10 border-accent-gold/20',
    description: 'Your account is being connected to the copy trading system.',
  },
  connected: {
    label: 'Live & Trading',
    icon: Wifi,
    color: 'text-accent-teal',
    bgColor: 'bg-accent-teal/10 border-accent-teal/20',
    description: 'Your account is connected and trades are being mirrored automatically.',
  },
  rejected: {
    label: 'Not Approved',
    icon: XCircle,
    color: 'text-accent-red',
    bgColor: 'bg-accent-red/10 border-accent-red/20',
    description: 'Your application could not be approved at this time.',
  },
};

export default function DashboardPage() {
  const [client, setClient] = useState<ClientData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const clientId = params.get('clientId');
    if (!clientId) {
      setError('No client ID found. Please log in first.');
      setLoading(false);
      return;
    }

    fetch(`/api/clients/dashboard?clientId=${clientId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setClient(data.data);
        } else {
          setError(data.error || 'Application not found');
        }
      })
      .catch(() => setError('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="glass-card p-8 text-center animate-slide-up">
          <div className="w-8 h-8 border-2 border-accent-teal border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400 text-sm">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="glass-card p-8 max-w-md w-full text-center animate-slide-up">
          <XCircle className="w-12 h-12 text-accent-red mx-auto mb-4" />
          <h1 className="font-heading text-xl font-bold mb-2">Not Found</h1>
          <p className="text-gray-400 text-sm mb-6">{error || 'Application not found'}</p>
          <Link href="/login" className="btn-primary inline-block">
            Try Again
          </Link>
        </div>
      </div>
    );
  }

  const statusInfo = STATUS_CONFIG[client.status] || STATUS_CONFIG.submitted;
  const StatusIcon = statusInfo.icon;
  const createdDate = new Date(client.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <div className="min-h-screen pt-24 pb-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-teal to-accent-gold flex items-center justify-center">
              <span className="text-terminal-bg font-bold text-sm">P</span>
            </div>
            <span className="font-heading text-xl font-bold">Profitwalla</span>
          </Link>
          <h1 className="font-heading text-2xl font-bold mb-1">Welcome, {client.fullName}</h1>
          <p className="text-gray-500 text-sm">Application submitted on {createdDate}</p>
        </div>

        {/* Status Card */}
        <div className={`glass-card p-6 mb-6 border ${statusInfo.bgColor}`}>
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${statusInfo.bgColor}`}>
              <StatusIcon className={`w-6 h-6 ${statusInfo.color}`} />
            </div>
            <div>
              <h2 className={`font-heading text-lg font-bold ${statusInfo.color}`}>{statusInfo.label}</h2>
              <p className="text-gray-400 text-sm mt-1">{statusInfo.description}</p>
            </div>
          </div>
        </div>

        {/* Progress Tracker */}
        <div className="glass-card p-6 mb-6">
          <h3 className="font-heading text-sm font-semibold text-gray-400 mb-4">APPLICATION PROGRESS</h3>
          <div className="space-y-4">
            {['submitted', 'approved', 'pushed', 'connected'].map((s, i) => {
              const isActive = ['submitted', 'approved', 'pushed', 'connected'].indexOf(client.status) >= i;
              const isCurrent = client.status === s;
              const config = STATUS_CONFIG[s];
              return (
                <div key={s} className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    isActive ? 'bg-accent-teal text-terminal-bg' : 'bg-terminal-border text-gray-500'
                  } ${isCurrent ? 'ring-2 ring-accent-teal/50' : ''}`}>
                    {isActive ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                  </div>
                  <div className="flex-1">
                    <span className={`text-sm font-medium ${isActive ? 'text-white' : 'text-gray-500'}`}>
                      {config.label}
                    </span>
                  </div>
                  {isCurrent && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusInfo.bgColor} ${statusInfo.color}`}>
                      Current
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Account Details */}
        <div className="glass-card p-6 mb-6">
          <h3 className="font-heading text-sm font-semibold text-gray-400 mb-4">ACCOUNT DETAILS</h3>
          <div className="space-y-3">
            {[
              { label: 'MT5 Account', value: client.mt5AccountNumber, mono: true },
              { label: 'Broker Server', value: client.brokerServer },
              { label: 'Starting Equity', value: `$${client.startingEquity.toLocaleString()}` },
              { label: 'Location', value: `${client.city}, ${client.state}` },
            ].map((item) => (
              <div key={item.label} className="flex justify-between py-2 border-b border-terminal-border">
                <span className="text-gray-500 text-sm">{item.label}</span>
                <span className={`text-sm font-medium ${item.mono ? 'font-mono' : ''}`}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Copy Trading Status */}
        {client.pushedToCopyTrading && (
          <div className="glass-card p-6 mb-6 border-accent-teal/20">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-accent-teal/10 flex items-center justify-center shrink-0">
                <TrendingUp className="w-5 h-5 text-accent-teal" />
              </div>
              <div>
                <h3 className="font-heading text-sm font-semibold text-white mb-1">Copy Trading Active</h3>
                <p className="text-gray-400 text-xs">
                  Your account is connected to our copy trading system. Trades are mirrored automatically.
                  {client.pushedAt && ` Connected on ${new Date(client.pushedAt).toLocaleDateString('en-IN')}.`}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Security Notice */}
        <div className="glass-card p-4 mb-6">
          <div className="flex items-start gap-3">
            <Shield className="w-4 h-4 text-gray-500 mt-0.5 shrink-0" />
            <p className="text-gray-500 text-xs leading-relaxed">
              Your trading password is encrypted with AES-256-GCM and never displayed in plain text. 
              We only use read-only access for copy trading.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/" className="btn-secondary flex-1 text-center">
            Back to Home
          </Link>
          <a
            href="https://wa.me/919999999999?text=Hi%2C%20I%20need%20help%20with%20my%20Profitwalla%20account"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary flex-1 text-center"
          >
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
}
