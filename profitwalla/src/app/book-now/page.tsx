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

interface FieldErrors {
  fullName?: string;
  mobile?: string;
  occupation?: string;
  mt5AccountNumber?: string;
  mt5InvestorPassword?: string;
  brokerServer?: string;
  startingEquity?: string;
  city?: string;
  state?: string;
  consentGiven?: string;
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

function validateField(field: keyof FormData, value: string | boolean | number): string | undefined {
  switch (field) {
    case 'fullName':
      if (!value || (typeof value === 'string' && value.trim().length < 2)) return 'Name must be at least 2 characters';
      return undefined;
    case 'mobile':
      if (typeof value === 'string' && !/^\+91[6-9]\d{9}$/.test(value)) return 'Enter a valid 10-digit Indian mobile number';
      return undefined;
    case 'occupation':
      if (!value || (typeof value === 'string' && value.trim().length < 2)) return 'Occupation is required';
      return undefined;
    case 'mt5AccountNumber':
      if (!value || (typeof value === 'string' && !/^\d{5,15}$/.test(value))) return 'MT5 account must be 5-15 digits';
      return undefined;
    case 'mt5InvestorPassword':
      if (!value || (typeof value === 'string' && value.length < 1)) return 'Investor password is required';
      return undefined;
    case 'brokerServer':
      if (!value || (typeof value === 'string' && value.trim().length < 1)) return 'Broker server is required';
      return undefined;
    case 'startingEquity':
      if (!value || (typeof value === 'number' && value < 100)) return 'Minimum starting equity is $100';
      return undefined;
    case 'city':
      if (!value || (typeof value === 'string' && value.trim().length < 2)) return 'City is required';
      return undefined;
    case 'state':
      if (!value || (typeof value === 'string' && value.length < 1)) return 'State is required';
      return undefined;
    case 'consentGiven':
      if (!value) return 'You must accept the risk disclosure and consent';
      return undefined;
    default:
      return undefined;
  }
}

function validateStep(step: number, formData: FormData): FieldErrors {
  const errors: FieldErrors = {};
  if (step === 1) {
    const nameErr = validateField('fullName', formData.fullName);
    const mobileErr = validateField('mobile', formData.mobile);
    const occErr = validateField('occupation', formData.occupation);
    if (nameErr) errors.fullName = nameErr;
    if (mobileErr) errors.mobile = mobileErr;
    if (occErr) errors.occupation = occErr;
  } else if (step === 2) {
    const fields: (keyof FormData)[] = ['mt5AccountNumber', 'mt5InvestorPassword', 'brokerServer', 'startingEquity', 'city', 'state'];
    fields.forEach((f) => {
      const err = validateField(f, formData[f]);
      if (err) errors[f] = err;
    });
  } else if (step === 3) {
    const err = validateField('consentGiven', formData.consentGiven);
    if (err) errors.consentGiven = err;
  }
  return errors;
}

export default function BookNowPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    fullName: '', mobile: '', occupation: '',
    mt5AccountNumber: '', mt5InvestorPassword: '', brokerServer: '',
    startingEquity: '', city: '', state: '', consentGiven: false,
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const updateField = (field: keyof FormData, value: string | boolean | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError('');
    if (touched[field as string]) {
      const err = validateField(field, value);
      setFieldErrors((prev) => ({ ...prev, [field]: err }));
    }
  };

