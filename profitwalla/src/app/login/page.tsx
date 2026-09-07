'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ClientLoginPage() {
  const router = useRouter();
  const [mobile, setMobile] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullMobile = '+91' + mobile.replace(/\D/g, '').slice(0, 10);
    if (fullMobile.length !== 13) {
      setError('Enter a valid 10-digit mobile number');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/clients/status?mobile=${encodeURIComponent(fullMobile)}`);
      const data = await res.json();
      if (data.success) {
        router.push(`/dashboard?clientId=${data.data.id}`);
      } else {
        setError('No application found for this mobile number. Please apply first.');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="glass-card p-8 max-w-md w-full animate-slide-up">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-accent-teal to-accent-gold flex items-center justify-center">
              <span className="text-terminal-bg font-bold">P</span>
            </div>
            <span className="font-heading text-2xl font-bold">Profitwalla</span>
          </Link>
          <h1 className="font-heading text-xl font-bold mb-2">Client Dashboard</h1>
          <p className="text-gray-400 text-sm">Enter your registered mobile number to view your application status.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          {error && (
            <div className="bg-accent-red/10 border border-accent-red/20 rounded-lg p-3 text-accent-red text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Mobile Number</label>
            <div className="flex gap-2">
              <span className="input-field w-16 flex items-center justify-center text-gray-400 shrink-0">+91</span>
              <input
                type="tel"
                className="input-field"
                placeholder="9876543210"
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                maxLength={10}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || mobile.length < 10}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Checking...' : 'View My Status'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/" className="text-gray-500 text-sm hover:text-gray-400 transition-colors">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
