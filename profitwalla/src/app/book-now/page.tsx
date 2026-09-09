'use client';

import { useState, useCallback, useEffect, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Phone,
  Briefcase,
  MapPin,
  CreditCard,
  Lock,
  Server,
  DollarSign,
  Check,
  ArrowLeft,
  ArrowRight,
  AlertTriangle,
  Shield,
  Loader2,
  Eye,
  EyeOff,
  CheckCircle2,
} from 'lucide-react';

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
  riskDisclosureRead: boolean;
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
  riskDisclosureRead?: string;
}

const STEPS = [
  { id: 1, label: 'Personal Info', icon: User },
  { id: 2, label: 'Trading Account', icon: CreditCard },
  { id: 3, label: 'Review & Consent', icon: Shield },
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



const INITIAL_FORM: FormData = {
  fullName: '',
  mobile: '',
  occupation: '',
  mt5AccountNumber: '',
  mt5InvestorPassword: '',
  brokerServer: '',
  startingEquity: '',
  city: '',
  state: '',
  consentGiven: false,
  riskDisclosureRead: false,
};

function validateField(field: keyof FormData, value: string | boolean | number): string | undefined {
  switch (field) {
    case 'fullName':
      if (!value || (typeof value === 'string' && value.trim().length < 2)) return 'Full name must be at least 2 characters';
      return undefined;
    case 'mobile':
      if (typeof value !== 'string' || !/^\+91[6-9]\d{9}$/.test(value)) return 'Enter a valid 10-digit Indian mobile number';
      return undefined;
    case 'occupation':
      if (!value || (typeof value === 'string' && value.trim().length < 2)) return 'Business / Occupation is required';
      return undefined;
    case 'mt5AccountNumber':
      if (!value || (typeof value === 'string' && !/^\d{5,15}$/.test(value))) return 'MT5 account must be 5–15 digits';
      return undefined;
    case 'mt5InvestorPassword':
      if (!value || (typeof value === 'string' && value.length < 1)) return 'Trading password is required';
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
    case 'riskDisclosureRead':
      if (!value) return 'You must read and acknowledge the risk disclosure';
      return undefined;
    case 'consentGiven':
      if (!value) return 'You must consent to data processing';
      return undefined;
    default:
      return undefined;
  }
}

function validateStep(step: number, formData: FormData): FieldErrors {
  const errors: FieldErrors = {};
  if (step === 1) {
    const fields: (keyof FormData)[] = ['fullName', 'mobile', 'occupation', 'city', 'state'];
    fields.forEach((f) => {
      const err = validateField(f, formData[f]);
      if (err) errors[f] = err;
    });
  } else if (step === 2) {
    const fields: (keyof FormData)[] = ['mt5AccountNumber', 'mt5InvestorPassword', 'brokerServer', 'startingEquity'];
    fields.forEach((f) => {
      const err = validateField(f, formData[f]);
      if (err) errors[f] = err;
    });
  } else if (step === 3) {
    const err1 = validateField('riskDisclosureRead', formData.riskDisclosureRead);
    const err2 = validateField('consentGiven', formData.consentGiven);
    if (err1) errors.riskDisclosureRead = err1;
    if (err2) errors.consentGiven = err2;
  }
  return errors;
}

function maskPassword(pw: string): string {
  if (pw.length <= 4) return '•'.repeat(pw.length);
  return '•'.repeat(pw.length - 4) + pw.slice(-4);
}

export default function BookNowPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const updateField = useCallback(
    (field: keyof FormData, value: string | boolean | number) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      setError('');
      if (touched[field as string]) {
        const err = validateField(field, value);
        setFieldErrors((prev) => ({ ...prev, [field]: err }));
      }
    },
    [touched]
  );

  const handleBlur = useCallback(
    (field: keyof FormData) => {
      setTouched((prev) => ({ ...prev, [field]: true }));
      const err = validateField(field, formData[field]);
      setFieldErrors((prev) => ({ ...prev, [field]: err }));
    },
    [formData]
  );

  const handleContinue = useCallback(() => {
    const errors = validateStep(step, formData);
    setFieldErrors(errors);
    const allTouched: Record<string, boolean> = {};
    Object.keys(errors).forEach((k) => {
      allTouched[k] = true;
    });
    setTouched((prev) => ({ ...prev, ...allTouched }));
    if (Object.keys(errors).length === 0) {
      setDirection(1);
      setStep((s) => s + 1);
    }
  }, [step, formData]);

  const handleBack = useCallback(() => {
    setDirection(-1);
    setStep((s) => s - 1);
  }, []);

  const submitForm = useCallback(async () => {
    const errors = validateStep(3, formData);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/clients/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: formData.fullName.trim(),
          mobile: formData.mobile,
          occupation: formData.occupation.trim(),
          mt5AccountNumber: formData.mt5AccountNumber,
          mt5InvestorPassword: formData.mt5InvestorPassword,
          brokerServer: formData.brokerServer,
          startingEquity: Number(formData.startingEquity),
          city: formData.city.trim(),
          state: formData.state,
          consentGiven: formData.consentGiven,
        }),
      });
      const data = await res.json();
      if (data.success) {
        router.push(`/thank-you?clientId=${data.data.id}`);
      } else {
        setError(data.error || 'Something went wrong. Please try again.');
      }
    } catch {
      setError('Network error. Please check your connection and try again.');
    }
    setLoading(false);
  }, [formData, router]);

  useEffect(() => {
    const handleKeyDown = (e: ReactKeyboardEvent | globalThis.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey && (e.target as HTMLElement).tagName !== 'BUTTON') {
        e.preventDefault();
        if (step < 3) {
          handleContinue();
        } else {
          submitForm();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [step, handleContinue, submitForm]);

  const canProceed = () => Object.keys(validateStep(step, formData)).length === 0;

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
  };

  const StepIndicator = () => (
    <div className="mb-8 md:mb-12">
      <div className="flex items-center justify-between relative">
        {/* Connecting line */}
        <div className="absolute top-4 left-0 right-0 h-0.5 bg-surface-300" />
        <div
          className="absolute top-4 left-0 h-0.5 bg-gradient-to-r from-accent-teal to-accent-teal transition-all duration-700 ease-out"
          style={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }}
        />

        {STEPS.map((s) => {
          const Icon = s.icon;
          const isCompleted = step > s.id;
          const isCurrent = step === s.id;
          return (
            <div key={s.id} className="flex flex-col items-center relative z-10">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 ${
                  isCompleted
                    ? 'bg-accent-teal text-surface shadow-glow-sm'
                    : isCurrent
                    ? 'bg-accent-teal/20 text-accent-teal border-2 border-accent-teal shadow-glow-sm'
                    : 'bg-surface-200 text-gray-500 border border-white/10'
                }`}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
              </div>
              <span
                className={`text-xs mt-2 font-medium transition-colors duration-300 ${
                  isCurrent ? 'text-accent-teal' : isCompleted ? 'text-gray-300' : 'text-gray-500'
                }`}
              >
                {s.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );

  const FieldError = ({ field }: { field: keyof FieldErrors }) => {
    if (touched[field] && fieldErrors[field]) {
      return (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-accent-red text-xs mt-1.5 flex items-center gap-1"
        >
          <AlertTriangle className="w-3 h-3" />
          {fieldErrors[field]}
        </motion.p>
      );
    }
    return null;
  };

  const inputWrapperClass = (field: keyof FieldErrors) =>
    `relative ${
      touched[field] && fieldErrors[field]
        ? '[&>input]:border-accent-red/50 [&>input]:focus:border-accent-red [&>input]:focus:ring-accent-red/20'
        : ''
    }`;

  return (
    <div className="min-h-screen pt-28 pb-16 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8 md:mb-12"
        >
          <span className="badge-teal mb-4 inline-flex">
            <Shield className="w-3 h-3" />
            Premium Onboarding
          </span>
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-white mb-2">
            <span className="text-gradient">Get Started</span> with Profitwalla
          </h1>
          <p className="text-gray-400 text-sm">
            Complete the form below to activate copy trading on your account.
          </p>
        </motion.div>

        {/* Progress */}
        <StepIndicator />

        {/* Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="card-glass p-6 md:p-8"
        >
          {/* Error Banner */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-accent-red/10 border border-accent-red/20 rounded-lg p-3 mb-6 text-accent-red text-sm flex items-center gap-2"
              >
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Step Content */}
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              {/* Step 1: Personal Info */}
              {step === 1 && (
                <div className="space-y-5">
                  <div className="mb-6">
                    <h2 className="font-heading text-xl font-bold text-white mb-1">Personal Information</h2>
                    <p className="text-gray-500 text-sm">Tell us about yourself to get started.</p>
                  </div>

                  <div className={inputWrapperClass('fullName')}>
                    <label className="label">
                      Full Name <span className="text-accent-red">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        type="text"
                        className="input pl-10"
                        placeholder="Enter your full name"
                        value={formData.fullName}
                        onChange={(e) => updateField('fullName', e.target.value)}
                        onBlur={() => handleBlur('fullName')}
                        autoComplete="name"
                      />
                    </div>
                    <FieldError field="fullName" />
                  </div>

                  <div className={inputWrapperClass('mobile')}>
                    <label className="label">
                      Mobile Number <span className="text-accent-red">*</span>
                    </label>
                    <div className="flex gap-2">
                      <span className="w-[72px] shrink-0 flex items-center justify-center bg-surface-100 border border-white/10 rounded-lg text-gray-400 text-sm font-mono">
                        +91
                      </span>
                      <div className="relative flex-1">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                          type="tel"
                          className="input pl-10"
                          placeholder="9876543210"
                          value={formData.mobile.replace('+91', '')}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                            updateField('mobile', '+91' + val);
                          }}
                          onBlur={() => handleBlur('mobile')}
                          maxLength={10}
                          autoComplete="tel-national"
                        />
                      </div>
                    </div>
                    <FieldError field="mobile" />
                  </div>

                  <div className={inputWrapperClass('occupation')}>
                    <label className="label">
                      Business / Occupation <span className="text-accent-red">*</span>
                    </label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        type="text"
                        className="input pl-10"
                        placeholder="e.g. Trader, Business Owner"
                        value={formData.occupation}
                        onChange={(e) => updateField('occupation', e.target.value)}
                        onBlur={() => handleBlur('occupation')}
                        autoComplete="organization-title"
                      />
                    </div>
                    <FieldError field="occupation" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className={inputWrapperClass('city')}>
                      <label className="label">
                        City <span className="text-accent-red">*</span>
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                          type="text"
                          className="input pl-10"
                          placeholder="City"
                          value={formData.city}
                          onChange={(e) => updateField('city', e.target.value)}
                          onBlur={() => handleBlur('city')}
                          autoComplete="address-level2"
                        />
                      </div>
                      <FieldError field="city" />
                    </div>

                    <div className={inputWrapperClass('state')}>
                      <label className="label">
                        State <span className="text-accent-red">*</span>
                      </label>
                      <div className="relative">
                        <select
                          className="select"
                          value={formData.state}
                          onChange={(e) => updateField('state', e.target.value)}
                          onBlur={() => handleBlur('state')}
                          autoComplete="address-level1"
                        >
                          <option value="">Select state</option>
                          {INDIAN_STATES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>
                      <FieldError field="state" />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Trading Account */}
              {step === 2 && (
                <div className="space-y-5">
                  <div className="mb-6">
                    <h2 className="font-heading text-xl font-bold text-white mb-1">Trading Account Details</h2>
                    <p className="text-gray-500 text-sm">Connect your MT5 account for copy trading.</p>
                  </div>

                  <div className={inputWrapperClass('mt5AccountNumber')}>
                    <label className="label">
                      MT5 Account Number <span className="text-accent-red">*</span>
                    </label>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        type="text"
                        className="input pl-10 font-mono"
                        placeholder="e.g. 12345678"
                        value={formData.mt5AccountNumber}
                        onChange={(e) => updateField('mt5AccountNumber', e.target.value.replace(/\D/g, ''))}
                        onBlur={() => handleBlur('mt5AccountNumber')}
                        inputMode="numeric"
                        autoComplete="off"
                      />
                    </div>
                    <FieldError field="mt5AccountNumber" />
                  </div>

                  <div className={inputWrapperClass('mt5InvestorPassword')}>
                    <div className="flex items-center justify-between mb-2">
                      <label className="label mb-0">
                        Trading Password <span className="text-accent-red">*</span>
                      </label>
                      <span className="badge-teal text-[10px] py-0.5 px-2">
                        <Lock className="w-2.5 h-2.5" />
                        Read-only access
                      </span>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className="input pl-10 pr-10"
                        placeholder="Your investor password"
                        value={formData.mt5InvestorPassword}
                        onChange={(e) => updateField('mt5InvestorPassword', e.target.value)}
                        onBlur={() => handleBlur('mt5InvestorPassword')}
                        autoComplete="off"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                        onClick={() => setShowPassword((v) => !v)}
                        tabIndex={-1}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <FieldError field="mt5InvestorPassword" />
                    <p className="text-gray-600 text-xs mt-1.5 flex items-center gap-1">
                      <Shield className="w-3 h-3 shrink-0" />
                      We only request your read-only investor password — never your master trading password.
                      This is encrypted at rest and never displayed in plain text.
                    </p>
                  </div>

                  <div className={inputWrapperClass('brokerServer')}>
                    <label className="label">
                      Broker Server <span className="text-accent-red">*</span>
                    </label>
                    <div className="relative">
                      <Server className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        type="text"
                        className="input pl-10"
                        placeholder="e.g. Exness-MT5Real"
                        value={formData.brokerServer}
                        onChange={(e) => updateField('brokerServer', e.target.value)}
                        onBlur={() => handleBlur('brokerServer')}
                      />
                    </div>
                    <FieldError field="brokerServer" />
                  </div>

                  <div className={inputWrapperClass('startingEquity')}>
                    <label className="label">
                      Starting Equity (USD) <span className="text-accent-red">*</span>
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        type="number"
                        className="input pl-10 font-mono"
                        placeholder="e.g. 5000"
                        value={formData.startingEquity}
                        onChange={(e) => updateField('startingEquity', e.target.value === '' ? '' : Number(e.target.value))}
                        onBlur={() => handleBlur('startingEquity')}
                        min={100}
                        step="100"
                        inputMode="decimal"
                      />
                    </div>
                    <FieldError field="startingEquity" />
                    <p className="text-gray-600 text-xs mt-1.5">Minimum $100 USD</p>
                  </div>
                </div>
              )}

              {/* Step 3: Review & Consent */}
              {step === 3 && (
                <div className="space-y-6">
                  <div className="mb-6">
                    <h2 className="font-heading text-xl font-bold text-white mb-1">Review & Consent</h2>
                    <p className="text-gray-500 text-sm">Please verify your details and accept the terms.</p>
                  </div>

                  {/* Summary */}
                  <div className="bg-surface-100 rounded-xl border border-white/5 divide-y divide-white/5">
                    <div className="px-4 py-3">
                      <span className="text-gray-500 text-xs uppercase tracking-wider">Personal Information</span>
                    </div>
                    {[
                      { label: 'Full Name', value: formData.fullName },
                      { label: 'Mobile', value: formData.mobile },
                      { label: 'Occupation', value: formData.occupation },
                      { label: 'Location', value: `${formData.city}, ${formData.state}` },
                    ].map((item) => (
                      <div key={item.label} className="flex justify-between items-center px-4 py-2.5">
                        <span className="text-gray-400 text-sm">{item.label}</span>
                        <span className="text-sm font-medium text-white">{item.value}</span>
                      </div>
                    ))}

                    <div className="px-4 py-3">
                      <span className="text-gray-500 text-xs uppercase tracking-wider">Trading Account</span>
                    </div>
                    {[
                      { label: 'MT5 Account', value: formData.mt5AccountNumber },
                      { label: 'Password', value: maskPassword(formData.mt5InvestorPassword) },
                      { label: 'Broker Server', value: formData.brokerServer },
                      { label: 'Starting Equity', value: `$${Number(formData.startingEquity).toLocaleString()}` },
                    ].map((item) => (
                      <div key={item.label} className="flex justify-between items-center px-4 py-2.5">
                        <span className="text-gray-400 text-sm">{item.label}</span>
                        <span className="text-sm font-medium text-white font-mono">{item.value}</span>
                      </div>
                    ))}
                  </div>

                  {/* Risk Disclosure */}
                  <div className="bg-accent-red/5 border border-accent-red/15 rounded-xl p-4">
                    <h3 className="font-heading text-sm font-semibold text-accent-red mb-2 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      Risk Disclosure
                    </h3>
                    <p className="text-gray-400 text-xs leading-relaxed">
                      I understand that forex/CFD trading involves substantial risk. Past performance does not guarantee future results. Copy trading does not guarantee profits. I confirm that the information provided is accurate.
                    </p>
                  </div>

                  {/* Consent Checkboxes */}
                  <div className="space-y-4">
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <div className="relative mt-0.5">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={formData.riskDisclosureRead}
                          onChange={(e) => updateField('riskDisclosureRead', e.target.checked)}
                          onBlur={() => handleBlur('riskDisclosureRead')}
                        />
                        <div className="w-5 h-5 rounded border border-white/15 bg-surface-100 peer-checked:bg-accent-teal peer-checked:border-accent-teal transition-all duration-200 flex items-center justify-center">
                          {formData.riskDisclosureRead && <Check className="w-3 h-3 text-surface" />}
                        </div>
                      </div>
                      <span className="text-sm text-gray-300 group-hover:text-white transition-colors leading-snug">
                        I have read and agree to the Risk Disclosure statement above.
                      </span>
                    </label>
                    <FieldError field="riskDisclosureRead" />

                    <label className="flex items-start gap-3 cursor-pointer group">
                      <div className="relative mt-0.5">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={formData.consentGiven}
                          onChange={(e) => updateField('consentGiven', e.target.checked)}
                          onBlur={() => handleBlur('consentGiven')}
                        />
                        <div className="w-5 h-5 rounded border border-white/15 bg-surface-100 peer-checked:bg-accent-teal peer-checked:border-accent-teal transition-all duration-200 flex items-center justify-center">
                          {formData.consentGiven && <Check className="w-3 h-3 text-surface" />}
                        </div>
                      </div>
                      <span className="text-sm text-gray-300 group-hover:text-white transition-colors leading-snug">
                        I consent to Profitwalla processing my information for account setup.
                      </span>
                    </label>
                    <FieldError field="consentGiven" />
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex gap-3 mt-8 pt-6 border-t border-white/5">
            {step > 1 && (
              <button
                type="button"
                onClick={handleBack}
                className="btn-secondary flex-1"
                disabled={loading}
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
            )}
            {step < 3 ? (
              <button
                type="button"
                onClick={handleContinue}
                className="btn-primary flex-1"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={submitForm}
                disabled={!formData.riskDisclosureRead || !formData.consentGiven || loading}
                className="btn-primary flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Submit Application
                  </>
                )}
              </button>
            )}
          </div>
        </motion.div>

        {/* Footer Note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-gray-600 text-xs mt-6 max-w-md mx-auto"
        >
          Your data is encrypted and stored securely. We never share your information with third parties without your consent.
        </motion.p>
      </div>
    </div>
  );
}
