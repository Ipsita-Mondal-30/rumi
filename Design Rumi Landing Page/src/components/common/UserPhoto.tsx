import React, { useState } from 'react';

function firstLetter(name?: string) {
  const n = (name || '').trim();
  if (!n) return '?';
  return n[0].toUpperCase();
}

/**
 * Large photo (e.g. profile card cover) that falls back to an initial block
 * when src is missing or fails to load.
 */
export function UserPhoto({
  name,
  src,
  className,
}: {
  name?: string;
  src?: string | null;
  className?: string;
}) {
  const [errored, setErrored] = useState(false);
  const showFallback = !src || errored;

  if (showFallback) {
    return (
      <div
        className={`w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-slate-700 ${className || ''}`}
      >
        <span className="text-5xl font-bold tracking-tight">{firstLetter(name)}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name || 'Photo'}
      className={className}
      onError={() => setErrored(true)}
    />
  );
}

