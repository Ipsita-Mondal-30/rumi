import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { AuthLayout } from './AuthLayout';
import { OTPScreen } from './OTPScreen';
import {
  requestPasswordReset,
  verifyPasswordResetCode,
  confirmPasswordReset,
} from '../../services/api';

interface ForgotPasswordProps {
  onBack: () => void;
  onComplete: () => void;
}

/** Match login/register: emails are lowercased; phone unchanged. */
function normalizeResetIdentifier(raw: string) {
  const t = raw.trim();
  if (!t.includes('@')) return t;
  return t.toLowerCase();
}

export const ForgotPasswordFlow = ({ onBack, onComplete }: ForgotPasswordProps) => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [step1Error, setStep1Error] = useState('');
  const [step1Loading, setStep1Loading] = useState(false);
  const [step3Error, setStep3Error] = useState('');
  const [step3Loading, setStep3Loading] = useState(false);

  // Step 1: Request Email
  if (step === 1) {
    return (
      <AuthLayout
        title="Reset Password"
        subtitle="Enter your email address and we'll send you a code to reset your password."
        onBack={onBack}
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setStep1Error('');
            setStep1Loading(true);
            try {
              await requestPasswordReset({ email: normalizeResetIdentifier(email) });
              setStep(2);
            } catch (err: unknown) {
              const msg =
                err && typeof err === 'object' && 'response' in err
                  ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
                  : undefined;
              setStep1Error(msg || 'Could not send reset code. Try again.');
            } finally {
              setStep1Loading(false);
            }
          }}
        >
          {step1Error ? (
            <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {step1Error}
            </p>
          ) : null}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Email or Phone Number</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:border-[#4E668A] focus:ring-4 focus:ring-[#4E668A]/10 transition-all outline-none text-slate-900 placeholder:text-slate-400"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={step1Loading}
            className="w-full py-3.5 px-4 bg-[#081A35] text-white rounded-xl font-semibold hover:bg-[#081A35]/90 transition-all shadow-lg shadow-blue-900/10 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {step1Loading ? (
              'Sending…'
            ) : (
              <>
                Send Reset Code <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>
      </AuthLayout>
    );
  }

  // Step 2: OTP Verification
  if (step === 2) {
    return (
      <OTPScreen
        title="Verify It's You"
        subtitle="Enter the code sent to your email to reset your password."
        email={normalizeResetIdentifier(email) || 'user@example.com'}
        onVerify={async (code) => {
          const res = await verifyPasswordResetCode({
            email: normalizeResetIdentifier(email),
            code,
          });
          const token = res.data?.resetToken;
          if (!token) {
            throw new Error('No reset token returned.');
          }
          setResetToken(token);
          setStep(3);
        }}
        onResend={async () => {
          await requestPasswordReset({ email: normalizeResetIdentifier(email) });
        }}
        onBack={() => setStep(1)}
      />
    );
  }

  // Step 3: New Password
  if (step === 3) {
    return (
      <AuthLayout
        title="Create New Password"
        subtitle="Your new password must be different from previous used passwords."
        onBack={() => setStep(2)}
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setStep3Error('');
            if (newPassword !== confirmPassword) {
              setStep3Error('Passwords do not match.');
              return;
            }
            if (newPassword.length < 6) {
              setStep3Error('Password must be at least 6 characters.');
              return;
            }
            setStep3Loading(true);
            try {
              if (!resetToken?.trim()) {
                setStep3Error('Your reset session expired. Go back and request a new code.');
                return;
              }
              await confirmPasswordReset({ resetToken: resetToken.trim(), newPassword });
              localStorage.removeItem('rumi_token');
              localStorage.removeItem('rumi_user');
              onComplete();
            } catch (err: unknown) {
              const msg =
                err && typeof err === 'object' && 'response' in err
                  ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
                  : undefined;
              setStep3Error(
                msg || 'Could not update password. Request a new code from the previous step.'
              );
            } finally {
              setStep3Loading(false);
            }
          }}
        >
          {step3Error ? (
            <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {step3Error}
            </p>
          ) : null}
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Create new password"
                  className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:border-[#4E668A] focus:ring-4 focus:ring-[#4E668A]/10 transition-all outline-none text-slate-900 placeholder:text-slate-400"
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:border-[#4E668A] focus:ring-4 focus:ring-[#4E668A]/10 transition-all outline-none text-slate-900 placeholder:text-slate-400"
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={step3Loading}
            className="w-full py-3.5 px-4 bg-[#081A35] text-white rounded-xl font-semibold hover:bg-[#081A35]/90 transition-all shadow-lg shadow-blue-900/10 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {step3Loading ? 'Updating…' : 'Reset Password'}
          </button>
        </form>
      </AuthLayout>
    );
  }

  return null;
};
