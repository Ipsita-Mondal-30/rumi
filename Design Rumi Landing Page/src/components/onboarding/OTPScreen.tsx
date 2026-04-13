import React, { useState, useEffect, useRef } from 'react';
import { AuthLayout } from './AuthLayout';
import { ArrowRight, RefreshCw, Edit2 } from 'lucide-react';

interface OTPScreenProps {
  onVerify: (code: string) => void | Promise<void>;
  onBack: () => void;
  email?: string;
  /** Called when user taps Resend (after cooldown). Should trigger a new code on the server. */
  onResend?: () => void | Promise<void>;
}

export const OTPScreen = ({
  onVerify,
  onBack,
  onResend,
  email = "user@example.com",
  title = "Verify Your Account",
  subtitle = "Enter the 6-digit code we sent to your email address.",
}: OTPScreenProps & { title?: string; subtitle?: string }) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [timer, setTimer] = useState(30);
  const [submitting, setSubmitting] = useState(false);
  const [resendBusy, setResendBusy] = useState(false);
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) return; // Only allow single char

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setLocalError('');

    // Auto focus next
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const data = e.clipboardData.getData('text').slice(0, 6).split('');
    const newOtp = [...otp];
    data.forEach((char, i) => {
      if (i < 6) newOtp[i] = char;
    });
    setOtp(newOtp);
    if (data.length < 6) {
      inputRefs.current[data.length]?.focus();
    } else {
      inputRefs.current[5]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < 6) {
      setLocalError('Please enter the full 6-digit code.');
      return;
    }
    setLocalError('');
    setSubmitting(true);
    try {
      await Promise.resolve(onVerify(code));
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      setLocalError(msg || (err instanceof Error ? err.message : 'Verification failed.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!onResend) {
      setTimer(30);
      return;
    }
    setResendBusy(true);
    setLocalError('');
    try {
      await Promise.resolve(onResend());
      setTimer(30);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      setLocalError(msg || 'Could not resend code.');
    } finally {
      setResendBusy(false);
    }
  };

  return (
    <AuthLayout
      title={title}
      subtitle={subtitle}
      onBack={onBack}
    >
      <div className="mb-8 p-3 bg-blue-50/50 rounded-lg flex items-center justify-between border border-blue-100">
        <span className="text-sm text-slate-600 font-medium">{email}</span>
        <button
          type="button"
          onClick={onBack}
          className="text-xs text-[#4E668A] font-bold hover:underline flex items-center gap-1"
        >
          <Edit2 size={12} /> Change
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {localError ? (
          <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            {localError}
          </p>
        ) : null}
        <div className="flex justify-between gap-2 mb-8">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el) as any}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              className="w-12 h-14 md:w-14 md:h-16 text-center text-2xl font-bold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#081A35] focus:ring-4 focus:ring-[#081A35]/10 transition-all outline-none text-slate-900"
            />
          ))}
        </div>

        <button 
          type="submit"
          disabled={submitting}
          className="w-full py-3.5 px-4 bg-[#081A35] text-white rounded-xl font-semibold hover:bg-[#081A35]/90 transition-all shadow-lg shadow-blue-900/10 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {submitting ? 'Verifying…' : (
            <>
              Verify & Continue <ArrowRight size={18} />
            </>
          )}
        </button>

        <div className="mt-6 text-center">
          {timer > 0 ? (
            <p className="text-slate-400 text-sm">
              Resend code in <span className="font-semibold text-slate-600">00:{timer.toString().padStart(2, '0')}</span>
            </p>
          ) : (
            <button 
              type="button" 
              onClick={() => void handleResend()}
              disabled={resendBusy}
              className="text-[#4E668A] font-semibold text-sm hover:underline flex items-center justify-center gap-2 mx-auto disabled:opacity-50"
            >
              <RefreshCw size={14} className={resendBusy ? 'animate-spin' : ''} />{' '}
              {resendBusy ? 'Sending…' : 'Resend Code'}
            </button>
          )}
        </div>
      </form>
    </AuthLayout>
  );
};
