import React from 'react';
import { AuthLayout } from './AuthLayout';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

interface VerificationSuccessProps {
  onContinue: () => void;
}

export const VerificationSuccessScreen = ({ onContinue }: VerificationSuccessProps) => {
  return (
    <AuthLayout showSidebar={true}>
      <div className="text-center py-8">
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <CheckCircle2 size={48} className="text-green-500" />
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-2xl md:text-3xl font-bold text-slate-900 mb-3"
        >
          Account Verified Successfully
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-slate-500 mb-8 max-w-xs mx-auto"
        >
          You’re ready to set up your profile and find your perfect flatmate.
        </motion.p>
        
        <motion.button 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          onClick={onContinue}
          className="w-full py-3.5 px-4 bg-[#081A35] text-white rounded-xl font-semibold hover:bg-[#081A35]/90 transition-all shadow-lg shadow-blue-900/10 flex items-center justify-center gap-2"
        >
          Continue Setup <ArrowRight size={18} />
        </motion.button>
      </div>
    </AuthLayout>
  );
};
