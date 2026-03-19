import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { User, DollarSign, CheckCircle2, Sparkles, X, Check, Users } from 'lucide-react';

/**
 * Maps API/demo match item { user, matchScore, reasons } to Design swipe card profile shape.
 */
function matchToProfile(item) {
  if (!item) return null;
  const u = item.user || item;
  const matchScore = item.matchScore ?? u.match ?? 0;
  const photo = u.photo || u.profilePicture || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop';
  const budgetRange = u.budgetRange;
  const minV = budgetRange?.min ?? 0;
  const maxV = budgetRange?.max ?? 0;
  const budgetStr = minV || maxV
    ? `₹${minV >= 1000 ? minV / 1000 : minV}-${maxV >= 1000 ? maxV / 1000 : maxV}k/mo`
    : '—';
  const prefs = u.lifestylePreferences || {};
  const tags = [
    prefs.cleanlinessLevel === 'clean' && 'Clean & Tidy',
    prefs.sleepSchedule === 'early_sleeper' && 'Early Riser',
    prefs.smoking === 'no' && 'Non-Smoker',
    prefs.foodPreference && `Food: ${prefs.foodPreference}`,
    ...(item.reasons || []),
  ].filter(Boolean).slice(0, 5);
  return {
    image: photo,
    name: u.name || 'User',
    age: u.age ?? '',
    bio: u.bio || 'No bio yet.',
    match: matchScore,
    verified: !!u.verified,
    budget: budgetStr,
    tags: tags.length ? tags : ['Friendly', 'Respectful'],
    _raw: item,
  };
}

/**
 * Single swipeable card – Design Rumi Landing Page exact style.
 * Supports drag-to-swipe and programmatic swipe via triggerSwipe.
 */
function SwipeCard({ profile, onSwipe, isTop, triggerSwipe }) {
  const [exitX, setExitX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (triggerSwipe && isTop) {
      const targetX = triggerSwipe.direction === 'right' ? 300 : -300;
      setExitX(targetX);
      setTimeout(() => onSwipe(triggerSwipe.direction), 300);
    }
  }, [triggerSwipe, isTop, onSwipe]);

  return (
    <motion.div
      drag={isTop ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={(e, info) => {
        setIsDragging(false);
        if (Math.abs(info.offset.x) > 100) {
          setExitX(info.offset.x > 0 ? 300 : -300);
          onSwipe(info.offset.x > 0 ? 'right' : 'left');
        }
      }}
      animate={{
        x: exitX,
        rotate: exitX / 10,
        opacity: exitX !== 0 ? 0 : 1,
        scale: isTop ? 1 : 0.95,
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="absolute inset-4 bg-white rounded-3xl shadow-xl overflow-hidden cursor-grab active:cursor-grabbing"
      style={{ zIndex: isTop ? 10 : 1 }}
    >
      <div className="relative h-[65%] overflow-hidden">
        <img
          src={profile.image}
          alt={profile.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/40" />
        {isDragging && (
          <>
            <motion.div
              className="absolute top-8 left-8 bg-red-500 text-white px-6 py-3 rounded-2xl font-bold text-lg transform -rotate-12 border-4 border-white shadow-xl"
              animate={{ opacity: exitX < -50 ? 1 : 0 }}
            >
              NOPE
            </motion.div>
            <motion.div
              className="absolute top-8 right-8 bg-green-500 text-white px-6 py-3 rounded-2xl font-bold text-lg transform rotate-12 border-4 border-white shadow-xl"
              animate={{ opacity: exitX > 50 ? 1 : 0 }}
            >
              LIKE
            </motion.div>
          </>
        )}
        <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg">
          <Sparkles size={12} className="text-green-500" />
          <span className="text-green-600 font-bold text-xs">{profile.match}% Match</span>
        </div>
      </div>
      <div className="p-5 h-[35%] flex flex-col">
        <div className="flex items-center gap-2 mb-2">
          <h3 className="text-xl font-bold text-slate-900">{profile.name}</h3>
          {profile.age && <span className="text-slate-500 text-sm">{profile.age}y</span>}
          {profile.verified && <CheckCircle2 size={18} className="text-blue-500" />}
        </div>
        <p className="text-slate-500 text-sm mb-3 line-clamp-2">{profile.bio}</p>
        <div className="flex flex-wrap gap-2 mb-auto">
          {(profile.tags || []).map((tag, index) => (
            <span
              key={index}
              className="px-3 py-1 bg-slate-100 text-slate-700 text-xs rounded-full font-medium"
            >
              {tag}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-4 text-slate-500 text-sm pt-3 border-t border-slate-100">
          <div className="flex items-center gap-1.5">
            <User size={14} />
            <span>{profile.age ? `${profile.age}y` : '—'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <DollarSign size={14} />
            <span>{profile.budget}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Stack of swipe cards with Design Rumi action buttons (red X, Sparkles, green Check).
 * Controlled by parent: pass matchItems; on swipe we call onSwipeLeft/onSwipeRight with the top item.
 * Parent should remove that item from matches so the next card becomes top.
 */
export function SwipeCardStack({ matchItems, onSwipeLeft, onSwipeRight, loading }) {
  const profiles = (matchItems || []).map(matchToProfile).filter(Boolean);
  const [swipeTrigger, setSwipeTrigger] = useState(null);

  const topItem = matchItems && matchItems[0];
  const topProfile = profiles[0];
  const nextProfile = profiles[1];

  const handleSwipe = (direction) => {
    if (!topItem) return;
    if (direction === 'right' && onSwipeRight) onSwipeRight(topItem);
    if (direction === 'left' && onSwipeLeft) onSwipeLeft(topItem);
    setSwipeTrigger(null);
  };

  const handleButtonClick = (direction) => {
    if (topProfile && !loading) setSwipeTrigger({ direction });
  };

  if (profiles.length === 0) {
    return (
      <div className="relative h-[520px] flex items-center justify-center rounded-2xl bg-slate-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users size={32} className="text-slate-400" />
          </div>
          <p className="text-slate-500 font-medium">No more profiles</p>
          <p className="text-sm text-slate-400 mt-1">Try filters or check back later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-[520px]">
      {/* Next card behind, current on top */}
      {nextProfile && (
        <SwipeCard
          profile={nextProfile}
          onSwipe={handleSwipe}
          isTop={false}
          triggerSwipe={null}
        />
      )}
      <SwipeCard
        profile={topProfile}
        onSwipe={handleSwipe}
        isTop={true}
        triggerSwipe={swipeTrigger}
      />

      {/* Action buttons – Design Rumi exact style */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-6 py-4">
        <button
          type="button"
          onClick={() => handleButtonClick('left')}
          disabled={loading}
          className="w-14 h-14 rounded-full bg-white border-2 border-red-500 text-red-500 flex items-center justify-center shadow-md hover:bg-red-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Pass"
        >
          <X size={28} strokeWidth={3} />
        </button>
        <button
          type="button"
          disabled={loading}
          className="w-12 h-12 rounded-full bg-white border-2 border-blue-500 text-blue-500 flex items-center justify-center shadow-md hover:bg-blue-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Super like"
        >
          <Sparkles size={20} />
        </button>
        <button
          type="button"
          onClick={() => handleButtonClick('right')}
          disabled={loading}
          className="w-14 h-14 rounded-full bg-white border-2 border-green-500 text-green-500 flex items-center justify-center shadow-md hover:bg-green-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Like"
        >
          <Check size={28} strokeWidth={3} />
        </button>
      </div>
    </div>
  );
}
