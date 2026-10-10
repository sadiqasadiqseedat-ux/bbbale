import React, { useState } from 'react';
import { 
  Scale, 
  Lock, 
  User as UserIcon, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ShieldCheck, 
  AlertCircle, 
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ForgotPasswordModal } from './ForgotPasswordModal';

interface LoginPageProps {
  onSuccessLogin: (requiresPasswordChange: boolean) => void;
  onReturnToPublic: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSuccessLogin, onReturnToPublic }) => {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isForgotOpen, setIsForgotOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!identifier.trim() || !password) {
      setErrorMsg('Please enter both your Chambers username/email and password.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await login(identifier.trim(), password, rememberMe);
      if (res.success) {
        onSuccessLogin(res.requiresPasswordChange ?? false);
      } else {
        setErrorMsg(res.error || 'Authentication failed. Please verify credentials.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during authentication.');
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = "w-full pl-11 pr-3 py-3 rounded-2xl border border-ink-200 bg-ink-50/60 text-ink-900 text-sm placeholder:text-ink-400 focus:outline-hidden focus:border-accent-500 focus:ring-4 focus:ring-accent-500/15 transition-all";

  return (
    <div className="min-h-screen bg-ink-50 lg:grid lg:grid-cols-2">
      {/* Brand Panel */}
      <div className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-ink-950 text-white p-12 xl:p-16">
        <div
          className="absolute inset-0 opacity-[0.12] pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
            backgroundSize: '52px 52px'
          }}
        />
        <div className="absolute -top-32 -left-20 w-[32rem] h-[32rem] rounded-full bg-accent-600/30 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[26rem] h-[26rem] rounded-full bg-cyan-500/10 blur-[120px] pointer-events-none" />

        <div className="relative flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent-500 to-accent-700 flex items-center justify-center text-white shadow-lg shadow-accent-600/30">
            <Scale className="w-6 h-6" />
          </div>
          <div className="leading-none">
            <span className="block font-display text-lg font-extrabold tracking-tight text-white">B. B. BALE &amp; CO.</span>
            <span className="block mt-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-accent-300">Chambers</span>
          </div>
        </div>

        <div className="relative space-y-6 max-w-md">
          <h1 className="font-display text-4xl xl:text-5xl font-extrabold leading-[1.05]">
            The <span className="text-gradient">secure command centre</span> for a modern national practice.
          </h1>
          <p className="text-sm text-ink-300 leading-relaxed">
            One integrated workspace for clients, consultations, litigation, court diary, properties, billing and staff — with strict branch financial isolation.
          </p>
          <div className="space-y-3 pt-2">
            {[
              'Role-based access with 256-bit cryptographic hashing',
              'Atomic payment verification across every matter type',
              'Real-time Cloudflare D1 central database sync'
            ].map(line => (
              <div key={line} className="flex items-start gap-3 text-xs text-ink-300">
                <ShieldCheck className="w-4 h-4 text-accent-400 shrink-0 mt-0.5" />
                <span>{line}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-[11px] text-ink-500">
          © {new Date().getFullYear()} B. B. BALE &amp; CO. CHAMBERS · Registered under the Legal Practitioners Act of Nigeria.
        </p>
      </div>

      {/* Form Panel */}
      <div className="relative flex flex-col justify-center py-12 px-4 sm:px-8 lg:px-12">
        <div className="absolute top-4 left-4 sm:top-6 sm:left-8">
          <button
            onClick={onReturnToPublic}
            className="flex items-center gap-2 text-xs font-semibold text-ink-600 hover:text-ink-950 bg-white hover:bg-ink-100 px-3.5 py-2 rounded-full border border-ink-200 shadow-sm transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Public Site</span>
          </button>
        </div>

        <div className="mx-auto w-full max-w-md">
          {/* Mobile brand header */}
          <div className="lg:hidden text-center space-y-3 mb-7">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-accent-500 to-accent-700 flex items-center justify-center text-white mx-auto shadow-xl shadow-accent-600/25">
              <Scale className="w-8 h-8" />
            </div>
            <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink-950">B. B. BALE &amp; CO.</h1>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-accent-600">
              Chambers · Management System
            </p>
          </div>

          {/* Login Card */}
          <div className="bg-white rounded-3xl shadow-xl shadow-ink-900/5 border border-ink-200/80 p-7 sm:p-8 space-y-6">
            <div>
              <h2 className="font-display font-extrabold text-xl text-ink-950">
                Chambers Personnel Sign In
              </h2>
              <p className="text-xs text-ink-500 mt-1">
                Enter your authorized credentials to access your role-specific dashboard.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username or Email */}
              <div>
                <label className="block text-xs font-semibold text-ink-700 mb-1.5">
                  Username or Official Email *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-ink-400">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    autoComplete="username"
                    value={identifier}
                    onChange={e => setIdentifier(e.target.value)}
                    placeholder="e.g. principal.partner"
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-ink-700">
                    Account Password *
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsForgotOpen(true)}
                    className="text-[11px] text-accent-700 hover:text-accent-800 font-semibold hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-ink-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className={inputClass}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-ink-400 hover:text-ink-700"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    className="rounded-md text-accent-600 focus:ring-accent-500 w-4 h-4 border-ink-300"
                  />
                  <span className="text-ink-600 text-xs font-medium">Keep session active (24h timeout)</span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-accent-600 hover:bg-accent-500 text-white rounded-2xl font-bold text-sm tracking-wide shadow-lg shadow-accent-600/25 hover:shadow-accent-500/35 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <span>{isLoading ? 'Verifying Credentials...' : 'Authenticate & Enter Dashboard'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Security Footer */}
          <div className="text-center text-[11px] text-ink-500 mt-6 space-y-1.5">
            <p className="flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-accent-500" />
              <span>Strict Role-Based Access Control · 256-bit Cryptographic Hashing</span>
            </p>
            <p className="lg:hidden">© {new Date().getFullYear()} B. B. BALE &amp; CO. CHAMBERS. Confidential Internal Portal.</p>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={isForgotOpen}
        onClose={() => setIsForgotOpen(false)}
      />
    </div>
  );
};
