'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface FormData {
  fullName: string;
  mobile: string;
  occupation: string;
  mt5AccountNumber: string;
  mt5InvestorPassword: string;
  brokerServer: string;
  startingEquity: number | '';
  city: string;
  state: string;
  consentGiven: boolean;
}

const STEPS = [
  { id: 1, label: 'Personal' },
  { id: 2, label: 'Trading Account' },
  { id: 3, label: 'Review' },
];

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu and Kashmir', 'Ladakh',
  'Puducherry', 'Chandigarh',
];

const BROKER_SERVERS = [
  'Exness-MT5Real', 'Exness-MT5Trial', 'ICMarketsSC-MT5', 'FPMarkets-MT5',
  'Pepperstone-MT5', 'XMGlobal-MT5', 'Tickmill-MT5', 'RoboForex-MT5',
  'HotForex-MT5', 'FXTM-MT5', 'OctaFX-MT5', 'Alpari-MT5',
  'InstaForex-MT5', 'AdmiralMarkets-MT5',
];

export default function BookNowPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    fullName: '', mobile: '', occupation: '',
    mt5AccountNumber: '', mt5InvestorPassword: '', brokerServer: '',
    startingEquity: '', city: '', state: '', consentGiven: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const updateField = (field: keyof FormData, value: string | boolean | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError('');
  };

  const submitForm = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/clients/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          startingEquity: Number(formData.startingEquity),
        }),
      });
      const data = await res.json();
      if (data.success) {
        router.push(`/thank-you?clientId=${data.data.id}`);
      } else {
        setError(data.error);
      }
    } catch {
      setError('Failed to submit application');
    }
    setLoading(false);
  };

  const canProceed = () => {
    switch (step) {
      case 1: return formData.fullName && formData.mobile.length === 13 && formData.occupation;
      case 2: return formData.mt5AccountNumber && formData.mt5InvestorPassword && formData.brokerServer && formData.startingEquity && formData.city && formData.state;
      case 3: return formData.consentGiven;
      default: return false;
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-12 px-4">
      <div className="max-w-lg mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-3">
            {STEPS.map((s) => (
              <div key={s.id} className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                    step >= s.id
                      ? 'bg-accent-teal text-terminal-bg'
                      : 'bg-terminal-card border border-terminal-border text-gray-500'
                  }`}
                >
                  {step > s.id ? '✓' : s.id}
                </div>
                <span className={`text-xs mt-1 ${step >= s.id ? 'text-accent-teal' : 'text-gray-500'}`}>
                  {s.label}
                </span>
              </div>
            ))}
          </div>
          <div className="h-1 bg-terminal-card rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-accent-teal to-accent-gold transition-all duration-500"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Content */}
        <div className="glass-card p-8 animate-slide-up">
          {error && (
            <div className="bg-accent-red/10 border border-accent-red/20 rounded-lg p-3 mb-6 text-accent-red text-sm">
              {error}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <h2 className="font-heading text-xl font-bold mb-4">Personal Details</h2>
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Full Name</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Enter your full name"
                  value={formData.fullName}
                  onChange={(e) => updateField('fullName', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Mobile Number</label>
                <div className="flex gap-2">
                  <span className="input-field w-16 flex items-center justify-center text-gray-400 shrink-0">+91</span>
                  <input
                    type="tel"
                    className="input-field"
                    placeholder="9876543210"
                    value={formData.mobile.replace('+91', '')}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                      updateField('mobile', '+91' + val);
                    }}
                    maxLength={10}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Business / Occupation</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Trader, Business Owner"
                  value={formData.occupation}
                  onChange={(e) => updateField('occupation', e.target.value)}
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <h2 className="font-heading text-xl font-bold mb-4">Trading Account Details</h2>
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">MT5 Account Number</label>
                <input
                  type="text"
                  className="input-field-mono"
                  placeholder="e.g. 12345678"
                  value={formData.mt5AccountNumber}
                  onChange={(e) => updateField('mt5AccountNumber', e.target.value.replace(/\D/g, ''))}
                />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <label className="text-sm text-gray-400">MT5 Investor Password</label>
                  <span className="flex items-center gap-1 text-xs text-accent-teal">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                    Read-only
                  </span>
                </div>
                <input
                  type="password"
                  className="input-field-mono"
                  placeholder="Your investor password"
                  value={formData.mt5InvestorPassword}
                  onChange={(e) => updateField('mt5InvestorPassword', e.target.value)}
                />
                <p className="text-gray-500 text-xs mt-1.5">
                  We only request your read-only Investor Password — never your live trading password. 
                  This is encrypted and never displayed in plain text.
                </p>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Broker Server</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Exness-MT5Real"
                  value={formData.brokerServer}
                  onChange={(e) => updateField('brokerServer', e.target.value)}
                  list="broker-servers"
                />
                <datalist id="broker-servers">
                  {BROKER_SERVERS.map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
                <p className="text-gray-500 text-xs mt-1.5">
                  Select from suggestions or type your broker server name
                </p>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Starting Equity (USD)</label>
                <input
                  type="number"
                  className="input-field-mono"
                  placeholder="e.g. 5000"
                  value={formData.startingEquity}
                  onChange={(e) => updateField('startingEquity', Number(e.target.value))}
                  min={100}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">City</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="City"
                    value={formData.city}
                    onChange={(e) => updateField('city', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">State</label>
                  <select
                    className="input-field"
                    value={formData.state}
                    onChange={(e) => updateField('state', e.target.value)}
                  >
                    <option value="">Select state</option>
                    {INDIAN_STATES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <h2 className="font-heading text-xl font-bold mb-4">Review & Consent</h2>
              
              <div className="space-y-3">
                {[
                  { label: 'Name', value: formData.fullName },
                  { label: 'Mobile', value: formData.mobile },
                  { label: 'Occupation', value: formData.occupation },
                  { label: 'MT5 Account', value: formData.mt5AccountNumber },
                  { label: 'Broker Server', value: formData.brokerServer },
                  { label: 'Starting Equity', value: `$${Number(formData.startingEquity).toLocaleString()}` },
                  { label: 'City', value: `${formData.city}, ${formData.state}` },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between py-2 border-b border-terminal-border">
                    <span className="text-gray-400 text-sm">{item.label}</span>
                    <span className="text-sm font-medium">{item.value}</span>
                  </div>
                ))}
              </div>

              <div className="glass-card p-4 border-accent-red/20">
                <h3 className="font-heading text-sm font-semibold text-accent-red mb-2">⚠️ Risk Disclosure</h3>
                <p className="text-gray-400 text-xs leading-relaxed">
                  Forex and CFD trading carries a high level of risk and may not be suitable for all investors. 
                  Past performance is not indicative of future results. The possibility exists that you could 
                  sustain a loss of some or all of your initial investment. Copy trading does not guarantee profits.
                </p>
              </div>

              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  className="mt-1 w-4 h-4 rounded border-terminal-border bg-terminal-bg text-accent-teal focus:ring-accent-teal/50"
                  checked={formData.consentGiven}
                  onChange={(e) => updateField('consentGiven', e.target.checked)}
                />
                <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                  I understand that forex/crypto CFD trading carries risk of loss. I am trading of my own accord, 
                  this is not investment advice, and I have read the risk disclosure above. I consent to sharing 
                  my MT5 investor (read-only) credentials for copy trading purposes.
                </span>
              </label>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 mt-8">
            {step > 1 && (
              <button
                onClick={() => setStep((s) => s - 1)}
                className="btn-secondary flex-1"
              >
                Back
              </button>
            )}
            {step < 3 ? (
              <button
                onClick={() => setStep((s) => s + 1)}
                disabled={!canProceed()}
                className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            ) : (
              <button
                onClick={submitForm}
                disabled={!canProceed() || loading}
                className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Submitting...' : 'Submit Application'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
