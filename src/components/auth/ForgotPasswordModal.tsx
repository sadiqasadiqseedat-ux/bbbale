import React, { useState } from 'react';
import { KeyRound, Mail, CheckCircle2, AlertCircle, ArrowRight, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { validatePasswordStrength } from '../../services/crypto';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ isOpen, onClose }) => {
  const { requestPasswordReset, completePasswordReset } = useAuth();
  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [identifier, setIdentifier] = useState('');
  const [tokenInput, setTokenInput] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [message, setMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRequest = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setMessage('');

    if (!identifier.trim()) {
      setErrorMsg('Please enter your Chambers username or registered email address.');
      return;
    }

    const res = requestPasswordReset(identifier.trim());
    if (res.success) {
      setMessage(res.message);
      if (res.resetToken) {
        setGeneratedToken(res.resetToken);
        setTokenInput(res.resetToken);
      }
      setStep('reset');
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!tokenInput.trim()) {
      setErrorMsg('Reset token is required.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    const strength = validatePasswordStrength(newPassword);
    if (!strength.isValid) {
      setErrorMsg(strength.errors[0]);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await completePasswordReset(tokenInput.trim(), newPassword);
      if (res.success) {
        alert('Password has been successfully reset! You can now log in with your new password.');
        onClose();
      } else {
        setErrorMsg(res.error || 'Failed to complete reset.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error executing password reset.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8 space-y-6 border border-slate-300">
        <div className="flex justify-between items-start pb-2 border-b border-slate-200">
          <div className="flex items-center space-x-2">
            <KeyRound className="w-5 h-5 text-amber-700" />
            <h3 className="font-serif font-bold text-lg text-slate-900">
              Chambers Password Reset
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {step === 'request' ? (
          <form onSubmit={handleRequest} className="space-y-4 text-xs">
            <p className="text-slate-600 leading-relaxed">
              Enter your official Chambers username (e.g. <span className="font-mono text-slate-800">principal.partner</span>) or authorized email address to generate secure reset authorization.
            </p>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Username or Official Email: *
              </label>
              <input
                type="text"
                required
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                placeholder="e.g. principal.partner or secretary@bbbalechambers.ng"
                className="w-full p-3 rounded-lg border border-slate-300 focus:outline-hidden focus:border-amber-600"
              />
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={() => setStep('reset')}
                className="text-[11px] text-amber-800 hover:underline"
              >
                Already have a reset token?
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold flex items-center space-x-1"
              >
                <span>Request Reset</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleReset} className="space-y-4 text-xs">
            {generatedToken && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg space-y-1">
                <span className="font-bold text-amber-900 uppercase text-[10px]">Security Reset Authorization Token:</span>
                <p className="font-mono text-xs text-slate-900 bg-white p-2 rounded border border-amber-300 break-all select-all font-bold">
                  {generatedToken}
                </p>
                <p className="text-[10px] text-amber-800">Token is valid for 1 hour.</p>
              </div>
            )}

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Verification Reset Token: *
              </label>
              <input
                type="text"
                required
                value={tokenInput}
                onChange={e => setTokenInput(e.target.value)}
                placeholder="Paste the 48-character reset token"
                className="w-full p-2.5 rounded-lg border border-slate-300 font-mono text-[11px]"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                New Confidential Password: *
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Minimum 8 characters with mixed case & number"
                className="w-full p-2.5 rounded-lg border border-slate-300"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Confirm New Password: *
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Re-enter exact new password"
                className="w-full p-2.5 rounded-lg border border-slate-300"
              />
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={() => setStep('request')}
                className="text-[11px] text-slate-500 hover:text-slate-800"
              >
                ← Back
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold"
              >
                {isSubmitting ? 'Updating...' : 'Set New Password'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