  const handleBlur = (field: keyof FormData) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const err = validateField(field, formData[field]);
    setFieldErrors((prev) => ({ ...prev, [field]: err }));
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
    const errors = validateStep(step, formData);
    return Object.keys(errors).length === 0;
  };

  const handleContinue = () => {
    const errors = validateStep(step, formData);
    setFieldErrors(errors);
    const allTouched: Record<string, boolean> = {};
    Object.keys(errors).forEach((k) => { allTouched[k] = true; });
    setTouched((prev) => ({ ...prev, ...allTouched }));
    if (Object.keys(errors).length === 0) {
      setStep((s) => s + 1);
    }
  };

  const FieldError = ({ field }: { field: keyof FieldErrors }) => {
    if (touched[field] && fieldErrors[field]) {
      return <p className="text-accent-red text-xs mt-1">{fieldErrors[field]}</p>;
    }
    return null;
  };

  const inputClass = (field: keyof FieldErrors) =>
    `input-field${touched[field] && fieldErrors[field] ? ' border-accent-red focus:border-accent-red focus:ring-accent-red/50' : ''}`;

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
                <label className="block text-sm text-gray-400 mb-1.5">
                  Full Name <span className="text-accent-red">*</span>
                </label>
                <input
                  type="text"
                  className={inputClass('fullName')}
                  placeholder="Enter your full name"
                  value={formData.fullName}
                  onChange={(e) => updateField('fullName', e.target.value)}
                  onBlur={() => handleBlur('fullName')}
                  required
                  aria-required="true"
                  aria-invalid={!!(touched.fullName && fieldErrors.fullName)}
                  aria-describedby={fieldErrors.fullName ? 'fullName-error' : undefined}
                />
                <FieldError field="fullName" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">
                  Mobile Number <span className="text-accent-red">*</span>
                </label>
                <div className="flex gap-2">
                  <span className="input-field w-16 flex items-center justify-center text-gray-400 shrink-0">+91</span>
                  <input
                    type="tel"
                    className={inputClass('mobile')}
                    placeholder="9876543210"
                    value={formData.mobile.replace('+91', '')}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                      updateField('mobile', '+91' + val);
                    }}
                    onBlur={() => handleBlur('mobile')}
                    maxLength={10}
                    required
                    aria-required="true"
                    aria-invalid={!!(touched.mobile && fieldErrors.mobile)}
                  />
                </div>
                <FieldError field="mobile" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">
                  Business / Occupation <span className="text-accent-red">*</span>
                </label>
                <input
                  type="text"
                  className={inputClass('occupation')}
                  placeholder="e.g. Trader, Business Owner"
                  value={formData.occupation}
                  onChange={(e) => updateField('occupation', e.target.value)}
                  onBlur={() => handleBlur('occupation')}
                  required
                  aria-required="true"
                  aria-invalid={!!(touched.occupation && fieldErrors.occupation)}
                />
                <FieldError field="occupation" />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <h2 className="font-heading text-xl font-bold mb-4">Trading Account Details</h2>
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">
                  MT5 Account Number <span className="text-accent-red">*</span>
                </label>
                <input
                  type="text"
                  className={inputClass('mt5AccountNumber')}
                  placeholder="e.g. 12345678"
                  value={formData.mt5AccountNumber}
                  onChange={(e) => updateField('mt5AccountNumber', e.target.value.replace(/\D/g, ''))}
                  onBlur={() => handleBlur('mt5AccountNumber')}
                  required
                  aria-required="true"
                  aria-invalid={!!(touched.mt5AccountNumber && fieldErrors.mt5AccountNumber)}
                />
                <FieldError field="mt5AccountNumber" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <label className="text-sm text-gray-400">
                    MT5 Trading Password <span className="text-accent-red">*</span>
                  </label>
                  <span className="flex items-center gap-1 text-xs text-accent-teal">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                    Read-only
                  </span>
                </div>
                <input
                  type="password"
                  className={inputClass('mt5InvestorPassword')}
                  placeholder="Your trading password"
                  value={formData.mt5InvestorPassword}
                  onChange={(e) => updateField('mt5InvestorPassword', e.target.value)}
                  onBlur={() => handleBlur('mt5InvestorPassword')}
                  required
                  aria-required="true"
                  aria-invalid={!!(touched.mt5InvestorPassword && fieldErrors.mt5InvestorPassword)}
                />
                <FieldError field="mt5InvestorPassword" />
                <p className="text-gray-500 text-xs mt-1.5">
                  We only request your read-only Trading Password — never your live trading password. 
                  This is encrypted and never displayed in plain text.
                </p>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">
                  Broker Server <span className="text-accent-red">*</span>
                </label>
                <input
                  type="text"
                  className={inputClass('brokerServer')}
                  placeholder="e.g. Exness-MT5Real"
                  value={formData.brokerServer}
                  onChange={(e) => updateField('brokerServer', e.target.value)}
                  onBlur={() => handleBlur('brokerServer')}
                  list="broker-servers"
                  required
                  aria-required="true"
                  aria-invalid={!!(touched.brokerServer && fieldErrors.brokerServer)}
                />
                <datalist id="broker-servers">
                  {BROKER_SERVERS.map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
                <FieldError field="brokerServer" />
                <p className="text-gray-500 text-xs mt-1.5">
                  Select from suggestions or type your broker server name
                </p>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">
                  Starting Equity (USD) <span className="text-accent-red">*</span>
                </label>
                <input
                  type="number"
                  className={inputClass('startingEquity')}
                  placeholder="e.g. 5000"
                  value={formData.startingEquity}
                  onChange={(e) => updateField('startingEquity', Number(e.target.value))}
                  onBlur={() => handleBlur('startingEquity')}
                  min={100}
                  required
                  aria-required="true"
                  aria-invalid={!!(touched.startingEquity && fieldErrors.startingEquity)}
                />
                <FieldError field="startingEquity" />
                <p className="text-gray-500 text-xs mt-1.5">Minimum $100</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">
                    City <span className="text-accent-red">*</span>
                  </label>
                  <input
                    type="text"
                    className={inputClass('city')}
                    placeholder="City"
                    value={formData.city}
                    onChange={(e) => updateField('city', e.target.value)}
                    onBlur={() => handleBlur('city')}
                    required
                    aria-required="true"
                    aria-invalid={!!(touched.city && fieldErrors.city)}
                  />
                  <FieldError field="city" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">
                    State <span className="text-accent-red">*</span>
                  </label>
                  <select
                    className={inputClass('state')}
                    value={formData.state}
                    onChange={(e) => updateField('state', e.target.value)}
                    onBlur={() => handleBlur('state')}
                    required
                    aria-required="true"
                    aria-invalid={!!(touched.state && fieldErrors.state)}
                  >
                    <option value="">Select state</option>
                    {INDIAN_STATES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <FieldError field="state" />
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
                <h3 className="font-heading text-sm font-semibold text-accent-red mb-2 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Risk Disclosure
                </h3>
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
                  onBlur={() => handleBlur('consentGiven')}
                  required
                  aria-required="true"
                  aria-invalid={!!(touched.consentGiven && fieldErrors.consentGiven)}
                />
                <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                  I understand that forex/crypto CFD trading carries risk of loss. I am trading of my own accord, 
                  this is not investment advice, and I have read the risk disclosure above. I consent to sharing 
                  my MT5 trading (read-only) credentials for copy trading purposes.
                </span>
              </label>
              <FieldError field="consentGiven" />
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
                onClick={handleContinue}
                className="btn-primary flex-1"
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
