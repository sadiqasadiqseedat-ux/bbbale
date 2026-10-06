import React, { useState } from 'react';
import { ShieldAlert, Lock, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { validatePasswordStrength } from '../../services/crypto';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onSuccess: () => void;
  canDismiss?: boolean;
  onDismiss?: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onSuccess,
  canDismiss = false,
  onDismiss
}) => {
  const { currentUser, changePassword } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const strength = validatePasswordStrength(newPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (newPassword !== confirmPassword) {
      setErrorMsg('New password and confirmation do not match.');
      return;
    }

    if (!strength.isValid) {
      setErrorMsg(strength.errors[0]);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await changePassword(currentPassword, newPassword);
      if (res.success) {
        onSuccess();
      } else {
        setErrorMsg(res.error || 'Failed to update password.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error updating password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 sm:p-8 space-y-6 border border-slate-300 animate-in fade-in zoom-in-95 duration-200">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-amber-100 text-amber-800 rounded-full flex items-center justify-center mx-auto border border-amber-300">
            <ShieldAlert className="w-6 h-6 text-amber-700" />
          </div>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-slate-900">
            Mandatory Security: Change Password
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            In accordance with Chambers Information Security Standards, you must establish a personalized, confidential password for <strong>{currentUser?.name}</strong> before accessing internal dockets.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Current / Temporary Setup Password: *
            </label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                required
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full p-3 rounded-lg border border-slate-300 pr-10 focus:outline-hidden focus:border-amber-600"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              New Confidential Password: *
            </label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="At least 8 characters with letters & numbers"
                className="w-full p-3 rounded-lg border border-slate-300 pr-10 focus:outline-hidden focus:border-amber-600"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Confirm New Password: *
            </label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Confirm exact new password"
                className="w-full p-3 rounded-lg border border-slate-300 pr-10 focus:outline-hidden focus:border-amber-600"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Password Requirements Checklist */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5 text-[11px]">
            <p className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Security Criteria:</p>
            <div className="flex items-center space-x-1.5">
              <span className={newPassword.length >= 8 ? 'text-emerald-600 font-bold' : 'text-slate-400'}>
                {newPassword.length >= 8 ? '✓' : '○'}
              </span>
              <span className={newPassword.length >= 8 ? 'text-slate-900 font-medium' : 'text-slate-500'}>
                Minimum 8 characters in length
              </span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className={/[A-Z]/.test(newPassword) ? 'text-emerald-600 font-bold' : 'text-slate-400'}>
                {/[A-Z]/.test(newPassword) ? '✓' : '○'}
              </span>
              <span className={/[A-Z]/.test(newPassword) ? 'text-slate-900 font-medium' : 'text-slate-500'}>
                At least one uppercase letter (A-Z)
              </span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className={/[a-z]/.test(newPassword) ? 'text-emerald-600 font-bold' : 'text-slate-400'}>
                {/[a-z]/.test(newPassword) ? '✓' : '○'}
              </span>
              <span className={/[a-z]/.test(newPassword) ? 'text-slate-900 font-medium' : 'text-slate-500'}>
                At least one lowercase letter (a-z)
              </span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className={/[0-9!@#$%^&*]/.test(newPassword) ? 'text-emerald-600 font-bold' : 'text-slate-400'}>
                {/[0-9!@#$%^&*]/.test(newPassword) ? '✓' : '○'}
              </span>
              <span className={/[0-9!@#$%^&*]/.test(newPassword) ? 'text-slate-900 font-medium' : 'text-slate-500'}>
                At least one number or symbol
              </span>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-2 border-t border-slate-200">
            {canDismiss && onDismiss && (
              <button
                type="button"
                onClick={onDismiss}
                className="px-4 py-2.5 border rounded-lg font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={isSubmitting || !strength.isValid || newPassword !== confirmPassword}
              className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-lg font-bold shadow-xs transition-colors flex items-center space-x-2"
            >
              <span>{isSubmitting ? 'Securing Account...' : 'Set Password & Enter Dashboard'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
