import React, { useRef, useState } from 'react';
import { AuthLayout } from './AuthLayout';
import { User, MapPin, Camera, DollarSign, Moon, Sun, Coffee, Wine, Users, ArrowRight, ArrowLeft, Home, Search, Compass } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getProfile, updateProfile, uploadProfilePhoto } from '../../services/api';

interface ProfileSetupProps {
  onComplete: () => void;
}

export const ProfileSetupFlow = ({ onComplete }: ProfileSetupProps) => {
  const [step, setStep] = useState(1);
  const totalSteps = 3;

  const [formError, setFormError] = useState<string>('');

  const [submitting, setSubmitting] = useState(false);

  // Step 1 state (photo + basic profile fields)
  const [fullName, setFullName] = useState<string>('');
  const [age, setAge] = useState<string>('');
  const [gender, setGender] = useState<string>('');
  const [location, setLocation] = useState<string>('');

  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const trimmedName = fullName.trim();
  const nameParts = trimmedName ? trimmedName.split(/\s+/).filter(Boolean) : [];
  const ageNum = age === '' ? NaN : Number(age);
  const isStep1Valid =
    nameParts.length >= 2 &&
    Number.isFinite(ageNum) &&
    ageNum >= 18 &&
    ageNum <= 120 &&
    (Boolean(photoFile) || Boolean(photoPreview));

  // Step 2 state (preferences used for compatibility scoring)
  const [budget, setBudget] = useState<number>(1200);
  const [cleanliness, setCleanliness] = useState<string>('Tidy');
  const [sleepSchedule, setSleepSchedule] = useState<string>('Flexible');
  const [smoking, setSmoking] = useState<string>('Non-Smoker');
  const [guests, setGuests] = useState<string>('Occasionally');
  const [foodPreference, setFoodPreference] = useState<string>('Veg');
  const [profession, setProfession] = useState<string>('Student');

  const [intent, setIntent] = useState<string | null>(null);
  const [bioText, setBioText] = useState<string>('');

  const ROOMMATE_NOTE = "I'm looking for a roommate.";

  const composeBio = () => {
    const trimmed = bioText.trim();
    let base = trimmed;
    if (!base && intent) {
      // Fallback to intent if user didn't write a description.
      if (intent === 'find') base = "I'm looking for a room.";
      if (intent === 'offer') base = "I can offer a room.";
      if (intent === 'explore') base = "Just exploring for now.";
    }
    if (!base) return ROOMMATE_NOTE;
    // If user already mentions roommate, keep their text.
    if (/roommate/i.test(base)) return base;
    return `${ROOMMATE_NOTE}\n${base}`.slice(0, 500);
  };

  const mapGender = (g: string) => (g === 'non-binary' ? 'non_binary' : g || '');
  const mapCleanliness = (c: string) => (c === 'Sparkling' ? 'high' : c === 'Tidy' ? 'medium' : c === 'Moderate' ? 'medium' : c === 'Relaxed' ? 'low' : '');
  const mapSleep = (s: string) => (s === 'Early Bird' ? 'early_sleeper' : s === 'Night Owl' ? 'night_owl' : '');
  const mapSmoking = (s: string) => {
    if (s === 'Non-Smoker') return 'no';
    if (s === 'Social Smoker') return 'yes';
    if (s === 'Never') return 'no';
    return '';
  };
  const mapFood = (f: string) => (f === 'Veg' ? 'veg' : f === 'Non-Veg' ? 'non-veg' : f === 'Egg' ? 'egg' : '');
  const mapProfession = (p: string) => (p === 'Student' ? 'student' : p === 'Working' ? 'working' : p === 'WFH' ? 'WFH' : p === 'Hybrid' ? 'hybrid' : '');
  const mapGuestPolicy = (g: string) => (g === 'Rarely' ? 'not_allowed' : g === 'Occasionally' ? 'limited' : g === 'Weekends' ? 'limited' : g === 'Often' ? 'allowed' : '');
  const mapBudgetRange = (b: number) => {
    // Design budget slider is "₹{budget}/mo". Backend expects raw numbers, and main app stores in rupees.
    // We keep consistency by converting slider value to a rupees-range around it.
    const base = Math.round(b * 10); // e.g. 1200 -> 12000
    const min = Math.round(base * 0.9 / 100) * 100;
    const max = Math.round(base * 1.1 / 100) * 100;
    return { min, max };
  };

  const submitProfile = async () => {
    setFormError('');
    const trimmedName = fullName.trim();
    if (!isStep1Valid) {
      setFormError('Please enter a valid name and age (18-120).');
      return;
    }
    if (!location.trim()) {
      setFormError('Location is required.');
      return;
    }

    const ageNumLocal = Number(age);
    const { min: budgetMin, max: budgetMax } = mapBudgetRange(budget);

    setSubmitting(true);
    try {
      await updateProfile({
        name: trimmedName,
        age: ageNumLocal,
        gender: mapGender(gender),
        city: location.trim(),
        profession: mapProfession(profession),
        budgetRange: { min: budgetMin, max: budgetMax },
        bio: composeBio(),
        lifestylePreferences: {
          foodPreference: mapFood(foodPreference),
          sleepSchedule: mapSleep(sleepSchedule),
          cleanlinessLevel: mapCleanliness(cleanliness),
          smoking: mapSmoking(smoking),
          drinking: '',
          pets: '',
          guestPolicy: mapGuestPolicy(guests),
        },
        profileCompleted: true,
      });

      if (photoFile) {
        await uploadProfilePhoto(photoFile);
      }

      onComplete();
    } catch (err: any) {
      setFormError(err?.response?.data?.message || err?.message || 'Failed to save profile.');
    } finally {
      setSubmitting(false);
    }
  };

  const nextStep = () => {
    if (submitting) return;
    if (step === 1) {
      if (!trimmedName) {
        setFormError('Full name is required.');
        return;
      }
      if (nameParts.length < 2) {
        setFormError('Please enter at least first name and last name.');
        return;
      }
      if (!photoFile && !photoPreview) {
        setFormError('Please upload a profile photo.');
        return;
      }
      if (!Number.isFinite(ageNum) || ageNum < 18 || ageNum > 120) {
        setFormError('Age must be between 18 and 120.');
        return;
      }
    }

    setFormError('');
    if (step < totalSteps) setStep(step + 1);
    else submitProfile();
  };

  React.useEffect(() => {
    // Prefill data for editing from backend.
    const run = async () => {
      try {
        const res = await getProfile();
        const u = res?.data?.user;
        if (!u) return;

        setFullName(u?.name ?? '');
        setAge(u?.age != null ? String(u.age) : '');

        const mappedGender =
          u?.gender === 'non_binary' ? 'non-binary' : u?.gender || '';
        setGender(mappedGender === 'non-binary' ? 'non-binary' : mappedGender);

        setLocation(u?.city || u?.location?.city || '');

        const existingPhoto = u?.photo || u?.profilePicture || '';
        if (existingPhoto) {
          setPhotoPreview(existingPhoto);
        }

        if (u?.budgetRange?.min != null && u?.budgetRange?.max != null) {
          const base = (Number(u.budgetRange.min) + Number(u.budgetRange.max)) / 2;
          const slider = Math.round(base / 10);
          setBudget(Math.min(5000, Math.max(500, slider)));
        }

        const prefs = u?.lifestylePreferences || {};
        if (prefs?.cleanlinessLevel === 'high') setCleanliness('Sparkling');
        else if (prefs?.cleanlinessLevel === 'medium') setCleanliness('Tidy');
        else if (prefs?.cleanlinessLevel === 'low') setCleanliness('Relaxed');

        if (prefs?.sleepSchedule === 'early_sleeper') setSleepSchedule('Early Bird');
        else if (prefs?.sleepSchedule === 'night_owl') setSleepSchedule('Night Owl');
        else setSleepSchedule('Flexible');

        if (prefs?.foodPreference === 'veg') setFoodPreference('Veg');
        else if (prefs?.foodPreference === 'non-veg') setFoodPreference('Non-Veg');
        else if (prefs?.foodPreference === 'egg') setFoodPreference('Egg');

        if (prefs?.smoking === 'yes') setSmoking('Social Smoker');
        else setSmoking('Non-Smoker');

        if (u?.profession === 'student') setProfession('Student');
        else if (u?.profession === 'working') setProfession('Working');
        else if (u?.profession === 'WFH') setProfession('WFH');
        else if (u?.profession === 'hybrid') setProfession('Hybrid');

        if (prefs?.guestPolicy === 'allowed') setGuests('Often');
        else if (prefs?.guestPolicy === 'not_allowed') setGuests('Rarely');
        else setGuests('Occasionally');

        const incomingBio = u?.bio || '';
        const withoutNote = incomingBio.replace(/^I['’]m looking for a roommate\.\n?/i, '').trim();
        setBioText(withoutNote);
      } catch {
        // ignore; user might not be authenticated yet.
      }
    };
    // Only attempt to prefill if a token exists.
    if (localStorage.getItem('rumi_token')) run();
  }, []);

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  // --- Step Components ---

  const renderStep1Basic = () => (
    <div className="space-y-6">
      {formError && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-4 py-2">
          {formError}
        </div>
      )}
      <div className="flex flex-col items-center mb-8">
        <div
          role="button"
          tabIndex={0}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click();
          }}
          className="relative w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center border-2 border-dashed border-slate-300 cursor-pointer hover:bg-slate-50 transition-colors group overflow-hidden"
        >
          {photoPreview ? (
            <img src={photoPreview} alt="Profile preview" className="w-full h-full object-cover" />
          ) : (
            <Camera size={24} className="text-slate-400 group-hover:text-slate-600" />
          )}
          <div className="absolute bottom-0 right-0 bg-[#081A35] p-2 rounded-full text-white border-2 border-white">
             <div className="text-[10px] font-bold">+</div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;

              const okTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
              if (!okTypes.includes(file.type)) {
                setFormError('Please upload a valid image file.');
                return;
              }
              if (file.size > 5 * 1024 * 1024) {
                setFormError('Image size must be under 5MB.');
                return;
              }

              setFormError('');
              setPhotoFile(file);
              const reader = new FileReader();
              reader.onload = () => setPhotoPreview(String(reader.result || ''));
              reader.readAsDataURL(file);
            }}
          />
        </div>
        <span className="text-xs text-slate-500 mt-2">Upload Profile Photo</span>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
        <div className="relative">
          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="e.g. Alex Johnson"
            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:border-[#4E668A] focus:ring-4 focus:ring-[#4E668A]/10 transition-all outline-none"
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value);
              if (formError) setFormError('');
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Age</label>
          <input 
            type="number" 
            placeholder="24"
            min={18}
            max={120}
            value={age}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:border-[#4E668A] focus:ring-4 focus:ring-[#4E668A]/10 transition-all outline-none"
            onChange={(e) => {
              setAge(e.target.value);
              if (formError) setFormError('');
            }}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Gender</label>
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:border-[#4E668A] focus:ring-4 focus:ring-[#4E668A]/10 transition-all outline-none text-slate-700 appearance-none"
          >
            <option value="">Select</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="non-binary">Non-binary</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Location</label>
        <div className="relative">
          <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="City or Neighborhood"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:border-[#4E668A] focus:ring-4 focus:ring-[#4E668A]/10 transition-all outline-none"
          />
        </div>
      </div>
    </div>
  );

  const Step2Lifestyle = () => {

    const PillGroup = ({ label, options, selected, onSelect }: { label: string, options: string[], selected: string, onSelect: (val: string) => void }) => (
      <div className="mb-5">
        <label className="block text-sm font-medium text-slate-700 mb-2">{label}</label>
        <div className="flex flex-wrap gap-2">
          {options.map((opt, i) => (
            <button 
              key={i} 
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                selected === opt 
                  ? 'bg-[#081A35] text-white border-[#081A35] shadow-md' 
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400 hover:bg-slate-50'
              }`}
              onClick={(e) => { e.preventDefault(); onSelect(opt); }}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
    );

    return (
      <div className="space-y-1">
        <div className="mb-6">
          <label className="flex text-sm font-medium text-slate-700 mb-2 justify-between">
            <span>Budget Range</span>
            <span className="text-[#081A35] font-bold">₹{budget}/mo</span>
          </label>
          <div className="relative pt-2">
            <input 
              type="range" 
              min="500" 
              max="5000" 
              step="100"
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#081A35]"
            />
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>₹500</span>
              <span>₹5k+</span>
            </div>
          </div>
        </div>

        <PillGroup 
          label="Cleanliness" 
          options={["Sparkling", "Tidy", "Moderate", "Relaxed"]} 
          selected={cleanliness}
          onSelect={setCleanliness}
        />
        <PillGroup 
          label="Sleep Schedule" 
          options={["Early Bird", "Night Owl", "Flexible"]} 
          selected={sleepSchedule}
          onSelect={setSleepSchedule}
        />
        <PillGroup 
          label="Food Preference" 
          options={["Veg", "Non-Veg", "Egg"]} 
          selected={foodPreference}
          onSelect={setFoodPreference}
        />
        <PillGroup 
          label="Smoking / Drinking" 
          options={["Non-Smoker", "Social Smoker", "Social Drinker", "Never"]} 
          selected={smoking}
          onSelect={setSmoking}
        />
        <PillGroup 
          label="Working Status" 
          options={["Student", "Working", "WFH", "Hybrid"]} 
          selected={profession}
          onSelect={setProfession}
        />
        <PillGroup 
          label="Guests Frequency" 
          options={["Rarely", "Occasionally", "Weekends", "Often"]} 
          selected={guests}
          onSelect={setGuests}
        />
      </div>
    );
  };

  const Step3Intent = () => {
    const Option = ({ id, icon: Icon, title, desc }: { id: string, icon: any, title: string, desc: string }) => (
      <button 
        onClick={() => setIntent(id)}
        className={`w-full p-4 rounded-xl border-2 text-left transition-all flex items-start gap-4 mb-3 ${intent === id ? 'border-[#081A35] bg-blue-50/50' : 'border-slate-100 bg-white hover:border-slate-200'}`}
      >
        <div className={`p-3 rounded-lg ${intent === id ? 'bg-[#081A35] text-white' : 'bg-slate-100 text-slate-500'}`}>
          <Icon size={20} />
        </div>
        <div>
          <h4 className={`font-semibold text-sm ${intent === id ? 'text-[#081A35]' : 'text-slate-900'}`}>{title}</h4>
          <p className="text-xs text-slate-500 mt-1">{desc}</p>
        </div>
      </button>
    );

    return (
      <div>
        <label className="block text-lg font-semibold text-slate-900 mb-4">What are you looking for?</label>
        
        <Option id="find" icon={Search} title="Find a Room" desc="I'm looking for a place to rent with flatmates." />
        <Option id="offer" icon={Home} title="Offer a Room" desc="I have a room and need a flatmate." />
        <Option id="explore" icon={Compass} title="Just Exploring" desc="I'm not ready to move yet." />

        <div className="mt-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Description (for my roommate search)
          </label>
          <textarea
            value={bioText}
            onChange={(e) => setBioText(e.target.value)}
            rows={4}
            placeholder="Write a short description about yourself and what you want in a roommate..."
            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:border-[#4E668A] focus:ring-4 focus:ring-[#4E668A]/10 transition-all outline-none text-slate-900 placeholder:text-slate-400 resize-none"
          />
          <p className="text-xs text-slate-500 mt-2">
            We will automatically include a note that you are looking for a roommate.
          </p>
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">Move-in Timeline</label>
          <select className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:border-[#4E668A] focus:ring-4 focus:ring-[#4E668A]/10 transition-all outline-none text-slate-700">
            <option>Immediately</option>
            <option>Within 1 month</option>
            <option>1-3 months</option>
            <option>3+ months</option>
          </select>
        </div>
      </div>
    );
  };

  return (
    <AuthLayout
      title={step === 1 ? "Tell us about yourself" : step === 2 ? "Lifestyle Preferences" : "Your Goal"}
      subtitle={step === 1 ? "Help us find the best matches for you." : step === 2 ? "We'll match you with people who live like you." : "What brings you to Rumi?"}
      showSidebar={true}
      onBack={step > 1 ? prevStep : undefined}
    >
      {/* Step Indicator */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= step ? 'bg-[#081A35]' : 'bg-slate-200'}`}></div>
        ))}
      </div>

      <div className="min-h-[300px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {step === 1 && renderStep1Basic()}
            {step === 2 && <Step2Lifestyle />}
            {step === 3 && <Step3Intent />}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-8 flex gap-3">
        {step > 1 && (
          <button 
            onClick={prevStep}
            className="flex-1 py-3.5 px-4 bg-white text-slate-700 border border-slate-200 rounded-xl font-semibold hover:bg-slate-50 transition-all"
          >
            Back
          </button>
        )}
        <button 
          onClick={nextStep}
          className="flex-1 py-3.5 px-4 bg-[#081A35] text-white rounded-xl font-semibold hover:bg-[#081A35]/90 transition-all shadow-lg shadow-blue-900/10 flex items-center justify-center gap-2"
          disabled={submitting || (step === 1 && !isStep1Valid)}
          style={{
            opacity: submitting || (step === 1 && !isStep1Valid) ? 0.6 : 1,
            cursor: submitting || (step === 1 && !isStep1Valid) ? 'not-allowed' : 'pointer',
          }}
        >
          {step === 3 ? "Finish Setup" : "Next"} <ArrowRight size={18} />
        </button>
      </div>
    </AuthLayout>
  );
};
