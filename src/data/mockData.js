// Demo data for Discover, Requests Received, Sent Requests, and Active Matches

const DEMO_DISCOVER = [
  {
    _id: 'mock-1',
    matchScore: 92,
    reasons: ['Similar budget', 'Clean & tidy', 'Non-smoker'],
    user: {
      _id: 'mock-u1',
      name: 'Emma Wilson',
      age: 24,
      bio: 'Software engineer who loves cooking and weekend hikes. Looking for a clean, respectful flatmate.',
      photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
      budgetRange: { min: 8, max: 12 },
      lifestylePreferences: {
        foodPreference: 'Vegetarian',
        sleepSchedule: 'early_sleeper',
        cleanlinessLevel: 'clean',
        smoking: 'no',
        guestPolicy: 'occasional',
      },
    },
  },
  {
    _id: 'mock-2',
    matchScore: 87,
    reasons: ['Same city', 'Similar routine'],
    user: {
      _id: 'mock-u2',
      name: 'Oliver Davis',
      age: 26,
      bio: 'Marketing professional. Prefer quiet evenings and a tidy space. Love coffee and podcasts.',
      photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
      budgetRange: { min: 10, max: 15 },
      lifestylePreferences: {
        foodPreference: 'No preference',
        sleepSchedule: 'early_sleeper',
        cleanlinessLevel: 'clean',
        smoking: 'no',
      },
    },
  },
  {
    _id: 'mock-3',
    matchScore: 91,
    reasons: ['Lifestyle match', 'Budget fit'],
    user: {
      _id: 'mock-u3',
      name: 'Lisa Anderson',
      age: 25,
      bio: 'Designer and plant mom. Looking for a friendly flatmate who respects shared spaces.',
      photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop',
      budgetRange: { min: 9, max: 14 },
      lifestylePreferences: {
        foodPreference: 'Vegetarian',
        sleepSchedule: 'night_owl',
        cleanlinessLevel: 'moderate',
        smoking: 'no',
        guestPolicy: 'occasional',
      },
    },
  },
  {
    _id: 'mock-4',
    matchScore: 88,
    reasons: ['Similar profession', 'Non-smoker'],
    user: {
      _id: 'mock-u4',
      name: 'James Mitchell',
      age: 28,
      bio: 'Data analyst. Early riser, gym enthusiast. Prefer a calm home after work.',
      photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop',
      budgetRange: { min: 12, max: 18 },
      lifestylePreferences: {
        foodPreference: 'No preference',
        sleepSchedule: 'early_sleeper',
        cleanlinessLevel: 'clean',
        smoking: 'no',
      },
    },
  },
  {
    _id: 'mock-5',
    matchScore: 85,
    reasons: ['Budget match', 'Clean & tidy'],
    user: {
      _id: 'mock-u5',
      name: 'Sophie Bennett',
      age: 26,
      bio: 'Teacher who loves baking and yoga. Looking for a respectful, easy-going flatmate.',
      photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop',
      budgetRange: { min: 8, max: 11 },
      lifestylePreferences: {
        foodPreference: 'Vegetarian',
        sleepSchedule: 'early_sleeper',
        cleanlinessLevel: 'clean',
        smoking: 'no',
        guestPolicy: 'rare',
      },
    },
  },
  {
    _id: 'mock-6',
    matchScore: 90,
    reasons: ['Same city', 'Lifestyle match'],
    user: {
      _id: 'mock-u6',
      name: 'Rahul Sharma',
      age: 27,
      bio: 'Developer, WFH most days. Prefer quiet workspace and shared cooking occasionally.',
      photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop',
      budgetRange: { min: 15, max: 22 },
      lifestylePreferences: {
        foodPreference: 'Vegetarian',
        sleepSchedule: 'night_owl',
        cleanlinessLevel: 'moderate',
        smoking: 'no',
      },
    },
  },
  {
    _id: 'mock-7',
    matchScore: 84,
    reasons: ['Non-smoker', 'Similar budget'],
    user: {
      _id: 'mock-u7',
      name: 'Priya Patel',
      age: 24,
      bio: 'Medical student. Need a peaceful place to study. Clean and considerate.',
      photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop',
      budgetRange: { min: 7, max: 10 },
      lifestylePreferences: {
        foodPreference: 'Vegetarian',
        sleepSchedule: 'early_sleeper',
        cleanlinessLevel: 'clean',
        smoking: 'no',
      },
    },
  },
  {
    _id: 'mock-8',
    matchScore: 89,
    reasons: ['Early riser', 'Clean & tidy'],
    user: {
      _id: 'mock-u8',
      name: 'Alex Rodriguez',
      age: 29,
      bio: 'Finance professional. Into fitness and meal prep. Looking for a like-minded flatmate.',
      photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop',
      budgetRange: { min: 14, max: 20 },
      lifestylePreferences: {
        foodPreference: 'No preference',
        sleepSchedule: 'early_sleeper',
        cleanlinessLevel: 'clean',
        smoking: 'no',
        guestPolicy: 'occasional',
      },
    },
  },
  {
    _id: 'mock-9',
    matchScore: 86,
    reasons: ['Budget fit', 'Non-smoker'],
    user: {
      _id: 'mock-u9',
      name: 'Maya Chen',
      age: 25,
      bio: 'Content writer. Love reading and minimalism. Prefer a quiet, organised home.',
      photo: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=400&fit=crop',
      budgetRange: { min: 10, max: 14 },
      lifestylePreferences: {
        foodPreference: 'Vegetarian',
        sleepSchedule: 'night_owl',
        cleanlinessLevel: 'clean',
        smoking: 'no',
      },
    },
  },
  {
    _id: 'mock-10',
    matchScore: 83,
    reasons: ['Similar routine', 'Clean'],
    user: {
      _id: 'mock-u10',
      name: 'David Kim',
      age: 26,
      bio: 'Startup founder. Works long hours but keeps common areas tidy. No pets.',
      photo: 'https://images.unsplash.com/photo-1507081323647-4d250478b919?w=400&h=400&fit=crop',
      budgetRange: { min: 18, max: 25 },
      lifestylePreferences: {
        foodPreference: 'No preference',
        sleepSchedule: 'night_owl',
        cleanlinessLevel: 'clean',
        smoking: 'no',
      },
    },
  },
];

