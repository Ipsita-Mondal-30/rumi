import React, { useState, useEffect } from "react";
import { User, Menu, X, CheckCircle2, Check, Sparkles, Moon, Sun, DollarSign, Send, MessageCircle, Search, Coffee, Shield, Home, UserPlus, Key, FileText, Users, AlertTriangle, Ban, Zap } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { SignupScreen } from './components/onboarding/Signup';
import { SignInScreen } from './components/onboarding/SignInScreen';
import { ForgotPasswordFlow } from './components/onboarding/ForgotPasswordFlow';
import { OTPScreen } from './components/onboarding/OTPScreen';
import { VerificationSuccessScreen } from './components/onboarding/VerificationSuccessScreen';
import { ProfileSetupFlow } from './components/onboarding/ProfileSetupFlow';
import { FinalConfirmationScreen } from './components/onboarding/FinalConfirmationScreen';
import { Dashboard } from './components/onboarding/Dashboard';
import { getProfile, sendRagMessage } from './services/api';

// Font injection for Poppins

const FontStyles = () => (
  <style>
    {`
      @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
      
      body {
        font-family: 'Poppins', sans-serif;
      }
      
      .phone-shadow {
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 12px #1a1a1a;
      }
    `}
  </style>
);

const Navbar = ({ onSignup, onSignin }: { onSignup?: () => void, onSignin?: () => void }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-6 px-4">
      <div className="bg-[#4E668A]/10 backdrop-blur-md rounded-full px-6 py-3 flex items-center justify-between w-full max-w-5xl shadow-sm border border-blue-200/20">
        <div className="flex items-center gap-2">
          <div className="bg-white text-slate-900 p-1 rounded-lg">
            <User size={20} className="text-slate-900" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">Rumi</span>
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          <a href="#" className="text-white/80 hover:text-white text-sm font-medium transition-colors">Features</a>
          <a href="#" className="text-white/80 hover:text-white text-sm font-medium transition-colors">How It Works</a>
          <a href="#" className="text-white/80 hover:text-white text-sm font-medium transition-colors">Safety</a>
        </div>

        <div className="hidden md:flex items-center gap-4">
          <button onClick={onSignin} className="text-white font-semibold text-sm hover:underline">Sign In</button>
          <button onClick={onSignup} className="bg-white text-slate-900 px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-slate-100 transition-all shadow-lg hover:shadow-xl">
            Sign Up
          </button>
        </div>

        {/* Mobile Menu Toggle */}
        <button className="md:hidden text-white" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="absolute top-20 left-4 right-4 bg-white rounded-2xl p-6 shadow-xl flex flex-col gap-4 md:hidden z-50">
          <a href="#" className="text-slate-900 font-medium p-2">Features</a>
          <a href="#" className="text-slate-900 font-medium p-2">How It Works</a>
          <a href="#" className="text-slate-900 font-medium p-2">Safety</a>
          <div className="h-px bg-slate-100 my-2"></div>
          <button onClick={onSignin} className="text-slate-900 font-semibold p-2 w-full text-left">Sign In</button>
          <button onClick={onSignup} className="bg-slate-900 text-white px-5 py-3 rounded-full text-sm font-semibold w-full">
            Sign Up
          </button>
        </div>
      )}
    </nav>
  );
};

// Used in Hero
const ProfileCard = ({ name, role, match, image, verified = false }: { name: string, role: string, match: number, image: string, verified?: boolean }) => (
  <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 flex items-center gap-3 mb-3 hover:shadow-md transition-shadow cursor-pointer">
    <div className="relative">
      <img src={image} alt={name} className="w-10 h-10 rounded-full object-cover" />
      {verified && <CheckCircle2 className="w-4 h-4 text-blue-500 absolute -bottom-1 -right-1 bg-white rounded-full border border-white" />}
    </div>
    <div className="flex-1 min-w-0">
      <h4 className="text-slate-900 font-semibold text-sm truncate">{name}</h4>
      <p className="text-slate-500 text-xs truncate">{role}</p>
    </div>
    <div className="text-right">
      <span className="text-green-600 font-bold text-xs">{match}% Match</span>
    </div>
  </div>
);

