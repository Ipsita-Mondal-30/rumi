import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { Mail, Lock, Eye, EyeOff, Home } from 'lucide-react';

export function Login() {
  const [email, setEmail] = useState('demo@rumi.com');
  const [password, setPassword] = useState('demo123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email.trim(), password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-md bg-white rounded-xl shadow-md p-8">
        {/* Logo - same as Signup */}
        <div className="flex items-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-lg bg-[#1e3a5f] flex items-center justify-center">
            <Home size={22} className="text-white" />
          </div>
          <span className="text-xl font-bold text-[#1e3a5f]">Rumi</span>
        </div>

        <h1 className="text-2xl font-bold text-slate-900 mb-1">Welcome back</h1>
        <p className="text-slate-600 text-sm mb-6">Enter your details to access your account.</p>

        {/* Social login - same style as Signup */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            type="button"
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" className="flex-shrink-0">
              <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6c1.52-1.4 2.4-3.46 2.4-5.91z"/>
              <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2c-.72.48-1.64.76-2.72.76-2.09 0-3.86-1.41-4.5-3.35H1.83v2.07C3.17 15.24 5.48 17 8.98 17z"/>
              <path fill="#FBBC05" d="M4.5 10.47c-.18-.54-.28-1.11-.28-1.7 0-.59.1-1.16.28-1.7V5.7H1.83A8.99 8.99 0 0 0 0 8.77c0 1.46.35 2.82.96 4.03l2.54-2.02z"/>
              <path fill="#EA4335" d="M8.98 4.18c1.18 0 2.23.4 3.06 1.2l2.3-2.3C12.95 1.7 11.14 1 8.98 1 5.48 1 3.17 2.76 1.83 5.7L4.37 7.77c.64-1.94 2.41-3.35 4.5-3.35z"/>
            </svg>
            Google
          </button>
          <button
            type="button"
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-slate-700 flex-shrink-0">
              <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
            </svg>
            Apple
          </button>
        </div>

        {/* Divider - same as Signup (OR REGISTER WITH EMAIL style) */}
        <div className="relative flex items-center gap-3 mb-6">
          <div className="flex-1 border-t border-slate-200" />
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Or sign in with email</span>
          <div className="flex-1 border-t border-slate-200" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 text-red-700 text-sm">{error}</div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-800 mb-1.5">Email or Phone Number</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                inputMode="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-blue-50 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f] focus:bg-blue-50/80 outline-none transition-colors"
                placeholder="Enter your email or phone"
                required
              />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-medium text-slate-800">Password</label>
              <Link to="#" className="text-sm font-medium text-[#1e3a5f] hover:underline">
                Forgot Password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-11 py-3 rounded-xl border border-slate-200 bg-blue-50 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f] focus:bg-blue-50/80 outline-none transition-colors"
                placeholder="Enter password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <p className="text-xs text-slate-500 text-center -mt-1">
            Demo: demo@rumi.com / demo123
          </p>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-md border-0 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <div className="mt-5 text-center">
          <button type="button" className="text-sm font-medium text-[#1e3a5f] hover:underline">
            Sign in with OTP
          </button>
        </div>

        <p className="mt-8 text-center text-sm text-slate-600">
          Don't have an account?{' '}
          <Link to="/signup" className="font-semibold text-[#1e3a5f] hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
