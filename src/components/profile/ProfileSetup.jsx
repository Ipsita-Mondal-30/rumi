import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import {
  User,
  ChevronLeft,
  Camera,
  MapPin,
  Sliders,
  FileCheck,
  Upload,
} from 'lucide-react';
import { AuthLayout } from '../onboarding/AuthLayout.jsx';
import * as userApi from '../../api/userApi.js';

const LIFESTYLE_OPTIONS = [
  'Early bird',
  'Night owl',
  'Fitness',
  'Quiet',
  'Social',
  'Work from home',
  'Student',
  'Professional',
];
const GENDERS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'non_binary', label: 'Non-binary' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];
const INDIAN_CITIES = [
  'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune',
  'Ahmedabad', 'Jaipur', 'Lucknow', 'Chandigarh', 'Indore', 'Kochi', 'Goa',
];

export function ProfileSetup({ onComplete, onBack, initialUserId }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [profilePicture, setProfilePicture] = useState(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState('');
  const [bio, setBio] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [lifestyle, setLifestyle] = useState([]);
  const [budgetMin, setBudgetMin] = useState(5);
  const [budgetMax, setBudgetMax] = useState(25);
  const [verificationFile, setVerificationFile] = useState(null);
  const [verificationType, setVerificationType] = useState('aadhar');
  const fileInputRef = useRef(null);
  const verificationInputRef = useRef(null);

  const userId = initialUserId || localStorage.getItem('rumi_user_id');

  React.useEffect(() => {
    if (!userId && onBack) onBack();
  }, [userId, onBack]);

  if (!userId) return null;

  const toggleLifestyle = (item) => {
    setLifestyle((prev) =>
      prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]
    );
  };

  const handleProfilePhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProfilePicture(file);
    const reader = new FileReader();
    reader.onload = () => setProfilePicturePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleVerificationFile = (e) => {
    const file = e.target.files?.[0];
    if (file) setVerificationFile(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const location = { city, state, pincode };
      const preferences = {
        lifestyle,
        budgetMin: budgetMin * 1000,
        budgetMax: budgetMax * 1000,
      };
      let profilePictureUrl = '';
      if (profilePicture) {
        const photoRes = await userApi.uploadProfilePicture(userId, profilePicture);
        if (photoRes.user?.profilePicture) profilePictureUrl = photoRes.user.profilePicture;
      }
      await userApi.createProfile(userId, {
        bio,
        age: age ? parseInt(age, 10) : undefined,
        gender: gender || undefined,
        location,
        preferences,
        profilePicture: profilePictureUrl || undefined,
      });
      if (verificationFile) {
        await userApi.uploadVerification(userId, verificationFile, verificationType);
      }
      onComplete?.();
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Complete your profile"
      subtitle="Help others know you better and build trust."
      onBack={onBack}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2">
            {error}
          </div>
        )}

        {/* Profile picture */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Profile picture
          </label>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-24 h-24 rounded-full border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden bg-slate-50 hover:bg-slate-100 transition-colors"
            >
              {profilePicturePreview ? (
                <img
                  src={profilePicturePreview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <Camera className="text-slate-400" size={28} />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleProfilePhoto}
            />
            <span className="text-sm text-slate-500">Click to upload</span>
          </div>
        </div>

        {/* Bio */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="A short intro about you..."
            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:border-[#4E668A] focus:ring-2 focus:ring-[#4E668A]/10 outline-none resize-none text-slate-900 placeholder:text-slate-400"
            rows={3}
            maxLength={500}
          />
          <p className="text-xs text-slate-400 mt-1">{bio.length}/500</p>
        </div>

        {/* Age & gender */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Age</label>
            <input
              type="number"
              min={18}
              max={120}
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="18+"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:border-[#4E668A] outline-none text-slate-900 placeholder:text-slate-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Gender</label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:border-[#4E668A] outline-none text-slate-900"
            >
              <option value="">Select</option>
              {GENDERS.map((g) => (
                <option key={g.value} value={g.value}>
                  {g.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-1.5">
            <MapPin size={16} /> Location
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:border-[#4E668A] outline-none text-slate-900"
            >
              <option value="">City</option>
              {INDIAN_CITIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <input
              type="text"
              value={state}
              onChange={(e) => setState(e.target.value)}
              placeholder="State"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:border-[#4E668A] outline-none text-slate-900 placeholder:text-slate-400"
            />
            <input
              type="text"
              value={pincode}
              onChange={(e) => setPincode(e.target.value)}
              placeholder="Pincode"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:border-[#4E668A] outline-none text-slate-900 placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Lifestyle preferences */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-1.5">
            <Sliders size={16} /> Lifestyle
          </label>
          <div className="flex flex-wrap gap-2">
            {LIFESTYLE_OPTIONS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => toggleLifestyle(item)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  lifestyle.includes(item)
                    ? 'bg-[#4E668A] text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {/* Budget range */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
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

        {/* Verification upload */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-1.5">
            <FileCheck size={16} /> Verification (Aadhar / College ID)
          </label>
          <div className="flex flex-wrap gap-3 items-center">
            <select
              value={verificationType}
              onChange={(e) => setVerificationType(e.target.value)}
              className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:border-[#4E668A] outline-none text-slate-900 text-sm"
            >
              <option value="aadhar">Aadhar</option>
              <option value="college_id">College ID</option>
            </select>
            <button
              type="button"
              onClick={() => verificationInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 text-sm font-medium transition-colors"
            >
              <Upload size={16} />
              {verificationFile ? verificationFile.name : 'Choose file'}
            </button>
            <input
              ref={verificationInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.pdf"
              className="hidden"
              onChange={handleVerificationFile}
            />
          </div>
          <p className="text-xs text-slate-400 mt-1">JPG, PNG or PDF. Max 5MB.</p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving…' : 'Save profile'}
        </button>
      </form>
    </AuthLayout>
  );
}
