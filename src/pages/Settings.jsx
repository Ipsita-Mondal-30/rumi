import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { updateProfile } from '../services/api.js';

export function Settings() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({
    name: user?.name ?? '',
    age: user?.age ?? '',
    bio: user?.bio ?? '',
    city: user?.city ?? user?.location?.city ?? '',
    profession: user?.profession ?? '',
    budgetRange: user?.budgetRange ?? { min: '', max: '' },
    lifestylePreferences: user?.lifestylePreferences ?? {},
  });

  const handleChange = (path, value) => {
    if (path.includes('.')) {
      const [a, b] = path.split('.');
      setForm((prev) => ({
        ...prev,
        [a]: { ...prev[a], [b]: value },
      }));
    } else {
      setForm((prev) => ({ ...prev, [path]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      await updateProfile({
        name: form.name,
        age: form.age ? Number(form.age) : undefined,
        bio: form.bio,
        city: form.city,
        profession: form.profession || undefined,
        budgetRange: form.budgetRange.min || form.budgetRange.max
          ? { min: Number(form.budgetRange.min) || 0, max: Number(form.budgetRange.max) || 0 }
          : undefined,
        lifestylePreferences: form.lifestylePreferences,
      });
      await refreshUser();
      setMessage('Profile updated.');
      navigate('/dashboard/profile', { replace: true });
    } catch (err) {
      setMessage(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 p-8 max-w-2xl mx-auto w-full">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Settings</h1>
      <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-2xl p-6 shadow-sm">
        {message && (
          <p className={`text-sm ${message.includes('failed') ? 'text-red-600' : 'text-emerald-600'}`}>{message}</p>
        )}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#2F80ED]/20 focus:border-[#2F80ED] outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Age</label>
          <input
            type="number"
            min={18}
            max={120}
            value={form.age}
            onChange={(e) => handleChange('age', e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#2F80ED]/20 focus:border-[#2F80ED] outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
          <input
            type="text"
            value={form.city}
            onChange={(e) => handleChange('city', e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#2F80ED]/20 focus:border-[#2F80ED] outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Profession</label>
          <select
            value={form.profession}
            onChange={(e) => handleChange('profession', e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#2F80ED]/20 focus:border-[#2F80ED] outline-none"
          >
            <option value="">Select</option>
            <option value="student">Student</option>
            <option value="working">Working</option>
            <option value="WFH">WFH</option>
            <option value="hybrid">Hybrid</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Bio</label>
          <textarea
            value={form.bio}
            onChange={(e) => handleChange('bio', e.target.value)}
            rows={3}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#2F80ED]/20 focus:border-[#2F80ED] outline-none resize-none"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Budget min (₹/mo)</label>
            <input
              type="number"
              value={form.budgetRange.min}
              onChange={(e) => handleChange('budgetRange.min', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#2F80ED]/20 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Budget max (₹/mo)</label>
            <input
              type="number"
              value={form.budgetRange.max}
              onChange={(e) => handleChange('budgetRange.max', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#2F80ED]/20 outline-none"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </form>
    </div>
  );
}
