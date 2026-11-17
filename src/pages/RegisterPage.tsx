import React, { useMemo, useState } from 'react';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { PayBridgeLogo } from '../components/layout/PayBridgeLogo';
import { useApp } from '../context/AppContext';
import { FINTECH_LEDGER_ILLUSTRATION } from '../data/seedData';
import { computePasswordStrength, validateRegistrationForm } from '../utils/finance';

const INDUSTRIES = [
  'Industrial Manufacturing & Precision Components',
  'Automotive & Auto Ancillaries',
  'Electricals & Electronics Supply',
  'Packaging & Logistics',
  'Chemicals & Pharmaceuticals',
  'B2B Wholesale & Distribution',
  'IT & Enterprise Services',
];

export function RegisterPage() {
  const { register, setAuthView } = useApp();

  const [fullName, setFullName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [industry, setIndustry] = useState(INDUSTRIES[0]);
  const [gstin, setGstin] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const strength = useMemo(() => computePasswordStrength(password), [password]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateRegistrationForm({
      fullName,
      businessName,
      email,
      phone,
      password,
      confirmPassword,
      industry,
      gstin,
      acceptedTerms,
    });

    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      return;
    }

    setErrors({});
    register({
      fullName,
      businessName,
      email,
      phone,
      industry,
      gstin,
    });
  };

  const strengthColor =
    strength.score <= 1
      ? 'bg-[#DC2626]'
      : strength.score === 2
        ? 'bg-[#F59E0B]'
        : strength.score === 3
          ? 'bg-[#2563EB]'
          : 'bg-[#16A34A]';

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-white">
      <div className="lg:col-span-7 flex flex-col justify-between px-6 py-8 sm:px-12 lg:px-16">
        <div className="flex items-center justify-between">
          <PayBridgeLogo />
          <button
            type="button"
            onClick={() => setAuthView('login')}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-[#142B4A]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Sign In</span>
          </button>
        </div>

        <div className="w-full max-w-xl mx-auto my-8">
          <h1 className="text-2xl font-bold tracking-tight text-[#142B4A]">
            Create your PayBridge SME account
          </h1>
          <p className="mt-1.5 text-sm text-slate-600">
            Set up your company workspace to track corporate buyer invoices and payment cycles.
          </p>

          <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="reg-fullname" className="block text-xs font-medium text-slate-700 mb-1">
                  Full Name <span className="text-[#DC2626]">*</span>
                </label>
                <input
                  id="reg-fullname"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Rajesh Kulkarni"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-[#2563EB]"
                />
                {errors.fullName && (
                  <p className="mt-1 text-xs text-[#DC2626]">{errors.fullName}</p>
                )}
              </div>

              <div>
                <label htmlFor="reg-bizname" className="block text-xs font-medium text-slate-700 mb-1">
                  Business Name <span className="text-[#DC2626]">*</span>
                </label>
                <input
                  id="reg-bizname"
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="ABC Components Pvt. Ltd."
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-[#2563EB]"
                />
                {errors.businessName && (
                  <p className="mt-1 text-xs text-[#DC2626]">{errors.businessName}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="reg-email" className="block text-xs font-medium text-slate-700 mb-1">
                  Business Email <span className="text-[#DC2626]">*</span>
                </label>
                <input
                  id="reg-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="finance@company.in"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-[#2563EB]"
                />
                {errors.email && <p className="mt-1 text-xs text-[#DC2626]">{errors.email}</p>}
              </div>

              <div>
                <label htmlFor="reg-phone" className="block text-xs font-medium text-slate-700 mb-1">
                  Phone Number <span className="text-[#DC2626]">*</span>
                </label>
                <input
                  id="reg-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98204 51120"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-[#2563EB]"
                />
                {errors.phone && <p className="mt-1 text-xs text-[#DC2626]">{errors.phone}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="reg-industry" className="block text-xs font-medium text-slate-700 mb-1">
                  Industry <span className="text-[#DC2626]">*</span>
                </label>
                <select
                  id="reg-industry"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-[#2563EB]"
                >
                  {INDUSTRIES.map((ind) => (
                    <option key={ind} value={ind}>
                      {ind}
                    </option>
                  ))}
                </select>
                {errors.industry && (
                  <p className="mt-1 text-xs text-[#DC2626]">{errors.industry}</p>
                )}
              </div>

              <div>
                <label htmlFor="reg-gstin" className="block text-xs font-medium text-slate-700 mb-1">
                  GSTIN (Optional)
                </label>
                <input
                  id="reg-gstin"
                  type="text"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value.toUpperCase())}
                  placeholder="27AABCA4821M1Z5"
                  className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:outline-none focus:border-[#2563EB]"
                />
                {errors.gstin && <p className="mt-1 text-xs text-[#DC2626]">{errors.gstin}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="reg-password" className="block text-xs font-medium text-slate-700 mb-1">
                  Password <span className="text-[#DC2626]">*</span>
                </label>
                <div className="relative">
                  <input
                    id="reg-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    className="w-full pl-3 pr-9 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-[#2563EB]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-xs text-[#DC2626]">{errors.password}</p>
                )}
              </div>

              <div>
                <label htmlFor="reg-confirm" className="block text-xs font-medium text-slate-700 mb-1">
                  Confirm Password <span className="text-[#DC2626]">*</span>
                </label>
                <input
                  id="reg-confirm"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-[#2563EB]"
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-xs text-[#DC2626]">{errors.confirmPassword}</p>
                )}
              </div>
            </div>

            {/* Password strength indicator */}
            <div className="space-y-1.5">
              <div className="grid grid-cols-4 gap-1.5">
                {[1, 2, 3, 4].map((level) => (
                  <div
                    key={level}
                    className={`h-1.5 rounded-full transition-colors ${
                      strength.score >= level ? strengthColor : 'bg-slate-200'
                    }`}
                  />
                ))}
              </div>
              <div className="text-[11px] text-slate-500">
                Password strength: <span className="font-medium text-slate-700">{strength.label}</span>
              </div>
            </div>

            <div>
              <label className="inline-flex items-start gap-2.5 text-xs text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-slate-300 text-[#2563EB] focus:ring-[#2563EB]"
                />
                <span>
                  I agree to the PayBridge SME Terms of Service and Privacy Policy for B2B financial data processing.
                </span>
              </label>
              {errors.acceptedTerms && (
                <p className="mt-1 text-xs text-[#DC2626]">{errors.acceptedTerms}</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-[#2563EB] hover:bg-blue-700 rounded-lg transition-colors"
            >
              Create Account
            </button>
          </form>

          <p className="mt-5 text-center text-xs text-slate-600">
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => setAuthView('login')}
              className="font-semibold text-[#2563EB] hover:underline"
            >
              Sign in here
            </button>
          </p>
        </div>

        <div className="text-xs text-slate-400">PayBridge SME · Built for Indian B2B Suppliers</div>
      </div>

      <div className="hidden lg:flex lg:col-span-5 flex-col justify-between bg-[#142B4A] text-white p-12">
        <div>
          <p className="text-xs font-medium text-blue-200">Structured Receivables Onboarding</p>
          <h2 className="mt-3 text-2xl font-bold leading-snug">
            Replace scattered spreadsheets with disciplined corporate collections.
          </h2>
        </div>

        <div className="my-6 rounded-xl overflow-hidden border border-white/15 bg-[#EFF6FF]">
          <img
            src={FINTECH_LEDGER_ILLUSTRATION}
            alt="PayBridge SME financial ledger illustration"
            referrerPolicy="no-referrer"
            className="w-full h-64 object-cover"
          />
        </div>

        <div className="space-y-3 text-xs text-blue-100/90 border-t border-white/15 pt-5">
          <p>1. Import or create your corporate buyer directory with Net 15–60 terms.</p>
          <p>2. Track invoices, partial NEFT/RTGS receipts, and overdue exposure in INR.</p>
          <p>3. Schedule polite pre-due and escalation payment reminders automatically.</p>
        </div>
      </div>
    </div>
  );
}
