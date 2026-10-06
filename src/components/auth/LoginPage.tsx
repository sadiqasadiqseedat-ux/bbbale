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
  KeyRound, 
  ArrowLeft,
  Info,
  ChevronDown,
  ChevronUp
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
  const [showCredentialsHelper, setShowCredentialsHelper] = useState(true);

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

  const handleQuickFill = (uname: string) => {
    setIdentifier(uname);
    setPassword('Chambers@2026!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Subtle Grid Texture */}
      <div className="absolute inset-0 bg-[radial-gradient(#d97706_1px,transparent_1px)] [background-size:28px_28px] opacity-10 pointer-events-none"></div>

      {/* Top Bar with Return to Public Site */}
      <div className="absolute top-4 left-4 sm:top-6 sm:left-8 z-20">
        <button
          onClick={onReturnToPublic}
          className="flex items-center space-x-2 text-xs font-semibold text-slate-300 hover:text-amber-400 bg-slate-900/80 hover:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700/60 backdrop-blur-xs transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Public Chambers Site</span>
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        {/* Chambers Crest & Header */}
        <div className="text-center space-y-3 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-slate-900 border-2 border-amber-500/40 flex items-center justify-center text-amber-400 mx-auto shadow-2xl shadow-amber-500/10">
            <Scale className="w-9 h-9" />
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-white">
            B. B. BALE & CO.
          </h1>
          <p className="text-xs font-serif uppercase tracking-widest text-amber-400 font-semibold">
            CHAMBERS · LAW FIRM MANAGEMENT SYSTEM
          </p>
          <p className="text-[11px] text-slate-400 font-serif italic">
            "Secure. Organized. Professional."
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 p-8 space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="font-serif font-bold text-lg text-slate-900">
              Chambers Personnel Sign In
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter your authorized Chambers credentials to access your role-specific dashboard.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-start space-x-2.5 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Username or Email */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Username or Official Email: *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  autoComplete="username"
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  placeholder="e.g. principal.partner or email"
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 text-slate-900 text-xs sm:text-sm focus:outline-hidden focus:border-amber-600 focus:ring-1 focus:ring-amber-600 transition-colors"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-semibold text-slate-700">
                  Account Password: *
                </label>
                <button
                  type="button"
                  onClick={() => setIsForgotOpen(true)}
                  className="text-[11px] text-amber-800 hover:text-amber-900 font-semibold hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-10 py-2.5 rounded-lg border border-slate-300 text-slate-900 text-xs sm:text-sm focus:outline-hidden focus:border-amber-600 focus:ring-1 focus:ring-amber-600 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500 w-3.5 h-3.5 border-slate-300"
                />
                <span className="text-slate-600 text-xs font-medium">Keep session active (30 days)</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-slate-950 hover:bg-slate-900 text-amber-400 hover:text-amber-300 rounded-lg font-serif font-bold text-xs sm:text-sm tracking-wide shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2 border border-slate-800 disabled:opacity-60"
            >
              <span>{isLoading ? 'Verifying Credentials...' : 'Authenticate & Enter Dashboard'}</span>
              <ArrowRight className="w-4 h-4 text-amber-400" />
            </button>
          </form>

          {/* Initial Default Accounts Reference Accordion */}
          <div className="pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowCredentialsHelper(!showCredentialsHelper)}
              className="w-full flex items-center justify-between text-[11px] font-semibold text-slate-500 hover:text-slate-800"
            >
              <span className="flex items-center space-x-1">
                <Info className="w-3.5 h-3.5 text-amber-600" />
                <span>Authorized Initial Setup Usernames</span>
              </span>
              {showCredentialsHelper ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showCredentialsHelper && (
              <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2 text-[11px]">
                <p className="text-slate-600 leading-tight">
                  Initial deployment credentials configured for the 5 authorized Chambers roles (Setup password: <span className="font-mono font-bold text-slate-800">Chambers@2026!</span>):
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => handleQuickFill('principal.partner')}
                    className="p-1.5 bg-white hover:bg-amber-50 border border-slate-200 rounded text-left transition-colors"
                  >
                    <p className="font-bold text-slate-900">1. Principal Partner</p>
                    <p className="text-[10px] font-mono text-amber-800">principal.partner</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickFill('head.chamber')}
                    className="p-1.5 bg-white hover:bg-amber-50 border border-slate-200 rounded text-left transition-colors"
                  >
                    <p className="font-bold text-slate-900">2. Head of Chamber</p>
                    <p className="text-[10px] font-mono text-amber-800">head.chamber</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickFill('administrator')}
                    className="p-1.5 bg-white hover:bg-amber-50 border border-slate-200 rounded text-left transition-colors"
                  >
                    <p className="font-bold text-slate-900">3. Admin / Secretary</p>
                    <p className="text-[10px] font-mono text-amber-800">administrator</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickFill('accounts')}
                    className="p-1.5 bg-white hover:bg-amber-50 border border-slate-200 rounded text-left transition-colors"
                  >
                    <p className="font-bold text-slate-900">4. Account Officer</p>
                    <p className="text-[10px] font-mono text-amber-800">accounts</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickFill('counsel')}
                    className="sm:col-span-2 p-1.5 bg-white hover:bg-amber-50 border border-slate-200 rounded text-left transition-colors"
                  >
                    <p className="font-bold text-slate-900">5. Counsel / Staff</p>
                    <p className="text-[10px] font-mono text-amber-800">counsel</p>
                  </button>
                </div>
                <p className="text-[10px] text-amber-900 italic pt-1">
                  * First login using an initial password triggers mandatory <strong>Change Password</strong> before dashboard entry.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Security Legal Footer */}
        <div className="text-center text-[11px] text-slate-500 mt-6 space-y-1">
          <p className="flex items-center justify-center space-x-1">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
            <span>Strict Role-Based Access Control · 256-bit Cryptographic Hashing</span>
          </p>
          <p>© {new Date().getFullYear()} B. B. BALE & CO. CHAMBERS. Confidential Internal Portal.</p>
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
