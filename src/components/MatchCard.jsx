import React from 'react';
import { Tag } from './Tag.jsx';
import { DollarSign, X, Heart } from 'lucide-react';

export function MatchCard({ profile, matchScore = 0, reasons = [], onConnect, onSkip, loading }) {
  const photo = profile?.photo || profile?.profilePicture || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop';
  const name = profile?.name || 'Unknown';
  const age = profile?.age ?? '';
  const bio = profile?.bio || 'No bio yet.';
  const budget = profile?.budgetRange
    ? `₹${profile.budgetRange.min || 0}-${profile.budgetRange.max || 0}k`
    : profile?.preferences?.budgetMin != null
    ? `₹${(profile.preferences.budgetMin / 1000).toFixed(0)}k–₹${(profile.preferences.budgetMax / 1000).toFixed(0)}k/mo`
    : '—';
  const tags = profile?.lifestylePreferences
    ? [
        profile.lifestylePreferences.foodPreference && `Food: ${profile.lifestylePreferences.foodPreference}`,
        profile.lifestylePreferences.sleepSchedule && (profile.lifestylePreferences.sleepSchedule === 'early_sleeper' ? 'Early riser' : 'Night owl'),
        profile.lifestylePreferences.cleanlinessLevel && `Clean: ${profile.lifestylePreferences.cleanlinessLevel}`,
        profile.lifestylePreferences.smoking === 'no' && 'Non-smoker',
        profile.lifestylePreferences.guestPolicy && `Guests: ${profile.lifestylePreferences.guestPolicy}`,
      ].filter(Boolean)
    : [];

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-200 max-w-md w-full flex flex-col max-h-[520px]">
      <div className="relative h-52 flex-shrink-0 bg-slate-100">
        <img
          src={typeof photo === 'string' && photo.startsWith('http') ? photo : photo || undefined}
          alt={name}
          className="w-full h-full object-cover"
          onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop'; }}
        />
        <div className="absolute top-3 right-3 bg-[#2F80ED] text-white px-3 py-1.5 rounded-full font-semibold text-sm shadow-lg">
          {matchScore}% Match
        </div>
      </div>
      <div className="p-4 flex-1 min-h-0 flex flex-col overflow-hidden">
        <h3 className="text-xl font-semibold text-slate-900 truncate">
          {name}{age ? `, ${age}` : ''}
        </h3>
        <p className="text-sm text-slate-600 mt-0.5 line-clamp-2 leading-snug">{bio}</p>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {tags.slice(0, 4).map((t, i) => (
              <Tag key={i} variant="blueSolid">{t}</Tag>
            ))}
          </div>
        )}
        <div className="flex items-center gap-1.5 mt-2 text-slate-700">
          <DollarSign size={16} className="text-slate-600 flex-shrink-0" />
          <span className="font-medium text-sm">Budget: {budget}/month</span>
        </div>
      </div>
      <div className="p-4 border-t border-slate-100 space-y-3">
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onSkip}
            disabled={loading}
            className="flex-1 py-3 rounded-xl font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 transition-colors"
          >
            Skip
          </button>
          <button
            type="button"
            onClick={onConnect}
            disabled={loading}
            className="flex-1 py-3 rounded-xl font-semibold text-white bg-[#2F80ED] hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-md"
          >
            {loading ? 'Sending…' : 'Connect'}
          </button>
        </div>
        <div className="flex justify-center gap-8 pt-1">
          <button
            type="button"
            onClick={onSkip}
            disabled={loading}
            className="w-14 h-14 rounded-full border-2 border-red-400 bg-red-50 text-red-500 flex items-center justify-center shadow-md hover:bg-red-100 hover:border-red-500 disabled:opacity-50 transition-colors"
            aria-label="Skip"
          >
            <X size={26} strokeWidth={2.5} />
          </button>
          <button
            type="button"
            onClick={onConnect}
            disabled={loading}
            className="w-14 h-14 rounded-full bg-[#2F80ED] text-white flex items-center justify-center shadow-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
            aria-label="Connect"
          >
            <Heart size={26} strokeWidth={2} fill="currentColor" />
          </button>
        </div>
      </div>
    </div>
  );
}
