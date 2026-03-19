import React, { useEffect, useMemo, useState } from 'react';
import { 
  Home, 
  Search, 
  Heart, 
  MessageCircle, 
  User, 
  Settings, 
  LogOut, 
  Bell, 
  ChevronDown,
  TrendingUp,
  Users,
  Calendar,
  MapPin,
  DollarSign,
  CheckCircle2,
  Sparkles,
  BarChart3,
  Target,
  X,
  Edit,
  Send,
  Clock,
  Check,
  XCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '../ui/dropdown-menu';
import {
  getMatches,
  getReceivedRequests,
  getReceivedAcceptedRequests,
  getSentRequests,
  sendRequest,
  passRequest,
  acceptRequest,
  rejectRequest,
  getChatHistory,
  getProfile,
} from '../../services/api';
import { API_BASE_URL } from '../../services/api';

interface DashboardProps {
  onLogout: () => void;
  userEmail?: string;
  onEditProfile?: () => void;
}

export const Dashboard = ({ onLogout, userEmail, onEditProfile }: DashboardProps) => {
  const [activeNav, setActiveNav] = useState('dashboard');
  const [selectedMonth, setSelectedMonth] = useState('August 2025');
  const [showLoginNotice, setShowLoginNotice] = useState(false);

  const [loading, setLoading] = useState(false);
  const [swipeCards, setSwipeCards] = useState<any[]>([]);
  const [requestsReceived, setRequestsReceived] = useState<any[]>([]);
  const [sentRequests, setSentRequests] = useState<any[]>([]);
  const [activeMatches, setActiveMatches] = useState<any[]>([]);
  const [sending, setSending] = useState(false);

  const [chatWithUserId, setChatWithUserId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatLoading, setChatLoading] = useState(false);

  const [avatarSrc, setAvatarSrc] = useState<string>('');

  const normalizeImageUrl = (src?: string | null) => {
    if (!src) return '';
    const str = String(src);
    if (str.startsWith('http://') || str.startsWith('https://')) return str;
    if (str.startsWith('/')) return `${API_BASE_URL}${str}`;
    return `${API_BASE_URL}/${str}`;
  };

  const avgMatchScore = useMemo(() => {
    if (!swipeCards.length) return 0;
    const total = swipeCards.reduce((s, c) => s + (Number(c.match) || 0), 0);
    return Math.round(total / swipeCards.length);
  }, [swipeCards]);

  const nearbyMatchesCount = swipeCards.length;
  const lifestyleMatchScore = avgMatchScore;

  useEffect(() => {
    if (userEmail) {
      setShowLoginNotice(true);
      const t = window.setTimeout(() => setShowLoginNotice(false), 4000);
      return () => window.clearTimeout(t);
    }
  }, [userEmail]);

  const budgetToDisplay = (budgetRange: any) => {
    const minV = budgetRange?.min ?? 0;
    const thousand = Math.round(minV / 1000);
    return thousand;
  };

  const deriveTags = (u: any, reasons: string[] = []) => {
    const prefs = u?.lifestylePreferences || {};
    const tags: string[] = [];

    if (prefs.cleanlinessLevel === 'high') tags.push('Clean & Tidy');
    if (prefs.cleanlinessLevel === 'medium') tags.push('Moderate');
    if (prefs.cleanlinessLevel === 'low') tags.push('Relaxed');

    if (prefs.sleepSchedule === 'early_sleeper') tags.push('Early Riser');
    if (prefs.sleepSchedule === 'night_owl') tags.push('Night Owl');

    if (prefs.smoking === 'no') tags.push('Non-Smoker');
    if (prefs.smoking === 'yes') tags.push('Smoker');

    // Keep the card clean: only show a few tags.
    const reasonTags = (reasons || []).slice(0, 2);
    return [...tags, ...reasonTags].filter(Boolean).slice(0, 4);
  };

  const reloadDashboard = async () => {
    const token = localStorage.getItem('rumi_token');
    if (!token) {
      setSwipeCards([]);
      setRequestsReceived([]);
      setSentRequests([]);
      setActiveMatches([]);
      return;
    }

    setLoading(true);
    try {
      const [matchesRes, receivedRes, sentRes, receivedAcceptedRes] = await Promise.all([
        getMatches({ limit: 20 }),
        getReceivedRequests(),
        getSentRequests(),
        getReceivedAcceptedRequests(),
      ]);

      const matches = matchesRes?.data?.matches || [];
      const received = receivedRes?.data?.requests || [];
      const sent = sentRes?.data?.requests || [];
      const receivedAccepted = receivedAcceptedRes?.data?.requests || [];

      const mappedSwipe = matches.map((m: any) => {
        const u = m.user || m;
        const budgetDisplay = budgetToDisplay(u?.budgetRange);
        return {
          id: u._id,
          userId: u._id,
          name: u.name,
          age: u.age ?? '',
          image: u.photo || u.profilePicture || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
          match: m.matchScore ?? m.compatibility ?? 0,
          bio: u.bio || '',
          tags: deriveTags(u, m.reasons || []),
          budget: budgetDisplay,
        };
      });

      const mappedReceived = received.map((r: any) => {
        const u = r.fromUserId || {};
        return {
          id: r._id,
          name: u.name,
          age: u.age ?? '',
          image: u.photo || u.profilePicture || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
          match: r.matchScore ?? r.match ?? 0,
          userId: u._id,
          requestId: r._id,
        };
      });

      const mappedSent = sent.map((r: any) => {
        const u = r.toUserId || {};
        return {
          id: r._id,
          name: u.name,
          age: u.age ?? '',
          image: u.photo || u.profilePicture || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
          match: r.matchScore ?? r.match ?? 0,
          status: r.status,
          userId: u._id,
          requestId: r._id,
        };
      });

      // Active matches = accepted connections regardless of direction
      const activeMap = new Map<string, any>();

      mappedSent
        .filter((r: any) => r.status === 'accepted')
        .forEach((r: any) => activeMap.set(r.userId, r));

      receivedAccepted.forEach((r: any) => {
        const u = r.fromUserId || {};
        activeMap.set(u._id, {
          id: r._id,
          name: u.name,
          match: r.matchScore ?? r.match ?? 0,
          image: u.photo || u.profilePicture || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop',
          userId: u._id,
        });
      });

      setSwipeCards(mappedSwipe);
      setRequestsReceived(mappedReceived);
      setSentRequests(mappedSent);
      setActiveMatches(Array.from(activeMap.values()));
    } catch (e) {
      // Keep UI stable; just show empty cards.
      setSwipeCards([]);
      setRequestsReceived([]);
      setSentRequests([]);
      setActiveMatches([]);
      // eslint-disable-next-line no-console
      console.error('reloadDashboard error', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reloadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Load user avatar from localStorage so navbar matches the logged-in account.
    try {
      const raw = localStorage.getItem('rumi_user');
      if (!raw) return;
      const parsed = JSON.parse(raw);
      const src = parsed?.photo || parsed?.profilePicture || '';
      if (src) setAvatarSrc(normalizeImageUrl(src));
    } catch {
      // ignore
    }
  }, [userEmail]);

  useEffect(() => {
    // Prefer the real profile from backend so avatar updates after photo upload.
    const run = async () => {
      try {
        const res = await getProfile();
        const u = res?.data?.user;
        const src = u?.photo || u?.profilePicture;
        if (src) setAvatarSrc(normalizeImageUrl(src));
      } catch {
        // ignore (profile may not be ready, or token missing)
      }
    };
    if (localStorage.getItem('rumi_token')) run();
  }, []);

  useEffect(() => {
    if (activeNav !== 'messages') return;
    if (!chatWithUserId) return;

    const run = async () => {
      setChatLoading(true);
      try {
        const res = await getChatHistory(chatWithUserId);
        setChatMessages(res?.data?.messages || []);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('getChatHistory error', e);
        setChatMessages([]);
      } finally {
        setChatLoading(false);
      }
    };

    run();
  }, [activeNav, chatWithUserId]);

  const handleSwipe = async (direction: 'left' | 'right') => {
    const top = swipeCards[0];
    if (!top || sending) return;
    setSending(true);
    try {
      if (direction === 'left') {
        await passRequest(top.userId);
      } else {
        await sendRequest(top.userId);
      }
      await reloadDashboard();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('handleSwipe error', e);
    } finally {
      setSending(false);
    }
  };

  const quickActions = [
    { icon: MessageCircle, label: 'View Messages', color: 'blue' },
    { icon: Edit, label: 'Edit Preferences', color: 'purple' },
    { icon: User, label: 'Complete Profile', color: 'green' }
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-sm flex flex-col">
        {/* Logo */}
        <div className="p-6 flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Home size={18} className="text-white" />
          </div>
          <span className="text-xl font-semibold text-gray-900">Rumi</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-2">
          <button
            onClick={() => setActiveNav('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl mb-2 transition-colors ${
              activeNav === 'dashboard'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Home size={20} />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => setActiveNav('discover')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl mb-2 transition-colors ${
              activeNav === 'discover'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Search size={20} />
            <span>Discover Matches</span>
          </button>

          <button
            onClick={() => setActiveNav('matches')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl mb-2 transition-colors ${
              activeNav === 'matches'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Heart size={20} />
            <span>My Matches</span>
          </button>

          <button
            onClick={() => setActiveNav('messages')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl mb-2 transition-colors ${
              activeNav === 'messages'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <MessageCircle size={20} />
            <span>Messages</span>
          </button>

          <button
            onClick={() => setActiveNav('activity')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl mb-2 transition-colors ${
              activeNav === 'activity'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <BarChart3 size={20} />
            <span>Activity & Stats</span>
          </button>

          <button
            onClick={() => setActiveNav('profile')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl mb-2 transition-colors ${
              activeNav === 'profile'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <User size={20} />
            <span>Profile</span>
          </button>

          <button
            onClick={() => setActiveNav('settings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl mb-2 transition-colors ${
              activeNav === 'settings'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Settings size={20} />
            <span>Settings</span>
          </button>
        </nav>

        {/* AI Assistant Card */}
        <div className="mx-4 mb-4 p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl text-white">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={16} />
            <span className="text-sm font-semibold">AI in action</span>
          </div>
          <p className="text-xs leading-relaxed opacity-90">
            Find your perfect match! Explore and complete new matches with higher precision.
          </p>
        </div>

        {/* Logout */}
        <button
          onClick={onLogout}
          className="mx-4 mb-6 flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-xl transition-colors"
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Top Navigation Bar */}
        <header className="bg-white shadow-sm px-8 py-4 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>

            <div className="flex items-center gap-4">
              {/* Search */}
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search matches, locations, preferences"
                  className="pl-10 pr-4 py-2 bg-gray-100 border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-80"
                />
              </div>

              {/* Icons */}
              <button className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors relative">
                <Bell size={20} />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="w-10 h-10 rounded-full overflow-hidden focus:outline-none">
                    <img
                      src={avatarSrc || "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80"}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-72 bg-white text-gray-900 border border-gray-200 rounded-xl shadow-lg p-1 z-[100]"
                >
                  <DropdownMenuLabel className="flex flex-col gap-1">
                    <span className="text-sm font-semibold text-gray-900">Account</span>
                    <span className="text-xs text-gray-500 truncate">
                      {userEmail || 'Signed in'}
                    </span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={() => onEditProfile?.()}
                    className="gap-2"
                  >
                    <User size={16} /> Edit Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => setActiveNav('settings')}
                    className="gap-2"
                  >
                    <Settings size={16} /> Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={onLogout} className="gap-2 text-red-600">
                    <LogOut size={16} /> Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-8">
          {showLoginNotice && userEmail && (
            <div className="mb-6 rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3 text-emerald-800 text-sm">
              Logged in as <span className="font-semibold">{userEmail}</span>
            </div>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Column - Discover Matches (2/3 width) */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-3xl p-8 shadow-sm">
                <div className="mb-6">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-1">Discover Matches</h2>
                  <p className="text-gray-500">Swipe right to connect, left to pass.</p>
                </div>

                {/* Swipe Card Stack */}
                <div className="relative h-[600px] flex items-center justify-center">
                  <AnimatePresence>
                    {loading ? (
                      <div className="text-center text-gray-400">
                        <Users size={64} className="mx-auto mb-4 opacity-50" />
                        <p className="text-lg">Loading matches…</p>
                      </div>
                    ) : swipeCards.length > 0 ? (
                      swipeCards.map((card, index) => (
                        index < 3 && (
                          <motion.div
                            key={card.id}
                            className="absolute w-full max-w-md"
                            style={{
                              zIndex: swipeCards.length - index,
                            }}
                            initial={index === 0 ? { scale: 1, y: 0, opacity: 1 } : { scale: 0.95 - (index * 0.05), y: index * 10, opacity: 1 - (index * 0.3) }}
                            animate={{ scale: 1 - (index * 0.05), y: index * 10, opacity: 1 - (index * 0.3) }}
                            exit={{ x: 1000, opacity: 0, rotate: 45 }}
                            transition={{ duration: 0.3 }}
                          >
                            <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
                              {/* Profile Image */}
                              <div className="relative h-80">
                                <img
                                  src={card.image}
                                  alt={card.name}
                                  className="w-full h-full object-cover"
                                />
                                {/* Match Badge */}
                                <div className="absolute top-4 right-4 bg-emerald-500 text-white px-4 py-2 rounded-full font-semibold text-sm shadow-lg">
                                  {card.match}% Match
                                </div>
                              </div>

                              {/* Profile Details */}
                              <div className="p-6">
                                <h3 className="text-2xl font-semibold text-gray-900 mb-1">
                                  {card.name}, {card.age}
                                </h3>
                                <p className="text-gray-600 mb-4 leading-relaxed">
                                  {card.bio}
                                </p>

                                {/* Lifestyle Tags */}
                                <div className="flex flex-wrap gap-2 mb-4">
                                  {card.tags.map((tag, i) => (
                                    <span
                                      key={i}
                                      className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm font-medium"
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                </div>

                                {/* Budget */}
                                <div className="flex items-center gap-2 text-gray-700">
                                  <DollarSign size={20} className="text-blue-600" />
                                  <span className="font-semibold">Budget: ₹{card.budget}k/month</span>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )
                      ))
                    ) : (
                      <div className="text-center text-gray-400">
                        <Users size={64} className="mx-auto mb-4 opacity-50" />
                        <p className="text-lg">No more profiles to show</p>
                        <p className="text-sm">Check back later for new matches!</p>
                      </div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Action Buttons */}
                {swipeCards.length > 0 && (
                  <div className="flex items-center justify-center gap-6 mt-8">
                    <button
                      onClick={() => handleSwipe('left')}
                      disabled={sending || loading}
                      className="w-16 h-16 bg-red-50 hover:bg-red-100 rounded-full flex items-center justify-center text-red-500 transition-all hover:scale-110 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <X size={32} strokeWidth={2.5} />
                    </button>
                    <button
                      onClick={() => handleSwipe('right')}
                      disabled={sending || loading}
                      className="w-16 h-16 bg-emerald-50 hover:bg-emerald-100 rounded-full flex items-center justify-center text-emerald-500 transition-all hover:scale-110 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Heart size={32} strokeWidth={2.5} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Side Widgets */}
            <div className="space-y-6">
              {/* Messages (activeTab) */}
              {activeNav === 'messages' && (
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      <MessageCircle size={20} className="text-blue-600" />
                      Messages
                    </h3>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveNav('dashboard');
                        setChatWithUserId(null);
                        setChatMessages([]);
                      }}
                      className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm transition-colors"
                    >
                    Back
                    </button>
                  </div>

                  <div className="space-y-3 max-h-[320px] overflow-auto pr-2">
                    {chatLoading ? (
                      <p className="text-sm text-gray-500">Loading messages...</p>
                    ) : chatWithUserId ? (
                      chatMessages.length ? (
                        chatMessages.map((m) => (
                          <div
                            key={m._id}
                            className={`flex ${m.isOwn ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                                m.isOwn ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'
                              }`}
                            >
                              <div className="font-medium mb-1 text-xs opacity-90">
                                {m.isOwn ? 'You' : m.senderId?.name || 'User'}
                              </div>
                              <div className="whitespace-pre-wrap">{m.message}</div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500">No messages yet.</p>
                      )
                    ) : (
                      <p className="text-sm text-gray-500">Select an active match to view messages.</p>
                    )}
                  </div>

                  <div className="mt-4">
                    <input
                      disabled
                      value="Messaging sending is not enabled in this design build."
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-500"
                    />
                  </div>
                </div>
              )}

              {/* Requests Received */}
              {activeNav !== 'messages' && (
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Heart size={20} className="text-blue-600" />
                  Requests Received
                </h3>
                <div className="space-y-4">
                  {requestsReceived.map((request) => (
                    <div key={request.id} className="space-y-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={request.image}
                          alt={request.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 text-sm">
                            {request.name}, {request.age}
                          </p>
                          <p className="text-xs text-emerald-600 font-medium">
                            {request.match}% Match
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              setSending(true);
                              await acceptRequest({ requestId: request.requestId });
                              await reloadDashboard();
                            } finally {
                              setSending(false);
                            }
                          }}
                          disabled={sending}
                          className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                          Accept & Chat
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              setSending(true);
                              await rejectRequest({ requestId: request.requestId });
                              await reloadDashboard();
                            } finally {
                              setSending(false);
                            }
                          }}
                          disabled={sending}
                          className="flex-1 px-3 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              )}

              {/* Sent Requests */}
              {activeNav !== 'messages' && (
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Send size={20} className="text-blue-600" />
                  Sent Requests
                </h3>
                <div className="space-y-3">
                  {sentRequests.map((request) => (
                    <div key={request.id} className="flex items-center gap-3">
                      <img
                        src={request.image}
                        alt={request.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm truncate">
                          {request.name}, {request.age}
                        </p>
                        <p className="text-xs text-gray-500">{request.match}% Match</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        request.status === 'pending' ? 'bg-yellow-50 text-yellow-600' :
                        request.status === 'accepted' ? 'bg-emerald-50 text-emerald-600' :
                        'bg-red-50 text-red-600'
                      }`}>
                        {request.status === 'pending' && <Clock size={12} className="inline mr-1" />}
                        {request.status === 'accepted' && <Check size={12} className="inline mr-1" />}
                        {request.status === 'rejected' && <XCircle size={12} className="inline mr-1" />}
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              )}

              {/* Active Matches */}
              {activeNav !== 'messages' && (
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Users size={20} className="text-blue-600" />
                  Active Matches
                </h3>
                <div className="space-y-3">
                  {activeMatches.map((match) => (
                    <div key={match.id} className="flex items-center gap-3">
                      <img
                        src={match.image}
                        alt={match.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm truncate">
                          {match.name}
                        </p>
                        <p className="text-xs text-emerald-600 font-medium">{match.match}% Match</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setChatWithUserId(match.userId ?? match.id);
                          setActiveNav('messages');
                        }}
                        className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white hover:bg-blue-700 transition-colors"
                      >
                        <MessageCircle size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              )}

              {/* Quick Actions */}
              {activeNav !== 'messages' && (
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  {quickActions.map((action, index) => {
                    const Icon = action.icon;
                    return (
                      <button
                        key={index}
                        className="w-full flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
                      >
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          action.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                          action.color === 'purple' ? 'bg-purple-100 text-purple-600' :
                          'bg-emerald-100 text-emerald-600'
                        }`}>
                          <Icon size={20} />
                        </div>
                        <span className="text-sm font-medium text-gray-700">{action.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              )}

              {/* Compatibility Insights */}
              {activeNav !== 'messages' && (
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Target size={20} className="text-blue-600" />
                  Compatibility Insights
                </h3>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="relative inline-flex items-center justify-center w-24 h-24 mb-2">
                      <svg className="w-full h-full -rotate-90">
                        <circle 
                          cx="48"
                          cy="48"
                          r="40"
                          stroke="#E5E7EB"
                          strokeWidth="8"
                          fill="none"
                        />
                        <circle
                          cx="48"
                          cy="48"
                          r="40"
                          stroke="#3B82F6"
                          strokeWidth="8"
                          fill="none"
                          strokeDasharray={`${2 * Math.PI * 40}`}
                          strokeDashoffset={`${2 * Math.PI * 40 * (1 - (avgMatchScore / 100 || 0))}`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <span className="absolute text-2xl font-bold text-gray-900">{avgMatchScore}%</span>
                    </div>
                    <p className="text-sm text-gray-600">Average Match Score</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-3 bg-blue-50 rounded-xl">
                      <p className="text-2xl font-bold text-blue-600">{nearbyMatchesCount}</p>
                      <p className="text-xs text-gray-600">Nearby Matches</p>
                    </div>
                    <div className="text-center p-3 bg-emerald-50 rounded-xl">
                      <p className="text-2xl font-bold text-emerald-600">{lifestyleMatchScore}%</p>
                      <p className="text-xs text-gray-600">Lifestyle Match</p>
                    </div>
                  </div>
                </div>
              </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};