// Requests received (people who sent you a request)
const DEMO_RECEIVED = [
  {
    _id: 'mock-req-r1',
    status: 'pending',
    matchScore: 87,
    fromUserId: {
      _id: 'mock-from-1',
      name: 'Oliver Davis',
      age: 26,
      photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
    },
  },
  {
    _id: 'mock-req-r2',
    status: 'pending',
    matchScore: 91,
    fromUserId: {
      _id: 'mock-from-2',
      name: 'Lisa Anderson',
      age: 25,
      photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
    },
  },
  {
    _id: 'mock-req-r3',
    status: 'pending',
    matchScore: 89,
    fromUserId: {
      _id: 'mock-from-3',
      name: 'Nina Williams',
      age: 27,
      photo: 'https://images.unsplash.com/photo-1545167622-3a6ac756afa4?w=100&h=100&fit=crop',
    },
  },
  {
    _id: 'mock-req-r4',
    status: 'pending',
    matchScore: 85,
    fromUserId: {
      _id: 'mock-from-4',
      name: 'Ryan Cooper',
      age: 28,
      photo: 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=100&h=100&fit=crop',
    },
  },
];

// Sent requests (requests you sent)
const DEMO_SENT = [
  {
    _id: 'mock-req-s1',
    status: 'pending',
    matchScore: 95,
    toUserId: {
      _id: 'mock-to-1',
      name: 'Sophie Bennett',
      age: 26,
      photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop',
    },
  },
  {
    _id: 'mock-req-s2',
    status: 'accepted',
    matchScore: 88,
    toUserId: {
      _id: 'mock-to-2',
      name: 'James Parker',
      age: 27,
      photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
    },
  },
];

// Active matches (mutual accepts)
const DEMO_ACTIVE_MATCHES = [
  {
    _id: 'mock-to-2',
    name: 'James Parker',
    age: 27,
    match: 88,
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
  },
  {
    _id: 'mock-active-2',
    name: 'Maya Chen',
    age: 25,
    match: 92,
    photo: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=100&h=100&fit=crop',
  },
  {
    _id: 'mock-active-3',
    name: 'Alex Rodriguez',
    age: 29,
    match: 87,
    photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop',
  },
];

export { DEMO_DISCOVER, DEMO_RECEIVED, DEMO_SENT, DEMO_ACTIVE_MATCHES };
