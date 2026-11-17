import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, Eye, EyeOff, Lock, ShieldCheck } from 'lucide-react';
import { PayBridgeLogo } from '../components/layout/PayBridgeLogo';
import { Modal } from '../components/ui/Modal';
import { useApp } from '../context/AppContext';
import { FINTECH_LEDGER_ILLUSTRATION } from '../data/seedData';
import { isValidEmail, validateLoginForm } from '../utils/finance';

export function LoginPage() {
  const { login, demoLogin, setAuthView, addToast } = useApp();

  const [email, setEmail] = useState('rajesh@abccomponents.in');
  const [password, setPassword] = useState('PayBridge@2027');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [forgotOpen, setForgotOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetSent, setResetSent] = useState(false);

  const [imgError, setImgError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateLoginForm(email, password);
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      return;
    }
    setErrors({});
    login(email, password);
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim() || !isValidEmail(resetEmail)) {
      setResetError('Enter a valid registered email address.');
      return;
    }
    setResetError('');
    setResetSent(true);
    addToast({
      type: 'info',
      title: 'Password reset link dispatched',
      description: `Instructions sent to ${resetEmail.trim()}.`,
    });
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-white">
      {/* Left: Login Form */}
      <div className="flex flex-col justify-between px-6 py-8 sm:px-12 lg:px-16 xl:px-24">
        <div>
          <PayBridgeLogo />
        </div>

        <div className="w-full max-w-md mx-auto my-10">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#142B4A]">
            Sign in to your receivables hub
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Track corporate invoices, automate follow-ups, and monitor cash inflows.
          </p>

          <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-5">
            <div>
              <label htmlFor="login-email" className="block text-xs font-medium text-slate-700 mb-1.5">
                Business Email Address
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.in"
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15"
              />
              {errors.email && (
                <p className="mt-1.5 text-xs text-[#DC2626]">{errors.email}</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="login-password" className="block text-xs font-medium text-slate-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setResetEmail(email);
                    setResetError('');
                    setResetSent(false);
                    setForgotOpen(true);
                  }}
                  className="text-xs font-medium text-[#2563EB] hover:underline"
                >
                  Forgot password?
                </button>
              </div>

              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-3.5 pr-10 py-2.5 text-sm border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-700 rounded"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs text-[#DC2626]">{errors.password}</p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <label className="inline-flex items-center gap-2 text-xs text-slate-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-[#2563EB] focus:ring-[#2563EB]"
                />
                <span>Remember this device for 30 days</span>
              </label>
            </div>

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-[#2563EB] hover:bg-blue-700 rounded-lg transition-colors"
            >
              <span>Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={demoLogin}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-[#142B4A] bg-[#EFF6FF] hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
            >
              <ShieldCheck className="w-4 h-4 text-[#2563EB]" />
              <span>Continue with Sample SME Workspace</span>
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-600">
            New to PayBridge SME?{' '}
            <button
              type="button"
              onClick={() => setAuthView('register')}
              className="font-semibold text-[#2563EB] hover:underline"
            >
              Create an SME account
            </button>
          </p>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>PayBridge SME</span>
          <span className="inline-flex items-center gap-1">
            <Lock className="w-3 h-3" />
            <span>Encrypted workspace</span>
          </span>
        </div>
      </div>

      {/* Right: Architectural Financial Preview */}
      <div className="hidden lg:flex flex-col justify-between bg-[#142B4A] text-white p-12 xl:p-16">
        <div className="max-w-lg">
          <p className="text-xs font-medium tracking-wide text-blue-200">
            B2B Receivables Intelligence
          </p>
          <h2 className="mt-3 text-2xl xl:text-3xl font-bold leading-snug text-white">
            Take control of your business payments with intelligent invoice tracking and automated follow-ups.
          </h2>
        </div>

        <div className="my-8 rounded-2xl overflow-hidden border border-white/15 bg-[#EFF6FF] aspect-[4/3] max-h-[380px] flex items-center justify-center">
          {!imgError ? (
            <img
              src={FINTECH_LEDGER_ILLUSTRATION}
              alt="PayBridge SME architectural treasury and invoice tracking illustration"
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="p-8 text-center text-[#142B4A]">
              <p className="font-semibold text-base">PayBridge SME Treasury Ledger</p>
              <p className="mt-1 text-xs text-slate-600">Real-time INR receivables visibility</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-white/15 text-xs">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-300 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-white">Automated Follow-ups</div>
              <div className="mt-0.5 text-blue-200/80">Pre-due & overdue email schedules</div>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-300 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-white">Partial Settlements</div>
              <div className="mt-0.5 text-blue-200/80">Auto-reconciled INR balances</div>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-300 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-white">Buyer Risk Scoring</div>
              <div className="mt-0.5 text-blue-200/80">Track corporate payment delays</div>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <Modal
        open={forgotOpen}
        onClose={() => setForgotOpen(false)}
        title="Reset Your Password"
        subtitle="Enter your registered business email to receive recovery instructions."
        maxWidthClass="max-w-md"
      >
        {resetSent ? (
          <div className="space-y-4">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900">
              A password recovery link has been sent to <span className="font-semibold">{resetEmail}</span>. Please check your inbox.
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setForgotOpen(false)}
                className="px-4 py-2 text-sm font-medium text-white bg-[#2563EB] hover:bg-blue-700 rounded-lg"
              >
                Back to Sign In
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleForgotSubmit} noValidate className="space-y-4">
            <div>
              <label htmlFor="reset-email" className="block text-xs font-medium text-slate-700 mb-1">
                Business Email
              </label>
              <input
                id="reset-email"
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="name@company.in"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-[#2563EB]"
              />
              {resetError && <p className="mt-1 text-xs text-[#DC2626]">{resetError}</p>}
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setForgotOpen(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-[#2563EB] hover:bg-blue-700 rounded-lg"
              >
                Send Reset Link
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
