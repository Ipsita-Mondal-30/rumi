import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowRight, CheckCircle2 } from 'lucide-react';
import { AuthLayout } from './AuthLayout';
import { OTPScreen } from './OTPScreen';
import { motion } from 'motion/react';

interface ForgotPasswordProps {
  onBack: () => void;
  onComplete: () => void;
}

export const ForgotPasswordFlow = ({ onBack, onComplete }: ForgotPasswordProps) => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Step 1: Request Email
  if (step === 1) {
    return (
      <AuthLayout
        title="Reset Password"
        subtitle="Enter your email address and we'll send you a code to reset your password."
        onBack={onBack}
      >
        <form onSubmit={(e) => { e.preventDefault(); setStep(2); }}>
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
            className="w-full py-3.5 px-4 bg-[#081A35] text-white rounded-xl font-semibold hover:bg-[#081A35]/90 transition-all shadow-lg shadow-blue-900/10 flex items-center justify-center gap-2"
          >
            Send Reset Code <ArrowRight size={18} />
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
        email={email || "user@example.com"}
        onVerify={(code) => setStep(3)}
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
        <form onSubmit={(e) => { e.preventDefault(); onComplete(); }}>
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type={showPassword ? "text" : "password"}
                  placeholder="Create new password"
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
                  placeholder="Confirm new password"
                  className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:border-[#4E668A] focus:ring-4 focus:ring-[#4E668A]/10 transition-all outline-none text-slate-900 placeholder:text-slate-400"
                  required
                />
              </div>
            </div>
          </div>

          <button 
            type="submit"
            className="w-full py-3.5 px-4 bg-[#081A35] text-white rounded-xl font-semibold hover:bg-[#081A35]/90 transition-all shadow-lg shadow-blue-900/10"
          >
            Reset Password
          </button>
        </form>
      </AuthLayout>
    );
  }

  return null;
};
