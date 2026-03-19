import React from 'react';
import { motion } from 'motion/react';
import { User, ChevronLeft } from 'lucide-react';

interface AuthLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  onBack?: () => void;
  showSidebar?: boolean; // Kept for backward compatibility but ignored
}

export const AuthLayout = ({ children, title, subtitle, onBack }: AuthLayoutProps) => {
  return (
    <div className="min-h-screen w-full bg-white flex justify-center items-center">
      {/* Centered Form Area */}
      <div className="w-full max-w-2xl p-6 md:p-12 flex flex-col items-center relative">
        <div className="absolute top-8 left-8 md:left-12 flex items-center gap-2">
          <div className="bg-slate-900 p-1.5 rounded-lg">
            <User size={18} className="text-white" />
          </div>
          <span className="text-xl font-bold text-slate-900 tracking-tight">Rumi</span>
        </div>

        {onBack && (
          <button 
            onClick={onBack}
            className="absolute top-8 right-8 text-slate-400 hover:text-slate-600 transition-colors flex items-center gap-1"
          >
            <ChevronLeft size={20} />
            <span className="text-sm font-medium">Back</span>
          </button>
        )}

        <div className="max-w-md w-full mt-20 md:mt-12">
          {title && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-8 text-center"
            >
              <h1 className="text-3xl font-bold text-slate-900 mb-3">{title}</h1>
              {subtitle && <p className="text-slate-500">{subtitle}</p>}
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm"
          >
            {children}
          </motion.div>
        </div>
      </div>
    </div>
  );
};