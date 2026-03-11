import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { getProfile } from '../services/api.js';
import { Tag } from '../components/Tag.jsx';
import { ShieldCheck, Edit } from 'lucide-react';

export function Profile() {
  const { user: contextUser, refreshUser } = useAuth();
  const [user, setUser] = useState(contextUser);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProfile()
      .then((r) => {
        if (r.data?.success && r.data.user) setUser(r.data.user);
      })
      .catch(() => setUser(contextUser))
      .finally(() => setLoading(false));
  }, []);

  const u = user || contextUser;
  const photo = u?.photo || u?.profilePicture;
  const prefs = u?.lifestylePreferences || {};
  const tags = [
    prefs.foodPreference && `Food: ${prefs.foodPreference}`,
    prefs.sleepSchedule && (prefs.sleepSchedule === 'early_sleeper' ? 'Early sleeper' : 'Night owl'),
    prefs.cleanlinessLevel && `Cleanliness: ${prefs.cleanlinessLevel}`,
    prefs.smoking !== undefined && prefs.smoking !== '' && `Smoking: ${prefs.smoking}`,
    prefs.pets !== undefined && prefs.pets !== '' && `Pets: ${prefs.pets}`,
    prefs.guestPolicy && `Guests: ${prefs.guestPolicy}`,
  ].filter(Boolean);

  if (loading) {
    return (
      <div className="flex-1 p-6 flex items-center justify-center bg-[#F7F8FC]">
        <p className="text-slate-500">Loading profile…</p>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 max-w-2xl mx-auto w-full bg-[#F7F8FC]">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Profile</h1>
        <Link
          to="/settings"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-medium text-sm hover:bg-slate-50 shadow-sm"
        >
          <Edit size={18} />
          Edit
        </Link>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="h-48 bg-gradient-to-br from-blue-50 to-slate-100" />
        <div className="px-6 pb-6 -mt-16 relative">
          <div className="flex items-end gap-4">
            <img
              src={photo || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop'}
              alt=""
              className="w-28 h-28 rounded-2xl border-4 border-white object-cover shadow-lg flex-shrink-0"
            />
            <div className="flex-1 min-w-0 pb-1">
              <h2 className="text-xl font-bold text-slate-900 truncate">{u?.name || 'No name'}</h2>
              {u?.age && <p className="text-slate-500">Age {u.age}</p>}
              {(u?.verificationStatus?.phoneVerified || u?.verificationStatus?.idVerified) && (
                <div className="flex items-center gap-1 mt-1 text-[#2F80ED]">
                  <ShieldCheck size={16} />
                  <span className="text-sm font-medium">Verified</span>
                </div>
              )}
            </div>
          </div>
          {u?.bio && (
            <p className="mt-4 text-slate-600 leading-relaxed">{u.bio}</p>
          )}
          {u?.city && (
            <p className="mt-2 text-sm text-slate-500">Location: {u.city}</p>
          )}
          {u?.trustScore != null && (
            <p className="mt-2 text-sm font-medium text-[#2F80ED]">Trust score: {u.trustScore}%</p>
          )}
          {tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {tags.map((t, i) => (
                <Tag key={i}>{t}</Tag>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
