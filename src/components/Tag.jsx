import React from 'react';

export function Tag({ children, className = '', variant = 'default' }) {
  const base = 'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium';
  const variants = {
    default: 'bg-slate-100 text-slate-700',
    primary: 'bg-blue-100 text-blue-700',
    lightBlue: 'bg-sky-100 text-sky-700',
    blueSolid: 'bg-[#2F80ED] text-white',
    success: 'bg-emerald-100 text-emerald-700',
    muted: 'bg-slate-50 text-slate-500',
  };
  return (
    <span className={`${base} ${variants[variant] || variants.default} ${className}`}>
      {children}
    </span>
  );
}
