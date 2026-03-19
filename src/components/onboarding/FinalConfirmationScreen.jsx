import React from 'react';
import { AuthLayout } from './AuthLayout.jsx';
import { Sparkles, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

export function FinalConfirmationScreen({ onDashboard }) {
  return (
    <AuthLayout>
      <div className="text-center py-12">
        <motion.div
          initial={{ scale: 0, rotate: -45 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className="w-24 h-24 bg-gradient-to-br from-[#081A35] to-[#4E668A] rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-900/20"
        >
          <Sparkles size={48} className="text-white" />
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-2xl md:text-3xl font-bold text-slate-900 mb-3"
        >
          You're All Set!
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-slate-500 mb-10 max-w-xs mx-auto"
        >
          Start exploring compatible flatmates or list your room now.
        </motion.p>
        <motion.button
          type="button"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          onClick={onDashboard}
          className="w-full py-3.5 px-4 bg-[#081A35] text-white rounded-xl font-semibold hover:bg-[#081A35]/90 transition-all shadow-lg shadow-blue-900/10 flex items-center justify-center gap-2"
        >
          Go to Dashboard <ArrowRight size={18} />
        </motion.button>
      </div>
    </AuthLayout>
  );
}
