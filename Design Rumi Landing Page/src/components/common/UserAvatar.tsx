import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

function firstLetter(name?: string) {
  const n = (name || '').trim();
  if (!n) return '?';
  return n[0].toUpperCase();
}

/**
 * Avatar that falls back to the first letter of the name when:
 * - src is empty, OR
 * - image fails to load (Radix Avatar shows fallback automatically).
 */
export function UserAvatar({
  name,
  src,
  className,
}: {
  name?: string;
  src?: string | null;
  className?: string;
}) {
  return (
    <Avatar className={className}>
      {src ? <AvatarImage src={src} alt={name || 'Avatar'} /> : null}
      <AvatarFallback className="bg-slate-100 text-slate-700 font-semibold">
        {firstLetter(name)}
      </AvatarFallback>
    </Avatar>
  );
}