// Swipable Profile Card Component
const SwipeCard = ({ 
  profile, 
  onSwipe, 
  isTop,
  triggerSwipe
}: { 
  profile: any, 
  onSwipe: (direction: 'left' | 'right') => void,
  isTop: boolean,
  triggerSwipe?: { direction: 'left' | 'right' } | null
}) => {
  const [exitX, setExitX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // Handle programmatic swipe from button clicks
  useEffect(() => {
    if (triggerSwipe && isTop) {
      const targetX = triggerSwipe.direction === 'right' ? 300 : -300;
      setExitX(targetX);
      setTimeout(() => {
        onSwipe(triggerSwipe.direction);
      }, 300);
    }
  }, [triggerSwipe, isTop, onSwipe]);

  return (
    <motion.div
      drag={isTop ? "x" : false}
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
        scale: isTop ? 1 : 0.95
      }}
      transition={{ 
        type: "spring",
        stiffness: 300,
        damping: 30
      }}
      className="absolute inset-4 bg-white rounded-3xl shadow-xl overflow-hidden cursor-grab active:cursor-grabbing"
      style={{ zIndex: isTop ? 10 : 1 }}
    >
      {/* Profile Image */}
      <div className="relative h-[65%] overflow-hidden">
        <img 
          src={profile.image} 
          alt={profile.name}
          className="w-full h-full object-cover"
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/40"></div>

        {/* Swipe Indicators */}
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

        {/* Compatibility Badge */}
        <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg">
          <Sparkles size={12} className="text-green-500" />
          <span className="text-green-600 font-bold text-xs">{profile.match}% Match</span>
        </div>
      </div>

      {/* Profile Info */}
      <div className="p-5 h-[35%] flex flex-col">
        <div className="flex items-center gap-2 mb-2">
          <h3 className="text-xl font-bold text-slate-900">{profile.name}</h3>
          {profile.verified && (
            <CheckCircle2 size={18} className="text-blue-500" />
          )}
        </div>

        <p className="text-slate-500 text-sm mb-3 line-clamp-2">{profile.bio}</p>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-auto">
          {profile.tags.map((tag: string, index: number) => (
            <span 
              key={index}
              className="px-3 py-1 bg-slate-100 text-slate-700 text-xs rounded-full font-medium"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-slate-500 text-sm pt-3 border-t border-slate-100">
          <div className="flex items-center gap-1.5">
            <User size={14} />
            <span>{profile.age}y</span>
          </div>
          <div className="flex items-center gap-1.5">
            <DollarSign size={14} />
            <span>{profile.budget}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Used in Hero
const PhoneScreen = () => {
  const [profiles, setProfiles] = useState([
    {
      id: 1,
      name: "Sophie Bennett",
      age: 26,
      bio: "Looking for a flatmate in a quiet neighborhood.",
      image: "https://images.unsplash.com/photo-1765648763932-43a3e2f8f35c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3VuZyUyMHdvbWFuJTIwcG9ydHJhaXQlMjBwcm9mZXNzaW9uYWwlMjBjYXN1YWx8ZW58MXx8fHwxNzcwNzA3ODUzfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      match: 95,
      verified: true,
      budget: "₹800/mo",
      tags: ["Budget Friendly", "Clean & Tidy", "Early Riser"]
    },
    {
      id: 2,
      name: "James Parker",
      age: 28,
      bio: "Looking for a flatmate who enjoys quiet evenings.",
      image: "https://images.unsplash.com/photo-1769071167455-e5779ecc81a4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3VuZyUyMG1hbiUyMHBvcnRyYWl0JTIwcHJvZmVzc2lvbmFsJTIwY2FzdWFsfGVufDF8fHx8MTc3MDcwNzg1M3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      match: 88,
      verified: true,
      budget: "₹950/mo",
      tags: ["Quiet", "Non-Smoker", "Pet Friendly"]
    },
    {
      id: 3,
      name: "Maya Chen",
      age: 24,
      bio: "Looking for a flatmate in downtown area.",
      image: "https://images.unsplash.com/photo-1770364017468-e755d33941e8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3VuZyUyMGFzaWFuJTIwd29tYW4lMjBwb3J0cmFpdCUyMGNhc3VhbHxlbnwxfHx8fDE3NzA3MDU0NTV8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      match: 92,
      verified: true,
      budget: "₹1100/mo",
      tags: ["Sociable", "Flexible", "City Center"]
    }
  ]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipeTrigger, setSwipeTrigger] = useState(null);

  const handleSwipe = (direction: 'left' | 'right') => {
    setTimeout(() => {
      setCurrentIndex(prev => prev + 1);
      setSwipeTrigger(null);
    }, 300);
  };

  const handleButtonClick = (direction: 'left' | 'right') => {
    if (currentIndex < profiles.length) {
      setSwipeTrigger({ direction });
    }
  };

  return (
    <div className="bg-slate-50 h-full w-full rounded-[2.5rem] overflow-hidden flex flex-col relative font-sans">
      {/* Notch Area */}
      <div className="h-14 bg-white/80 backdrop-blur-sm flex justify-between items-end px-6 pb-2 border-b border-slate-100 z-20 sticky top-0">
        <span className="text-xs font-bold text-slate-900">9:41</span>
        <div className="flex gap-1.5">
          <div className="w-4 h-2.5 bg-slate-900 rounded-[1px]"></div>
          <div className="w-3 h-2.5 bg-slate-900 rounded-[1px]"></div>
        </div>
      </div>
      
      {/* Logo Header inside App */}
      <div className="px-6 py-4 flex justify-between items-center bg-white z-20">
        <span className="font-bold text-lg tracking-tight text-slate-900">Rumi</span>
        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
          <User size={16} className="text-slate-600" />
        </div>
      </div>

      {/* Swipable Cards Area */}
      <div className="flex-1 relative bg-slate-50">
        {currentIndex < profiles.length ? (
          <>
            {/* Show next card in background */}
            {currentIndex + 1 < profiles.length && (
              <SwipeCard 
                profile={profiles[currentIndex + 1]} 
                onSwipe={handleSwipe}
                isTop={false}
                triggerSwipe={null}
              />
            )}
            {/* Show current card on top */}
            <SwipeCard 
              profile={profiles[currentIndex]} 
              onSwipe={handleSwipe}
              isTop={true}
              triggerSwipe={swipeTrigger}
            />
          </>
        ) : (
          <div className="absolute inset-4 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users size={32} className="text-slate-400" />
              </div>
              <p className="text-slate-500 font-medium">No more profiles</p>
              <button 
                onClick={() => setCurrentIndex(0)}
                className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-full text-sm font-semibold"
              >
                Reset
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="bg-white px-6 py-4 flex items-center justify-center gap-6 z-20">
        <button 
          onClick={() => handleButtonClick('left')}
          disabled={currentIndex >= profiles.length}
          className="w-14 h-14 rounded-full bg-white border-2 border-red-500 text-red-500 flex items-center justify-center shadow-md hover:bg-red-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <X size={28} strokeWidth={3} />
        </button>
        <button 
          disabled={currentIndex >= profiles.length}
          className="w-12 h-12 rounded-full bg-white border-2 border-blue-500 text-blue-500 flex items-center justify-center shadow-md hover:bg-blue-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Sparkles size={20} />
        </button>
        <button 
          onClick={() => handleButtonClick('right')}
          disabled={currentIndex >= profiles.length}
          className="w-14 h-14 rounded-full bg-white border-2 border-green-500 text-green-500 flex items-center justify-center shadow-md hover:bg-green-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Check size={28} strokeWidth={3} />
        </button>
      </div>
      
      {/* Bottom Nav Bar Indicator */}
      <div className="h-1.5 w-32 bg-slate-900/20 rounded-full mx-auto mb-2 absolute bottom-2 left-0 right-0 z-20"></div>
    </div>
  );
};

// Used in Hero
const FloatingCard = ({ 
  title, 
  subtitle, 
  icon: Icon, 
  colorClass, 
  buttonText = "Connect", 
  className 
}: { 
  title: string, 
  subtitle: string, 
  icon: any, 
  colorClass: string, 
  buttonText?: string, 
  className?: string 
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className={`absolute p-4 bg-white rounded-2xl shadow-xl border border-slate-100 w-64 z-20 ${className}`}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2.5 rounded-xl ${colorClass}`}>
          <Icon size={20} className="text-white" />
        </div>
        <div className="flex-1">
          <h4 className="font-bold text-slate-900 text-sm leading-tight mb-1">{title}</h4>
          <p className="text-slate-500 text-xs leading-relaxed mb-3">{subtitle}</p>
          <button className="bg-slate-900 text-white text-xs font-semibold px-4 py-2 rounded-lg w-full hover:bg-slate-800 transition-colors">
            {buttonText}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

/* --- PROBLEM STATEMENT SECTION --- */

const ProblemStatementSection = () => {
  const problems = [
    {
      icon: AlertTriangle,
      title: "Roommate Conflicts",
      description: "Lifestyle mismatches lead to tension"
    },
    {
      icon: Ban,
      title: "Scams & Unverified Profiles",
      description: "Unsafe listings and fake identities"
    },
    {
      icon: MessageCircle,
      title: "Random WhatsApp Groups",
      description: "No organized way to find matches"
    },
    {
      icon: Search,
      title: "No Compatibility Filters",
      description: "Can't filter by habits or preferences"
    }
  ];

  return (
    <section className="w-full py-24 bg-gradient-to-b from-slate-50 to-white relative overflow-hidden">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Section Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 mb-4 bg-red-50 px-4 py-2 rounded-full"
          >
            <AlertTriangle size={16} className="text-red-500" />
            <span className="text-red-600 text-xs font-bold uppercase tracking-wider">The Problem</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl md:text-4xl font-bold text-slate-900 mb-4"
          >
            Finding the Right Flatmate is Broken
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-slate-500 text-lg font-light max-w-2xl mx-auto"
          >
            Traditional methods leave you guessing, leading to bad matches and wasted time.
          </motion.p>
        </div>

        {/* Problems Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {problems.map((problem, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white border border-red-100 rounded-2xl p-6 hover:shadow-lg transition-shadow"
            >
              <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center mb-4">
                <problem.icon size={24} className="text-red-500" />
              </div>
              <h3 className="text-slate-900 font-semibold text-base mb-2">
                {problem.title}
              </h3>
              <p className="text-slate-500 text-sm font-light leading-relaxed">
                {problem.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Background Decoration */}
      <div className="absolute top-1/2 right-0 w-72 h-72 bg-red-100/20 rounded-full blur-3xl -z-10"></div>
    </section>
  );
};

/* --- CORE FEATURES SECTION --- */

const CoreFeaturesSection = () => {
  const features = [
    {
      icon: Sparkles,
      title: "Lifestyle Compatibility Engine",
      description: "AI-powered matching based on habits, schedules, and preferences"
    },
    {
      icon: Shield,
      title: "Verified Profiles + Safety",
      description: "ID verification and background checks for peace of mind"
    },
    {
      icon: User,
      title: "Swipe Discovery UI",
      description: "Intuitive interface to browse and connect with matches"
    },
    {
      icon: MessageCircle,
      title: "End-to-End Chat System",
      description: "Secure messaging to get to know potential flatmates"
    },
    {
      icon: CheckCircle2,
      title: "AI Compatibility Insights",
      description: "Smart scoring system shows why you're a great match"
    },
    {
      icon: Zap,
      title: "Instant Notifications",
      description: "Get alerts when someone matches your preferences"
    }
  ];

  return (
    <section className="w-full py-24 bg-white relative overflow-hidden">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Section Header */}
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl md:text-4xl font-bold text-slate-900 mb-4"
          >
            Core Features
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-slate-500 text-lg font-light"
          >
            Everything you need to find your perfect flatmate
          </motion.p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-blue-100 transition-colors">
                  <feature.icon size={24} className="text-blue-500" />
                </div>
                <div>
                  <h3 className="text-slate-900 font-semibold text-base mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-slate-500 text-sm font-light leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* --- NEW MINIMAL SECTION --- */

const MinimalFeatureSection = () => {
  return (
    <section className="w-full py-24 bg-white relative overflow-hidden">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 lg:gap-24 items-center">
          
          {/* Left Column: AI Matching Content */}
          <div className="text-left z-10 mt-16">
             <motion.div 
               initial={{ opacity: 0, y: 10 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               transition={{ duration: 0.5 }}
               className="inline-flex items-center gap-2 mb-4"
             >
               <Sparkles size={16} className="text-blue-500" />
               <span className="text-blue-600 text-xs font-bold uppercase tracking-wider">AI Powered Flatmate Match</span>
             </motion.div>

             <motion.h2 
               initial={{ opacity: 0, y: 10 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               transition={{ duration: 0.5, delay: 0.1 }}
               className="text-3xl md:text-4xl font-bold text-slate-900 mb-6 leading-tight"
             >
               Turn Shared Living <br /> Into Comfort.
             </motion.h2>

             <div className="space-y-6">
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="flex items-center gap-3"
                >
                  <div className="bg-green-50 text-green-600 px-3 py-1 rounded-full text-sm font-bold border border-green-100">
                    92% Compatibility
                  </div>
                </motion.div>

                <div className="flex flex-wrap gap-3">
                   {["Quiet & Clean Flatmate", "Early Riser Roommate", "Budget Friendly Flatmate"].map((tag, i) => (
                     <motion.span 
                       key={i}
                       initial={{ opacity: 0, y: 10 }}
                       whileInView={{ opacity: 1, y: 0 }}
                       viewport={{ once: true }}
                       transition={{ duration: 0.4, delay: 0.3 + (i * 0.1) }}
                       className="inline-flex items-center gap-1.5 text-slate-600 text-sm bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100"
                     >
                        <Check size={12} className="text-slate-400" /> {tag}
                     </motion.span>
                   ))}
                </div>
             </div>
          </div>

          {/* Right Column: Safe Communication Content & Chat UI */}
          <div className="text-left z-10 relative pl-0 md:pl-10">
             
             {/* Text Content */}
             <div className="mb-10 relative z-20">
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                  className="inline-flex items-center gap-2 mb-4"
                >
                  <Shield size={16} className="text-emerald-500" />
                  <span className="text-emerald-600 text-xs font-bold uppercase tracking-wider">Safe Communication</span>
                </motion.div>

                <motion.h2 
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 leading-tight"
                >
                  Safe Communication With <br /> Your Rumi Matches.
                </motion.h2>

                <motion.p 
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="text-slate-500 text-lg font-light leading-relaxed"
                >
                  Secure in-app chat system for flatmate discussions.
                </motion.p>
             </div>

             {/* Minimal Chat UI Preview - Floating to the right/bottom */}
             <div className="relative h-[200px] w-full flex items-center justify-start md:justify-center">
                {/* Abstract Background Blur */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/50 rounded-full blur-3xl -z-10"></div>

                <motion.div 
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="bg-white p-4 rounded-2xl shadow-lg border border-slate-100/60 max-w-[280px] w-full ml-auto mr-auto md:mr-0 md:ml-auto transform rotate-1"
                >
                   {/* Chat Bubble 1 */}
                   <div className="flex gap-3 mb-4">
                     <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs shrink-0">J</div>
                     <div className="bg-slate-50 p-3 rounded-2xl rounded-tl-none text-xs text-slate-600 leading-relaxed">
                       Hi! I saw we're a 92% match. Are you still looking?
                     </div>
                   </div>

                   {/* Chat Bubble 2 (User) */}
                   <div className="flex gap-3 justify-end mb-2">
                     <div className="bg-blue-500 p-3 rounded-2xl rounded-tr-none text-xs text-white leading-relaxed">
                       Hey! Yes, I am. Your profile looks great!
                     </div>
                   </div>
                   
                   <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-50">
                      <div className="h-2 w-2 rounded-full bg-green-400"></div>
                      <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">Secure Chat</span>
                   </div>
                </motion.div>
             </div>

          </div>
        </div>
      </div>
    </section>
  );
};

/* --- NEW HOW IT WORKS SECTION --- */

const HowItWorksSection = () => {
  const [activeTab, setActiveTab] = useState('offer');

  const content = {
    offer: [
      { 
        title: "List Your Room", 
        desc: "Add details about your space and preferences.",
        icon: Home,
        color: "text-blue-500",
        bg: "bg-blue-50"
      },
      { 
        title: "Create Profile", 
        desc: "Tell others about yourself and your living expectations.",
        icon: UserPlus,
        color: "text-indigo-500",
        bg: "bg-indigo-50"
      },
      { 
        title: "Connect & Finalize", 
        desc: "Chat with matches and finalize your flatmate.",
        icon: MessageCircle,
        color: "text-emerald-500",
        bg: "bg-emerald-50"
      }
    ],
    find: [
      { 
        title: "Create Profile", 
        desc: "Add lifestyle, budget, and roommate preferences.",
        icon: FileText,
        color: "text-blue-500",
        bg: "bg-blue-50"
      },
      { 
        title: "Look for Match", 
        desc: "Browse compatible rooms and flatmates.",
        icon: Search,
        color: "text-indigo-500",
        bg: "bg-indigo-50"
      },
      { 
        title: "Connect & Book", 
        desc: "Chat securely and finalize your stay.",
        icon: Key,
        color: "text-emerald-500",
        bg: "bg-emerald-50"
      }
    ]
  };

  return (
    <section className="w-full py-24 bg-white relative overflow-hidden border-t border-slate-50">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-16">
           <motion.h2 
             initial={{ opacity: 0, y: 10 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true }}
             transition={{ duration: 0.5 }}
             className="text-3xl md:text-4xl font-bold text-slate-900 mb-4"
           >
             How Rumi Works
           </motion.h2>
           <motion.p 
             initial={{ opacity: 0, y: 10 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true }}
             transition={{ duration: 0.5, delay: 0.1 }}
             className="text-slate-500 text-lg font-light mb-8"
           >
             Find or offer the perfect flatmate in just a few steps.
           </motion.p>

           {/* Toggle Switch */}
           <motion.div 
             initial={{ opacity: 0, scale: 0.95 }}
             whileInView={{ opacity: 1, scale: 1 }}
             viewport={{ once: true }}
             transition={{ duration: 0.5, delay: 0.2 }}
             className="inline-flex p-1.5 bg-slate-100 rounded-full relative"
           >
             {/* Highlight Background */}
             <motion.div 
                className="absolute top-1.5 bottom-1.5 rounded-full bg-gradient-to-r from-[#081A35] to-[#4E668A] shadow-md z-0"
                layout
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                style={{ 
                  left: activeTab === 'offer' ? '6px' : '50%', 
                  width: 'calc(50% - 9px)',
                  x: activeTab === 'find' ? '3px' : '0' 
                }}
             />

             <button 
               onClick={() => setActiveTab('offer')}
               className={`relative z-10 px-8 py-2.5 rounded-full text-sm font-semibold transition-colors duration-200 ${activeTab === 'offer' ? 'text-white' : 'text-slate-500 hover:text-slate-700'}`}
             >
               Offer a Room
             </button>
             <button 
               onClick={() => setActiveTab('find')}
               className={`relative z-10 px-8 py-2.5 rounded-full text-sm font-semibold transition-colors duration-200 ${activeTab === 'find' ? 'text-white' : 'text-slate-500 hover:text-slate-700'}`}
             >
               Find a Room
             </button>
           </motion.div>
        </div>

        {/* Dynamic Steps Content */}
        <div className="relative min-h-[300px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12"
            >
              {content[activeTab].map((step, index) => (
                <div key={index} className="flex flex-col items-center text-center group">
                  <div className={`w-20 h-20 rounded-full ${step.bg} flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-110 shadow-sm border border-slate-50`}>
                    <step.icon size={32} className={step.color} strokeWidth={1.5} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-3">{step.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed max-w-xs font-light">
                    {step.desc}
                  </p>
                  
                  {/* Connector Line (Hidden on last item and mobile) */}
                  {index < 2 && (
                    <div className="hidden md:block absolute top-[2.5rem] left-[calc(16.666%+5rem)] w-[calc(33.333%-10rem)] h-px bg-slate-100 -z-10">
                      {/* Only a visual connector concept, implementation tricky with grid. Simplified approach: */}
                    </div>
                  )}
                </div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>

      </div>
    </section>
  );
};

/* --- TESTIMONIALS SECTION --- */

const TestimonialsSection = () => {
  const testimonials = [
    {
      id: 1,
      name: "Emily Johnson",
      role: "Marketing Manager",
      image: "https://images.unsplash.com/photo-1723189039515-ec457cec311d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoYXBweSUyMHlvdW5nJTIwd29tYW4lMjBzbWlsaW5nJTIwcG9ydHJhaXR8ZW58MXx8fHwxNzcwNzA4MDg5fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      quote: "Rumi helped me find the perfect flatmate! The AI matching really works - we share the same lifestyle and it's been amazing living together.",
      match: "96% Match"
    },
    {
      id: 2,
      name: "David Martinez",
      role: "Software Developer",
      image: "https://images.unsplash.com/photo-1760574755798-325e4efec716?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoYXBweSUyMHlvdW5nJTIwbWFuJTIwc21pbGluZyUyMHBvcnRyYWl0fGVufDF8fHx8MTc3MDcwODA5MHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      quote: "I was skeptical at first, but Rumi's compatibility scoring is spot on. Found my flatmate in just 2 days and we get along perfectly!",
      match: "94% Match"
    },
    {
      id: 3,
      name: "Sarah Williams",
      role: "Graphic Designer",
      image: "https://images.unsplash.com/photo-1758598304332-94b40ce7c7b4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoYXBweSUyMHlvdW5nJTIwcHJvZmVzc2lvbmFsJTIwd29tYW58ZW58MXx8fHwxNzcwNzA4MDkwfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      quote: "The secure chat and verification features made me feel safe throughout the process. Found a great roommate who shares my love for clean spaces!",
      match: "98% Match"
    }
  ];

  return (
    <section className="w-full py-24 bg-slate-50 relative overflow-hidden">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Section Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 mb-4"
          >
            <Users size={16} className="text-blue-500" />
            <span className="text-blue-600 text-xs font-bold uppercase tracking-wider">Success Stories</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl md:text-4xl font-bold text-slate-900 mb-4"
          >
            What Our Users Say
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-slate-500 text-lg font-light max-w-2xl mx-auto"
          >
            Real stories from people who found their perfect flatmate match
          </motion.p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-lg transition-shadow duration-300 group"
            >
              {/* Quote Icon */}
              <div className="mb-4">
                <svg 
                  className="w-8 h-8 text-blue-500/20 group-hover:text-blue-500/30 transition-colors" 
                  fill="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                </svg>
              </div>

              {/* Testimonial Text */}
              <p className="text-slate-600 text-sm leading-relaxed mb-6 font-light">
                "{testimonial.quote}"
              </p>

              {/* User Info */}
              <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                <img 
                  src={testimonial.image}
                  alt={testimonial.name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                />
                <div className="flex-1">
                  <h4 className="text-slate-900 font-semibold text-sm">{testimonial.name}</h4>
                  <p className="text-slate-500 text-xs">{testimonial.role}</p>
                </div>
                <div className="bg-green-50 px-2.5 py-1 rounded-full">
                  <span className="text-green-600 font-bold text-xs">{testimonial.match}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="grid grid-cols-3 gap-8 mt-16 pt-16 border-t border-slate-200"
        >
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">10K+</div>
            <p className="text-slate-500 text-sm font-light">Happy Flatmates</p>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">95%</div>
            <p className="text-slate-500 text-sm font-light">Match Success Rate</p>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">4.9/5</div>
            <p className="text-slate-500 text-sm font-light">Average Rating</p>
          </div>
        </motion.div>
      </div>

      {/* Background Decoration */}
      <div className="absolute top-20 right-0 w-64 h-64 bg-blue-100/30 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-20 left-0 w-64 h-64 bg-purple-100/30 rounded-full blur-3xl -z-10"></div>
    </section>
  );
};

/* --- TRUST & SAFETY SECTION --- */

const TrustSafetySection = () => {
  const safetyFeatures = [
    {
      icon: Shield,
      title: "ID Verification",
      description: "Every user goes through a thorough ID verification process. Verified badges ensure you're connecting with real people.",
      badge: "Verified",
      badgeColor: "bg-blue-500"
    },
    {
      icon: CheckCircle2,
      title: "24/7 Moderation",
      description: "Our dedicated team reviews profiles and monitors activity around the clock to maintain a safe community.",
      badge: "Protected",
      badgeColor: "bg-emerald-500"
    },
    {
      icon: Shield,
      title: "Privacy First",
      description: "Your personal data is encrypted and never shared. Control what information you reveal and when.",
      badge: "Secure",
      badgeColor: "bg-purple-500"
    }
  ];

  return (
    <section className="w-full py-24 bg-white relative overflow-hidden border-t border-slate-100">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Section Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 mb-4"
          >
            <Shield size={16} className="text-blue-500" />
            <span className="text-blue-600 text-xs font-bold uppercase tracking-wider">Trust & Safety</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl md:text-4xl font-bold text-slate-900 mb-4"
          >
            Your Safety Is Our Priority
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-slate-500 text-lg font-light max-w-2xl mx-auto"
          >
            We've built multiple layers of protection so you can find your flatmate with confidence
          </motion.p>
        </div>

        {/* Safety Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {safetyFeatures.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="text-center group"
            >
              {/* Icon with Badge */}
              <div className="relative inline-flex mb-6">
                <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center group-hover:bg-slate-100 transition-colors">
                  <feature.icon size={36} className="text-slate-700" strokeWidth={1.5} />
                </div>
                <div className={`absolute -top-2 -right-2 ${feature.badgeColor} text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-md uppercase tracking-wide`}>
                  {feature.badge}
                </div>
              </div>

              <h3 className="text-slate-900 font-bold text-lg mb-3">
                {feature.title}
              </h3>
              <p className="text-slate-500 text-sm font-light leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Trust Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-gradient-to-r from-slate-50 to-blue-50/50 rounded-3xl p-8 md:p-12"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="flex items-center justify-center gap-2 mb-2">
                <CheckCircle2 size={20} className="text-blue-500" />
                <span className="text-2xl md:text-3xl font-bold text-slate-900">100%</span>
              </div>
              <p className="text-slate-600 text-sm font-medium">Profiles Verified</p>
            </div>
            <div>
              <div className="flex items-center justify-center gap-2 mb-2">
                <Shield size={20} className="text-emerald-500" />
                <span className="text-2xl md:text-3xl font-bold text-slate-900">24/7</span>
              </div>
              <p className="text-slate-600 text-sm font-medium">Safety Monitoring</p>
            </div>
            <div>
              <div className="flex items-center justify-center gap-2 mb-2">
                <CheckCircle2 size={20} className="text-purple-500" />
                <span className="text-2xl md:text-3xl font-bold text-slate-900">Encrypted</span>
              </div>
              <p className="text-slate-600 text-sm font-medium">All Communications</p>
            </div>
          </div>
        </motion.div>

        {/* Additional Safety Note */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="text-center mt-12"
        >
          <p className="text-slate-500 text-sm font-light">
            Need help? Our <a href="#" className="text-blue-500 hover:text-blue-600 font-medium underline">Safety Center</a> has tips and resources for safe flatmate searching.
          </p>
        </motion.div>
      </div>

      {/* Background Decoration */}
      <div className="absolute top-1/2 left-0 w-72 h-72 bg-blue-100/20 rounded-full blur-3xl -z-10"></div>
      <div className="absolute top-1/4 right-0 w-96 h-96 bg-emerald-100/20 rounded-full blur-3xl -z-10"></div>
    </section>
  );
};

/* --- CHATBOT COMPONENT --- */

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
}

function Chatbot() {
  const [isOpen, setIsOpen] = useState(false as boolean);
  const [messages, setMessages] = useState([
    { id: 1, text: "Hi! I'm Rumi's AI assistant. How can I help you find your perfect flatmate today?", sender: 'bot' }
  ] as Message[]);
  const [inputMessage, setInputMessage] = useState('' as string);
  const [isAssistantTyping, setIsAssistantTyping] = useState(false as boolean);

  const callAssistant = async (nextMessages: Message[], typingMessageId: number): Promise<void> => {
    // Get the last message from the user
    const lastUserMessage = [...nextMessages].reverse().find(m => m.sender === 'user')?.text || '';

    // Debug logging
    console.log("Sending query:", lastUserMessage);

    try {
      const res = await sendRagMessage({ message: lastUserMessage });
      // Debug logging response
      console.log("Response:", res.data);

      const reply = res?.data?.reply ?? '';

      setMessages((prev: Message[]) => [
        ...prev.filter((m) => m.id !== typingMessageId),
        { id: typingMessageId, text: reply || 'Okay — tell me a bit more.', sender: 'bot' },
      ]);
    } catch (err: unknown) {
      // Try to surface any helpful message returned by backend (even on 500)
      console.error('RAG request failed:', err);
      const e = err as any;
      const backendReply: string | undefined = e?.response?.data?.reply ?? e?.response?.data?.message;

      setMessages((prev: Message[]) => [
        ...prev.filter((m) => m.id !== typingMessageId),
        { id: typingMessageId, text: backendReply ?? 'Sorry — I could not generate a response. Please try again.', sender: 'bot' },
      ]);
    }
  };

  const sendUserMessage = async (text: string): Promise<void> => {
    if (!text.trim()) return;
    if (isAssistantTyping) return;

    const userMessageId = Date.now();
    const userMessage: Message = { id: userMessageId, text: text.trim(), sender: 'user' };
    const nextMessages = [...messages, userMessage];

    const typingMessageId = userMessageId + 1;
    const typingMessage: Message = { id: typingMessageId, text: 'Typing...', sender: 'bot' };

    setMessages([...nextMessages, typingMessage]);
    setIsAssistantTyping(true);
    try {
      await callAssistant(nextMessages, typingMessageId);
    } catch (err) {
      console.error('assistant chat error:', err);
      setMessages((prev: Message[]) => [
        ...prev.filter((m) => m.id !== typingMessageId),
        { id: typingMessageId, text: 'Sorry — I could not generate a response. Please try again.', sender: 'bot' },
      ]);
    } finally {
      setIsAssistantTyping(false);
    }
  };

  const handleSendMessage = async (e: { preventDefault: () => void }): Promise<void> => {
    e.preventDefault();
    const text = inputMessage;
    setInputMessage('');
    await sendUserMessage(text);
  };

  return (
    <>
      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-4 md:right-8 z-50 w-[90vw] md:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
          >
            {/* Chat Header */}
            <div className="bg-gradient-to-r from-[#081A35] to-[#4E668A] p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                  <Sparkles size={20} className="text-blue-500" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-sm">Rumi Assistant</h3>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-white/80 text-xs">Online</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/80 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Chat Messages */}
            <div className="h-[400px] overflow-y-auto p-4 space-y-4 bg-slate-50">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.sender === 'bot' && (
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-2 shrink-0">
                      <Sparkles size={14} className="text-blue-500" />
                    </div>
                  )}
                  <div
                    className={`max-w-[75%] p-3 rounded-2xl text-sm ${
                      message.sender === 'user'
                        ? 'bg-blue-500 text-white rounded-tr-none'
                        : 'bg-white text-slate-700 rounded-tl-none border border-slate-100'
                    }`}
                  >
                    {message.text}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="px-4 py-2 bg-white border-t border-slate-100">
              <div className="flex gap-2 overflow-x-auto pb-2">
                <button
                  type="button"
                  disabled={isAssistantTyping}
                  onClick={() => sendUserMessage("How does matching work?")}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full text-xs font-medium whitespace-nowrap transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  How does matching work?
                </button>
                <button
                  type="button"
                  disabled={isAssistantTyping}
                  onClick={() => sendUserMessage("Pricing")}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full text-xs font-medium whitespace-nowrap transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Pricing
                </button>
                <button
                  type="button"
                  disabled={isAssistantTyping}
                  onClick={() => sendUserMessage("Safety tips")}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full text-xs font-medium whitespace-nowrap transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Safety tips
                </button>
              </div>
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-slate-100">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-full text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  disabled={isAssistantTyping}
                />
                <button
                  type="submit"
                  className="w-10 h-10 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center transition-colors shadow-md hover:shadow-lg"
                  disabled={isAssistantTyping}
                >
                  <Send size={18} />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chatbot Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1, type: "spring", stiffness: 200 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-4 md:right-8 z-50 w-16 h-16 bg-gradient-to-r from-[#081A35] to-[#4E668A] hover:from-[#0a1f40] hover:to-[#5a7498] text-white rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 group"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X size={24} />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <MessageCircle size={24} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Notification Badge */}
        {!isOpen && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 1.5 }}
            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-white"
          >
            1
          </motion.div>
        )}

        {/* Pulse Effect */}
        {!isOpen && (
          <span className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-20"></span>
        )}
      </motion.button>
    </>
  );
};

/* --- FOOTER SECTION --- */

const Footer = () => {
  const [email, setEmail] = useState('');

  const handleSubscribe = (e: any) => {
    e.preventDefault();
    // Handle subscription logic
    console.log('Subscribed:', email);
  };

  return (
    <footer className="w-full bg-white relative overflow-hidden">
      {/* CTA Section */}
      <div className="w-full py-20 px-4 relative">
        <div className="container mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="relative inline-block mb-6"
          >
            <Sparkles size={20} className="text-blue-500 absolute -top-2 -right-6" />
          </motion.div>
          
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl md:text-4xl font-bold text-slate-900 mb-4"
          >
            Ready To Find Your <br className="hidden sm:block" />Perfect Flatmate?
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-slate-500 text-lg font-light mb-8"
          >
            Start your journey with AI-powered flatmate matching today
          </motion.p>

          <motion.form
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            onSubmit={handleSubscribe}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto"
          >
            <input
              type="email"
              placeholder="What's your email?"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full sm:flex-1 px-6 py-3.5 rounded-full border border-slate-200 text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
              required
            />
            <button
              type="submit"
              className="w-full sm:w-auto bg-blue-500 hover:bg-blue-600 text-white px-8 py-3.5 rounded-full font-semibold text-sm transition-all shadow-md hover:shadow-lg"
            >
              Subscribe
            </button>
          </motion.form>
        </div>

        {/* Curved Divider */}
        <div className="absolute bottom-0 left-0 right-0 h-24 overflow-hidden">
          <svg
            viewBox="0 0 1200 100"
            preserveAspectRatio="none"
            className="absolute bottom-0 w-full h-full"
          >
            <path
              d="M0,50 Q300,20 600,50 T1200,50 L1200,100 L0,100 Z"
              fill="none"
              stroke="#E2E8F0"
              strokeWidth="1"
              opacity="0.3"
            />
          </svg>
        </div>
      </div>

      {/* Footer Links */}
      <div className="w-full py-16 px-4 border-t border-slate-100">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            {/* Features Column */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h3 className="text-slate-900 font-bold mb-4 text-sm">Features</h3>
              <ul className="space-y-3">
                <li>
                  <a href="#" className="text-slate-600 text-sm hover:text-slate-900 transition-colors">
                    AI Match
                  </a>
                </li>
                <li>
                  <a href="#" className="text-slate-600 text-sm hover:text-slate-900 transition-colors">
                    Smart Profiles
                  </a>
                </li>
                <li>
                  <a href="#" className="text-slate-600 text-sm hover:text-slate-900 transition-colors">
                    In-App Chat
                  </a>
                </li>
                <li>
                  <a href="#" className="text-slate-600 text-sm hover:text-slate-900 transition-colors">
                    Verified Users
                  </a>
                </li>
              </ul>
            </motion.div>

            {/* Community Column */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <h3 className="text-slate-900 font-bold mb-4 text-sm">Community</h3>
              <ul className="space-y-3">
                <li>
                  <a href="#" className="text-slate-600 text-sm hover:text-slate-900 transition-colors">
                    Latest Updates
                  </a>
                </li>
                <li>
                  <a href="#" className="text-slate-600 text-sm hover:text-slate-900 transition-colors">
                    Success Stories
                  </a>
                </li>
                <li>
                  <a href="#" className="text-slate-600 text-sm hover:text-slate-900 transition-colors">
                    Living Tips
                  </a>
                </li>
              </ul>
            </motion.div>

            {/* Resources Column */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <h3 className="text-slate-900 font-bold mb-4 text-sm">Resources</h3>
              <ul className="space-y-3">
                <li>
                  <a href="#" className="text-slate-600 text-sm hover:text-slate-900 transition-colors">
                    Safety Guide
                  </a>
                </li>
                <li>
                  <a href="#" className="text-slate-600 text-sm hover:text-slate-900 transition-colors">
                    FAQs
                  </a>
                </li>
                <li>
                  <a href="#" className="text-slate-600 text-sm hover:text-slate-900 transition-colors">
                    Support
                  </a>
                </li>
              </ul>
            </motion.div>

            {/* Company Column */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <h3 className="text-slate-900 font-bold mb-4 text-sm">Company</h3>
              <ul className="space-y-3">
                <li>
                  <a href="#" className="text-slate-600 text-sm hover:text-slate-900 transition-colors">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="text-slate-600 text-sm hover:text-slate-900 transition-colors">
                    Contact
                  </a>
                </li>
                <li>
                  <a href="#" className="text-slate-600 text-sm hover:text-slate-900 transition-colors">
                    Privacy
                  </a>
                </li>
                <li>
                  <a href="#" className="text-slate-600 text-sm hover:text-slate-900 transition-colors">
                    Terms
                  </a>
                </li>
              </ul>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="w-full py-6 px-4 border-t border-slate-100">
        <div className="container mx-auto max-w-6xl">
          <p className="text-center text-slate-500 text-sm">
            Rumi 2026. all Rights Reserved
          </p>
        </div>
      </div>
    </footer>
  );
};

export default function App() {
  const [currentView, setCurrentView] = useState(() => {
    const token = localStorage.getItem('rumi_token');
    return token ? 'dashboard' : 'landing';
  });
  const [profileFlowMode, setProfileFlowMode] = useState('setup');
  const [signupEmail, setSignupEmail] = useState(() => {
    try {
      const u = localStorage.getItem('rumi_user');
      if (!u) return '';
      const parsed = JSON.parse(u);
      return parsed?.email ?? '';
    } catch {
      return '';
    }
  });

  useEffect(() => {
    const token = localStorage.getItem('rumi_token');
    if (!token) return;

    // Verify token and profile completeness on refresh.
    const run = async () => {
      try {
        const res = await getProfile();
        const user = res?.data?.user;
        if (!user) throw new Error('Missing profile');

        const shouldShowDashboard = user?.profileCompleted || user?.intent === 'explore';
        if (shouldShowDashboard) setCurrentView('dashboard');
        else setCurrentView('profile');
      } catch (e) {
        localStorage.removeItem('rumi_token');
        localStorage.removeItem('rumi_user');
        setSignupEmail('');
        setCurrentView('landing');
      }
    };

    run();
  }, []);

  if (currentView === 'dashboard') {
    return (
      <div className="w-full font-sans selection:bg-blue-200">
        <FontStyles />
        <Dashboard
          userEmail={signupEmail}
          onEditProfile={() => {
            setProfileFlowMode('edit');
            setCurrentView('profile');
          }}
          onLogout={() => {
            setSignupEmail('');
            localStorage.removeItem('rumi_token');
            localStorage.removeItem('rumi_user');
            setCurrentView('landing');
          }}
        />
      </div>
    );
  }

  if (currentView === 'signup') {
    return (
      <div className="w-full font-sans selection:bg-blue-200">
        <FontStyles />
        <SignupScreen 
          onNext={(email) => {
            setSignupEmail(email);
            setCurrentView('otp');
          }}
          onLogin={() => setCurrentView('landing')}
          initialEmail={signupEmail}
        />
      </div>
    );
  }

  if (currentView === 'otp') {
    return (
      <div className="w-full font-sans selection:bg-blue-200">
        <FontStyles />
        <OTPScreen
          email={signupEmail}
          onVerify={(code) => setCurrentView('success')}
          onBack={() => setCurrentView('signup')}
        />
      </div>
    );
  }

  if (currentView === 'success') {
    return (
      <div className="w-full font-sans selection:bg-blue-200">
        <FontStyles />
        <VerificationSuccessScreen 
          onContinue={() => {
            setProfileFlowMode('setup');
            setCurrentView('profile');
          }}
        />
      </div>
    );
  }

  if (currentView === 'profile') {
    return (
      <div className="w-full font-sans selection:bg-blue-200">
        <FontStyles />
        <ProfileSetupFlow 
          mode={profileFlowMode}
          onComplete={() => setCurrentView(profileFlowMode === 'edit' ? 'dashboard' : 'confirmation')} 
        />
      </div>
    );
  }

  if (currentView === 'confirmation') {
    return (
      <div className="w-full font-sans selection:bg-blue-200">
        <FontStyles />
        <FinalConfirmationScreen 
          onDashboard={() => setCurrentView('dashboard')} 
        />
      </div>
    );
  }

  if (currentView === 'signin') {
    return (
      <div className="w-full font-sans selection:bg-blue-200">
        <FontStyles />
        <SignInScreen 
          onLoginSuccess={(email) => {
            setSignupEmail(email);
            setCurrentView('dashboard');
          }}
          onForgotPassword={() => setCurrentView('forgot-password')}
          onSignup={() => setCurrentView('signup')}
        />
      </div>
    );
  }

  if (currentView === 'forgot-password') {
    return (
      <div className="w-full font-sans selection:bg-blue-200">
        <FontStyles />
        <ForgotPasswordFlow
          onBack={() => setCurrentView('signin')}
          onComplete={() => setCurrentView('signin')}
        />
      </div>
    );
  }

  return (
    <div className="w-full font-sans selection:bg-blue-200">
      <FontStyles />
      <Navbar onSignup={() => setCurrentView('signup')} onSignin={() => setCurrentView('signin')} />

      {/* Hero Section */}
      <section className="min-h-screen w-full relative overflow-hidden flex flex-col items-center">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#081A35] via-[#4E668A] to-[#E9E9E9] z-0"></div>
        
        {/* Ambient Lighting/Glow (Subtle) */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[500px] bg-blue-400/10 blur-[120px] rounded-full pointer-events-none"></div>
  
        <main className="relative z-10 container mx-auto px-4 pt-32 pb-20 flex flex-col items-center">
          
          {/* Hero Text */}
          <div className="text-center max-w-3xl mx-auto mb-16 relative">
             <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.6 }}
               className="flex justify-center mb-6"
             >
               <div className="bg-white/10 backdrop-blur-md border border-white/20 px-4 py-1.5 rounded-full flex items-center gap-2">
                 <span className="flex h-2 w-2 relative">
                   <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                   <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                 </span>
                 <span className="text-blue-50 text-xs font-medium tracking-wide uppercase">New Way to Live</span>
               </div>
             </motion.div>
  
             <motion.h1 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.6, delay: 0.1 }}
               className="text-5xl md:text-6xl font-bold text-white mb-6 leading-[1.1] tracking-tight drop-shadow-sm"
             >
               Find Your Perfect Flatmate <br className="hidden md:block"/>
               With <span className="text-blue-200">Smart Matching</span>
             </motion.h1>
             
             <motion.p 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.6, delay: 0.2 }}
               className="text-lg text-slate-200 mb-10 max-w-2xl mx-auto leading-relaxed font-light"
             >
               Rumi matches you with compatible flatmates based on lifestyle, habits, and preferences — so you find people, not just rooms.
             </motion.p>
             
             <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.6, delay: 0.3 }}
               className="flex flex-col sm:flex-row items-center justify-center gap-4"
             >
               <button onClick={() => setCurrentView('signup')} className="bg-[#0f172a] hover:bg-[#1e293b] text-white px-8 py-4 rounded-full font-semibold text-lg transition-all shadow-lg hover:shadow-2xl hover:-translate-y-1 w-full sm:w-auto">
                 Start Matching
               </button>
               <button className="bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white border border-white/30 px-8 py-4 rounded-full font-semibold text-lg transition-all w-full sm:w-auto">
                 Explore Features
               </button>
             </motion.div>
          </div>
  
          {/* Main Visual Area */}
          <div className="relative w-full max-w-5xl mx-auto h-[600px] flex justify-center items-center mt-8">
            
            {/* Central Phone */}
            <motion.div 
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4, type: "spring" }}
              className="relative z-30 w-[300px] md:w-[320px] h-[640px] bg-slate-900 rounded-[3rem] p-3 shadow-2xl border-4 border-slate-800"
              style={{ boxShadow: '0 50px 100px -20px rgba(0,0,0,0.5)' }}
            >
              <PhoneScreen />
            </motion.div>
  
            {/* Floating Cards - Left Side */}
            <FloatingCard 
              title="Clean & Quiet"
              subtitle="Prefers a tidy space and quiet evenings. Non-smoker."
              icon={Moon}
              colorClass="bg-indigo-500"
              className="hidden md:block -left-10 top-20 -rotate-6"
              buttonText="View Profile"
            />
  
             <FloatingCard 
              title="Designer Flatshare"
              subtitle="Looking for a creative roommate in Brooklyn."
              icon={Search}
              colorClass="bg-rose-500"
              className="hidden md:block left-0 bottom-32 rotate-6"
              buttonText="Apply Now"
            />
  
            {/* Floating Cards - Right Side */}
            <FloatingCard 
              title="Budget: ₹1200/mo"
              subtitle="Looking for a room in a shared apartment. Bills included."
              icon={DollarSign}
              colorClass="bg-emerald-500"
              className="hidden md:block -right-4 top-12 rotate-12"
              buttonText="Connect"
            />
  
            <FloatingCard 
              title="Pet Friendly"
              subtitle="I have a golden retriever named Max. He loves people!"
              icon={Coffee}
              colorClass="bg-amber-500"
              className="hidden md:block right-10 bottom-40 -rotate-3"
              buttonText="Meet Max"
            />
  
            {/* Decorative Elements (Grid lines like reference) */}
            <div className="absolute inset-0 z-0 pointer-events-none opacity-20">
               <div className="absolute top-1/2 left-0 right-0 h-px bg-white"></div>
               <div className="absolute left-1/4 top-0 bottom-0 w-px bg-white"></div>
               <div className="absolute right-1/4 top-0 bottom-0 w-px bg-white"></div>
            </div>
          </div>
        </main>
      </section>

      {/* PROBLEM STATEMENT SECTION */}
      <ProblemStatementSection />

      {/* CORE FEATURES SECTION */}
      <CoreFeaturesSection />

      {/* NEW MINIMAL SECTION */}
      <MinimalFeatureSection />

      {/* NEW HOW IT WORKS SECTION */}
      <HowItWorksSection />

      {/* TRUST & SAFETY SECTION */}
      <TrustSafetySection />

      {/* TESTIMONIALS SECTION */}
      <TestimonialsSection />

      {/* FOOTER */}
      <Footer />

      {/* CHATBOT */}
      <Chatbot />
    </div>
  );
}
