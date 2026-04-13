import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, Check, Facebook, Github } from 'lucide-react'; // Simulating Google/Apple with generic icons if needed, or text
import { AuthLayout } from './AuthLayout';
import { register } from '../../services/api';

// Mock icons for Google/Apple since they aren't in Lucide
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

interface SignupProps {
  onNext: (email: string) => void;
  onLogin: () => void;
  initialEmail?: string;
}

export const SignupScreen = ({ onNext, onLogin, initialEmail }: SignupProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [email, setEmail] = useState(initialEmail ?? '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    setError('');

    if (!agreed) return;
    if (!trimmed) return;
    if (!password) {
      setError('Password is required.');
      return;
    }
    if (confirmPassword !== password) {
      setError('Passwords do not match. Please re-enter your password.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await register({ email: trimmed, password, name: '' });
      if (!res?.data?.success) {
        setError(res?.data?.message || 'Failed to register.');
        return;
      }

      const token = res?.data?.token;
      const user = res?.data?.user;
      if (token) localStorage.setItem('rumi_token', token);
      if (user) localStorage.setItem('rumi_user', JSON.stringify(user));

      onNext(trimmed);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Registration failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Join Rumi to find compatible flatmates safely and easily."
      showSidebar={true}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-red-50 text-red-700 text-sm border border-red-100">
            {error}
          </div>
        )}
        {/* Social Login */}
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

        <div className="relative flex items-center gap-4 mb-6">
          <div className="h-px bg-slate-200 flex-1"></div>
          <span className="text-xs text-slate-400 font-medium uppercase">Or register with email</span>
          <div className="h-px bg-slate-200 flex-1"></div>
        </div>

        {/* Inputs */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Email or Phone Number</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Enter your email or phone"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:border-[#4E668A] focus:ring-4 focus:ring-[#4E668A]/10 transition-all outline-none text-slate-900 placeholder:text-slate-400"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type={showPassword ? "text" : "password"}
                  placeholder="Create password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError('');
                  }}
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
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type={showPassword ? "text" : "password"}
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (error) setError('');
                  }}
                  className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:border-[#4E668A] focus:ring-4 focus:ring-[#4E668A]/10 transition-all outline-none text-slate-900 placeholder:text-slate-400"
                  required
                />
              </div>
            </div>
          </div>
        </div>

        {/* Terms */}
        <div className="flex items-start gap-3 mt-4">
          <button 
            type="button"
            onClick={() => setAgreed(!agreed)}
            className={`flex-shrink-0 w-5 h-5 rounded border mt-0.5 flex items-center justify-center transition-colors ${agreed ? 'bg-[#081A35] border-[#081A35]' : 'bg-white border-slate-300'}`}
          >
            {agreed && <Check size={12} className="text-white" />}
          </button>
          <p className="text-xs text-slate-500 leading-relaxed">
            By creating an account, I agree to the <a href="#" className="text-[#081A35] font-semibold hover:underline">Terms of Service</a> and <a href="#" className="text-[#081A35] font-semibold hover:underline">Privacy Policy</a>.
          </p>
        </div>

        <button 
          type="submit"
          disabled={!agreed || submitting}
          className="w-full py-3.5 px-4 bg-[#081A35] text-white rounded-xl font-semibold hover:bg-[#081A35]/90 transition-all shadow-lg shadow-blue-900/10 mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Create Account
        </button>

        <p className="text-center text-sm text-slate-500 mt-6">
          Already have an account? <button type="button" onClick={onLogin} className="text-[#4E668A] font-semibold hover:underline">Sign in</button>
        </p>
      </form>
    </AuthLayout>
  );
};
