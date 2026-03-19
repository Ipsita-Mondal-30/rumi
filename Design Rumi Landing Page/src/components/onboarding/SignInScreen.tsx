import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { AuthLayout } from './AuthLayout';
import { OTPScreen } from './OTPScreen';
import { login, sendOtp, verifyOtp } from '../../services/api';

// Mock icons
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path
      fill="currentColor"
      d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27 3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10 5.35 0 9.25-3.67 9.25-9.09 0-1.15-.15-1.81-.15-1.81z"
    />
  </svg>
);

const AppleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path
      fill="currentColor"
      d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.74s2.57-.9 4.35-.82c1.81.08 3.16.88 4.02 2.12-3.8 1.9-3.2 6.94.6 8.52-.36 1.1-1.28 3.07-2.67 4.54-.7.69-1.38 1.38-1.38 1.38zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"
    />
  </svg>
);

interface SignInProps {
  onLoginSuccess: (email: string) => void;
  onForgotPassword: () => void;
  onSignup: () => void;
}

export const SignInScreen = ({ onLoginSuccess, onForgotPassword, onSignup }: SignInProps) => {
  const [mode, setMode] = useState<'password' | 'otp-request' | 'otp-verify'>('password');
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (mode === 'password') {
      try {
        setSubmitting(true);
        const res = await login({ email: email.trim(), password });
        const token = res?.data?.token;
        const user = res?.data?.user;
        if (token) localStorage.setItem('rumi_token', token);
        if (user) localStorage.setItem('rumi_user', JSON.stringify(user));
        onLoginSuccess(email.trim());
      } catch (err: any) {
        setError(err?.response?.data?.message || err?.message || 'Login failed.');
      } finally {
        setSubmitting(false);
      }
    } else if (mode === 'otp-request') {
      try {
        setSubmitting(true);
        await sendOtp({ email: email.trim() });
        setMode('otp-verify');
      } catch (err: any) {
        setError(err?.response?.data?.message || err?.message || 'OTP request failed.');
      } finally {
        setSubmitting(false);
      }
    }
  };

  if (mode === 'otp-verify') {
    return (
      <OTPScreen 
        title="Verify Login"
        subtitle="Enter the 6-digit code sent to your device to log in."
        email={email || "user@example.com"}
        onVerify={async (code) => {
          try {
            setSubmitting(true);
            const res = await verifyOtp({ email: email.trim(), code });
            const token = res?.data?.token;
            const user = res?.data?.user;
            if (token) localStorage.setItem('rumi_token', token);
            if (user) localStorage.setItem('rumi_user', JSON.stringify(user));
            onLoginSuccess((email || '').trim() || 'user@example.com');
          } catch (err: any) {
            setError(err?.response?.data?.message || err?.message || 'OTP verification failed.');
          } finally {
            setSubmitting(false);
          }
        }}
        onBack={() => setMode('otp-request')}
      />
    );
  }

  return (
    <AuthLayout
      title={mode === 'password' ? "Welcome back" : "Sign in with OTP"}
      subtitle={mode === 'password' ? "Enter your details to access your account." : "We'll send a verification code to your email or phone."}
      onBack={mode === 'otp-request' ? () => setMode('password') : undefined}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-red-50 text-red-700 text-sm border border-red-100">
            {error}
          </div>
        )}
        {mode === 'password' && (
          <div className="grid grid-cols-2 gap-4 mb-6">
            <button type="button" className="flex items-center justify-center gap-2 py-2.5 px-4 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-slate-700 font-medium text-sm">
              <GoogleIcon />
              <span>Google</span>
            </button>
            <button type="button" className="flex items-center justify-center gap-2 py-2.5 px-4 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-slate-700 font-medium text-sm">
              <AppleIcon />
              <span>Apple</span>
            </button>
          </div>
        )}

        {mode === 'password' && (
          <div className="relative flex items-center gap-4 mb-6">
            <div className="h-px bg-slate-200 flex-1"></div>
            <span className="text-xs text-slate-400 font-medium uppercase">Or sign in with email</span>
            <div className="h-px bg-slate-200 flex-1"></div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Email or Phone Number</label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email or phone"
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:border-[#4E668A] focus:ring-4 focus:ring-[#4E668A]/10 transition-all outline-none text-slate-900 placeholder:text-slate-400"
              required
            />
          </div>
        </div>

        {mode === 'password' && (
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-sm font-medium text-slate-700">Password</label>
              <button 
                type="button" 
                onClick={onForgotPassword}
                className="text-xs text-[#4E668A] font-semibold hover:underline"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type={showPassword ? "text" : "password"}
                placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:border-[#4E668A] focus:ring-4 focus:ring-[#4E668A]/10 transition-all outline-none text-slate-900 placeholder:text-slate-400"
                required
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
        )}

        <button 
          type="submit"
          disabled={submitting}
          className="w-full py-3.5 px-4 bg-[#081A35] text-white rounded-xl font-semibold hover:bg-[#081A35]/90 transition-all shadow-lg shadow-blue-900/10 mt-6 flex items-center justify-center gap-2"
        >
          {mode === 'password' ? 'Sign In' : 'Send Code'} {mode === 'otp-request' && <ArrowRight size={18} />}
        </button>

        <div className="space-y-4 mt-6 text-center">
          {mode === 'password' ? (
             <button 
               type="button" 
               onClick={() => setMode('otp-request')}
               className="text-[#081A35] font-semibold text-sm hover:underline"
             >
               Sign in with OTP
             </button>
          ) : (
            <button 
               type="button" 
               onClick={() => setMode('password')}
               className="text-[#081A35] font-semibold text-sm hover:underline"
             >
               Sign in with Password
             </button>
          )}

          <p className="text-sm text-slate-500">
            Don't have an account? <button type="button" onClick={onSignup} className="text-[#4E668A] font-semibold hover:underline">Sign up</button>
          </p>
        </div>
      </form>
    </AuthLayout>
  );
};
