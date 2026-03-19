import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { AuthLayout } from '../components/onboarding/AuthLayout.jsx';
import { updateProfile, uploadProfilePhoto } from '../services/api.js';
import { User, MapPin, Camera } from 'lucide-react';

const INDIAN_CITIES = [
  'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune',
  'Ahmedabad', 'Jaipur', 'Lucknow', 'Chandigarh', 'Indore', 'Kochi', 'Goa',
];

const FOOD_OPTIONS = [
  { value: 'veg', label: 'Vegetarian' },
  { value: 'non-veg', label: 'Non-vegetarian' },
  { value: 'egg', label: 'Eggetarian' },
];

const CLEANLINESS_OPTIONS = [
  { value: 'low', label: 'Relaxed' },
  { value: 'medium', label: 'Moderate' },
  { value: 'high', label: 'Very tidy' },
];

const SLEEP_OPTIONS = [
  { value: 'early_sleeper', label: 'Early bird' },
  { value: 'night_owl', label: 'Night owl' },
];

const SMOKING_OPTIONS = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
];

const PROFESSION_OPTIONS = [
  { value: 'student', label: 'Student' },
  { value: 'working', label: 'Working' },
  { value: 'WFH', label: 'Work from home' },
  { value: 'hybrid', label: 'Hybrid' },
];

export function OnboardingProfile() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [city, setCity] = useState('');
  const [bio, setBio] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [foodPreference, setFoodPreference] = useState('');
  const [cleanlinessLevel, setCleanlinessLevel] = useState('');
  const [sleepSchedule, setSleepSchedule] = useState('');
  const [smoking, setSmoking] = useState('');
  const [profession, setProfession] = useState('');
  const [budgetMin, setBudgetMin] = useState(5);
  const [budgetMax, setBudgetMax] = useState(25);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const trimmedName = name.trim();
  const nameParts = trimmedName ? trimmedName.split(/\s+/).filter(Boolean) : [];
  const isFullNameValid = nameParts.length >= 2;
  const ageNum = age !== '' ? Number(age) : NaN;
  const isAgeValid = Number.isFinite(ageNum) && ageNum >= 18 && ageNum <= 120;

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!trimmedName) {
      setError('Full name is required.');
      return;
    }
    if (!isFullNameValid) {
      setError('Please enter your first and last name.');
      return;
    }
    if (!isAgeValid) {
      setError('Age must be between 18 and 120.');
      return;
    }

    try {
      setLoading(true);
      if (photoFile) {
        const okTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/gif'];
        if (!okTypes.includes(photoFile.type)) {
          setError('Profile photo must be an image (jpg/png/webp/gif).');
          return;
        }
        if (photoFile.size > 5 * 1024 * 1024) {
          setError('Profile photo must be smaller than 5MB.');
          return;
        }
        await uploadProfilePhoto(photoFile);
      }
      await updateProfile({
        name: trimmedName,
        age: ageNum,
        city: city.trim() || undefined,
        bio: bio.trim() || undefined,
        profession: profession || undefined,
        budgetRange: {
          min: budgetMin * 1000,
          max: budgetMax * 1000,
        },
        lifestylePreferences: {
          foodPreference: foodPreference || undefined,
          cleanlinessLevel: cleanlinessLevel || undefined,
          sleepSchedule: sleepSchedule || undefined,
          smoking: smoking || undefined,
        },
        profileCompleted: true,
      });
      await refreshUser?.();
      navigate('/onboarding/complete', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Complete your profile" subtitle="Add details so we can find compatible flatmates.">
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-3 rounded-xl bg-red-50 text-red-700 text-sm">{error}</div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Profile photo</label>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-24 h-24 rounded-full border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden bg-slate-50 hover:bg-slate-100 transition-colors"
            >
              {photoPreview ? (
                <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <Camera className="text-slate-400" size={28} />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoChange}
            />
            <span className="text-sm text-slate-500">Click to upload (optional)</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex Johnson"
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:border-[#4E668A] focus:ring-4 focus:ring-[#4E668A]/10 transition-all outline-none text-slate-900"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Age</label>
          <input
            type="number"
            min="18"
            max="120"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            placeholder="24"
            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:border-[#4E668A] focus:ring-4 focus:ring-[#4E668A]/10 transition-all outline-none text-slate-900"
          />
        </div>

        <div>
          <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 mb-1.5">
            <MapPin size={16} /> City
          </label>
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:border-[#4E668A] outline-none text-slate-900"
          >
            <option value="">Select city</option>
            {INDIAN_CITIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Short bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="A bit about yourself and what you're looking for..."
            rows={3}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:border-[#4E668A] focus:ring-4 focus:ring-[#4E668A]/10 transition-all outline-none text-slate-900 resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Food preference</label>
          <div className="flex flex-wrap gap-2">
            {FOOD_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setFoodPreference(opt.value)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  foodPreference === opt.value ? 'bg-[#4E668A] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Cleanliness</label>
          <select
            value={cleanlinessLevel}
            onChange={(e) => setCleanlinessLevel(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:border-[#4E668A] outline-none text-slate-900"
          >
            <option value="">Select</option>
            {CLEANLINESS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Sleep schedule</label>
          <div className="flex flex-wrap gap-2">
            {SLEEP_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setSleepSchedule(opt.value)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  sleepSchedule === opt.value ? 'bg-[#4E668A] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Smoking</label>
          <div className="flex flex-wrap gap-2">
            {SMOKING_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setSmoking(opt.value)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  smoking === opt.value ? 'bg-[#4E668A] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Working status</label>
          <select
            value={profession}
            onChange={(e) => setProfession(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:border-[#4E668A] outline-none text-slate-900"
          >
            <option value="">Select</option>
            {PROFESSION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Budget (₹/month) — ₹{budgetMin}k – ₹{budgetMax}k
          </label>
          <div className="space-y-2">
            <input
              type="range"
              min="3"
              max="50"
              value={budgetMin}
              onChange={(e) => {
                const v = Number(e.target.value);
                setBudgetMin(v);
                if (budgetMax < v) setBudgetMax(v);
              }}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#4E668A]"
            />
            <input
              type="range"
              min="3"
              max="50"
              value={budgetMax}
              onChange={(e) => {
                const v = Number(e.target.value);
                setBudgetMax(v);
                if (budgetMin > v) setBudgetMin(v);
              }}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#4E668A]"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !isFullNameValid || !isAgeValid}
          className="w-full py-3.5 px-4 bg-[#081A35] text-white rounded-xl font-semibold hover:bg-[#081A35]/90 transition-all shadow-lg shadow-blue-900/10 mt-6 disabled:opacity-50"
        >
          {loading ? 'Saving…' : 'Continue'}
        </button>
      </form>
    </AuthLayout>
  );
}
