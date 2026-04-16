import React, { useEffect, useMemo, useState, useRef } from 'react';
import { 
  Home, 
  Search, 
  Heart, 
  MessageCircle, 
  User, 
  Settings, 
  LogOut, 
  Bell, 
  ChevronLeft,
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
  XCircle,
  PenLine,
  Lock,
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
  getRecommendedRooms,
} from '../../services/api';
import { API_BASE_URL } from '../../services/api';
import { getChatSocket } from '../../services/chatSocket';
import { RecommendedRoomsSection } from '../explore/RecommendedRoomsSection';
import { RoomDetailsModal } from '../explore/RoomDetailsModal';
import { OfferRoomDashboard } from '../offer/OfferRoomDashboard';

interface DashboardProps {
  onLogout: () => void;
  userEmail?: string;
  onEditProfile?: () => void;
}

/** Normalize search input for case-insensitive substring match. */
function normalizeSearchQuery(q: string) {
  return q.trim().toLowerCase();
}

/** Build a single lowercase string from lifestyle prefs for search (e.g. "veg", "night_owl"). */
function lifestylePreferencesSearchText(prefs: Record<string, unknown> | undefined) {
  if (!prefs || typeof prefs !== 'object') return '';
  return Object.entries(prefs)
    .map(([k, v]) => `${k} ${v ?? ''}`)
    .join(' ')
    .toLowerCase();
}

function discoverCardMatchesSearch(card: any, qLower: string) {
  if (!qLower) return true;
  const pref = (card.preferenceText as string) || '';
  const tagStr = (card.tags || []).join(' ').toLowerCase();
  const haystack = [
    card.name,
    card.bio,
    card.city,
    card.state,
    card.profession,
    card.gender,
    card.intent,
    tagStr,
    pref,
    String(card.match ?? ''),
    String(card.budget ?? ''),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return haystack.includes(qLower);
}

function roomMatchesSearch(room: any, qLower: string) {
  if (!qLower) return true;
  const loc = room?.location || {};
  const tagStr = (Array.isArray(room?.tags) ? room.tags : []).join(' ').toLowerCase();
  const haystack = [
    loc.area,
    loc.city,
    loc.state,
    loc.address,
    loc.pincode,
    room?.propertyType,
    room?.roomDescription,
    tagStr,
    String(room?.monthlyRent ?? ''),
    String(room?.compatibility ?? room?.matchScore ?? ''),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return haystack.includes(qLower);
}

export const Dashboard = ({ onLogout, userEmail, onEditProfile }: DashboardProps) => {
  const [activeNav, setActiveNav] = useState('dashboard');
  const [selectedMonth, setSelectedMonth] = useState('August 2025');
  const [showLoginNotice, setShowLoginNotice] = useState(false);

  const [renderOfferDashboard, setRenderOfferDashboard] = useState(false);
  const [intentResolved, setIntentResolved] = useState(false);

  const [loading, setLoading] = useState(false);
  const [swipeCards, setSwipeCards] = useState([]);
  const [requestsReceived, setRequestsReceived] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [activeMatches, setActiveMatches] = useState([]);
  const [sending, setSending] = useState(false);

  const [chatWithUserId, setChatWithUserId] = useState(null);
  const [chatRoomId, setChatRoomId] = useState(null as string | null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatDraft, setChatDraft] = useState('');
  const [chatSending, setChatSending] = useState(false);
  const [chatListSearch, setChatListSearch] = useState('');
  const [chatListFilter, setChatListFilter] = useState('all' as 'all' | 'listing' | 'direct');
  const [inboxPreviews, setInboxPreviews] = useState(
    {} as Record<string, { preview: string; time: string }>
  );

  const [avatarSrc, setAvatarSrc] = useState('');
  const [isExploreLocked, setIsExploreLocked] = useState(false);
  const [recommendedRooms, setRecommendedRooms] = useState([]);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [revealExploreMatches, setRevealExploreMatches] = useState(false);
  const [showExploreProfileModal, setShowExploreProfileModal] = useState(false);
  const scrollTriggerCountRef = useRef(0);
  const explorePromptShownRef = useRef(false);

  const [roomDetailsOpen, setRoomDetailsOpen] = useState(false);
  const [roomDetailsRoom, setRoomDetailsRoom] = useState(null);
  const [dashboardSearch, setDashboardSearch] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileUser, setProfileUser] = useState(null as any | null);
  const [settingsEmailUpdates, setSettingsEmailUpdates] = useState(true);
  const [settingsPushUpdates, setSettingsPushUpdates] = useState(true);

  const normalizeImageUrl = (src?: string | null) => {
    if (!src) return '';
    const str = String(src);
    if (str.startsWith('http://') || str.startsWith('https://')) return str;
    if (str.startsWith('/')) return `${API_BASE_URL}${str}`;
    return `${API_BASE_URL}/${str}`;
  };

  const readStoredUserId = () => {
    try {
      const u = JSON.parse(localStorage.getItem('rumi_user') || '{}');
      const id = u?._id ?? u?.id;
      return id ? String(id) : '';
    } catch {
      return '';
    }
  };

  const filteredSwipeCards = useMemo(() => {
    const q = normalizeSearchQuery(dashboardSearch);
    if (!q) return swipeCards;
    return swipeCards.filter((c: any) => discoverCardMatchesSearch(c, q));
  }, [swipeCards, dashboardSearch]);

  const filteredRecommendedRooms = useMemo(() => {
    const q = normalizeSearchQuery(dashboardSearch);
    if (!q) return recommendedRooms;
    return recommendedRooms.filter((r: any) => roomMatchesSearch(r, q));
  }, [recommendedRooms, dashboardSearch]);

  const avgMatchScore = useMemo(() => {
    if (!filteredSwipeCards.length) return 0;
    const total = filteredSwipeCards.reduce((s, c) => s + (Number(c.match) || 0), 0);
    return Math.round(total / filteredSwipeCards.length);
  }, [filteredSwipeCards]);

  const nearbyMatchesCount = filteredSwipeCards.length;
  const lifestyleMatchScore = avgMatchScore;

  const showFindRoomSideWidgets = useMemo(() => {
    return (
      activeNav !== 'messages' &&
      activeNav !== 'matches' &&
      activeNav !== 'profile' &&
      activeNav !== 'settings'
    );
  }, [activeNav]);

  const selectedChatMatch = useMemo(() => {
    if (!chatWithUserId) return null;
    const uid = String(chatWithUserId);
    const rid = chatRoomId ? String(chatRoomId) : '';
    const rowId = (m: any) => String(m.userId ?? m.id ?? m.user?._id ?? '').trim();
    const exact = (activeMatches as any[]).find(
      (m) => rowId(m) === uid && String(m.roomId || '') === rid
    );
    if (exact) return exact;
    return (activeMatches as any[]).find((m) => rowId(m) === uid) || null;
  }, [activeMatches, chatWithUserId, chatRoomId]);

  const filteredChatMatches = useMemo(() => {
    const list = activeMatches as any[];
    const q = chatListSearch.trim().toLowerCase();
    let out = list.filter((m) => !q || String(m.name || '').toLowerCase().includes(q));
    if (chatListFilter === 'listing') out = out.filter((m) => m.roomId);
    if (chatListFilter === 'direct') out = out.filter((m) => !m.roomId);
    return out;
  }, [activeMatches, chatListSearch, chatListFilter]);

  useEffect(() => {
    if (activeNav !== 'messages') return;
    const matches = activeMatches as any[];
    if (!matches.length) {
      setInboxPreviews({});
      return;
    }
    if (!localStorage.getItem('rumi_token')) return;

    let cancelled = false;
    (async () => {
      const pairs = (
        await Promise.all(
          matches.map(async (m) => {
            const oid = String(m.userId ?? m.id ?? m.user?._id ?? '').trim();
            if (!oid) return null;
            const key = `${oid}-${m.roomId || 'explore'}`;
            try {
              const res = await getChatHistory(oid, m.roomId || null);
              const msgs = res?.data?.messages || [];
              const last = msgs.length ? msgs[msgs.length - 1] : null;
              if (!last) {
                return [
                  key,
                  {
                    preview: m.roomId
                      ? 'Listing · start the conversation'
                      : `${m.match ?? 0}% match`,
                    time: '',
                  },
                ] as const;
              }
              const time = last.timestamp
                ? new Date(last.timestamp).toLocaleTimeString([], {
                    hour: 'numeric',
                    minute: '2-digit',
                  })
                : '';
              const snippet = String(last.message || '').replace(/\s+/g, ' ').trim();
              const short = snippet.length > 42 ? `${snippet.slice(0, 42)}…` : snippet;
              const preview = last.isOwn ? `You: ${short}` : short;
              return [key, { preview, time }] as const;
            } catch {
              return [key, { preview: 'Tap to open chat', time: '' }] as const;
            }
          })
        )
      ).filter(Boolean) as Array<readonly [string, { preview: string; time: string }]>;
      if (!cancelled) {
        setInboxPreviews(Object.fromEntries(pairs) as Record<string, { preview: string; time: string }>);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeNav, activeMatches]);

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
        const rawImg = u?.photo || u?.profilePicture;
        const baseTags = deriveTags(u, m.reasons || []);
        const hasRoom = u?.intent === 'offer';
        const tags = hasRoom ? ['Has a room', ...baseTags].slice(0, 4) : baseTags;
        const city =
          [u?.city, u?.location?.city].filter(Boolean).join(' ').trim() || '';
        const state = u?.location?.state || '';
        return {
          id: u._id,
          userId: u._id,
          name: u.name,
          age: u.age ?? '',
        image: rawImg ? normalizeImageUrl(rawImg) : 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
          match: m.matchScore ?? m.compatibility ?? 0,
          bio: u.bio || '',
          tags,
          hasRoom,
          budget: budgetDisplay,
          city,
          state,
          profession: u?.profession || '',
          gender: u?.gender || '',
          intent: u?.intent || '',
          preferenceText: lifestylePreferencesSearchText(u?.lifestylePreferences),
        };
      });

      const mappedReceived = received.map((r: any) => {
        const u = r.fromUserId || {};
        const rid = r.roomId?._id || r.roomId;
        const ridStr = rid ? String(rid) : null;
        const rm = r.roomId && typeof r.roomId === 'object' ? r.roomId : null;
        const roomLabel =
          rm?.propertyType || rm?.location?.city
            ? [rm?.propertyType, rm?.location?.city].filter(Boolean).join(' · ')
            : ridStr
              ? 'Room invite'
              : null;
        return {
          id: r._id,
          name: u.name,
          age: u.age ?? '',
          image: u.photo || u.profilePicture || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
          match: r.matchScore ?? r.match ?? 0,
          userId: u._id,
          requestId: r._id,
          roomId: ridStr,
          roomLabel,
        };
      });

      const mappedSent = sent.map((r: any) => {
        const u = r.toUserId || {};
        const rid = r.roomId?._id || r.roomId;
        const ridStr = rid ? String(rid) : null;
        return {
          id: r._id,
          name: u.name,
          age: u.age ?? '',
          image: u.photo || u.profilePicture || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
          match: r.matchScore ?? r.match ?? 0,
          status: r.status,
          userId: u._id,
          requestId: r._id,
          roomId: ridStr,
        };
      });

      // Active matches = accepted connections (explore + per-listing room threads)
      const activeMap = new Map<string, any>();

      mappedSent
        .filter((r: any) => r.status === 'accepted')
        .forEach((r: any) => {
          const key = r.roomId ? `${r.userId}:${r.roomId}` : String(r.userId);
          activeMap.set(key, {
            id: r.id,
            name: r.name,
            match: r.match,
            image: r.image,
            userId: r.userId,
            roomId: r.roomId,
          });
        });

      receivedAccepted.forEach((r: any) => {
        const u = r.fromUserId || {};
        const rid = r.roomId?._id || r.roomId;
        const ridStr = rid ? String(rid) : null;
        const key = ridStr ? `${u._id}:${ridStr}` : String(u._id);
        activeMap.set(key, {
          id: r._id,
          name: u.name,
          match: r.matchScore ?? r.match ?? 0,
          image: u.photo || u.profilePicture || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop',
          userId: u._id,
          roomId: ridStr,
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
    const run = async () => {
      const token = localStorage.getItem('rumi_token');
      if (!token) {
        setIntentResolved(true);
        return;
      }

      try {
        const res = await getProfile();
        const u = res?.data?.user;

        if (u?.intent === 'offer') {
          setRenderOfferDashboard(true);
          setIntentResolved(true);
          return;
        }

        const exploreLocked = u?.intent === 'explore' && !u?.profileCompleted;
        setIsExploreLocked(Boolean(exploreLocked));

        setRoomsLoading(true);
        try {
            const roomsRes = await getRecommendedRooms(30);
          setRecommendedRooms(roomsRes?.data?.rooms || []);
        } finally {
          setRoomsLoading(false);
        }

        if (exploreLocked) {
          setSwipeCards([]);
          setRequestsReceived([]);
          setSentRequests([]);
          setActiveMatches([]);
        } else {
          reloadDashboard();
        }
        setIntentResolved(true);
      } catch {
        reloadDashboard();
        setIntentResolved(true);
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // In "Just Exploring" mode we start with room recommendations only.
  // After a few scrolls, we reveal matching profiles and show a full-screen lock prompt.
  useEffect(() => {
    if (!isExploreLocked) {
      scrollTriggerCountRef.current = 0;
      explorePromptShownRef.current = false;
      setRevealExploreMatches(false);
      setShowExploreProfileModal(false);
      return;
    }

    const onScroll = () => {
      if (explorePromptShownRef.current) return;
      scrollTriggerCountRef.current += 1;

      // "After a few scrolls"
      if (scrollTriggerCountRef.current >= 4) {
        explorePromptShownRef.current = true;
        setRevealExploreMatches(true);
        setShowExploreProfileModal(true);
        reloadDashboard();
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [isExploreLocked]);

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
    if (activeNav !== 'profile' && activeNav !== 'settings') return;
    if (!localStorage.getItem('rumi_token')) return;
    let cancelled = false;
    (async () => {
      try {
        setProfileLoading(true);
        const res = await getProfile();
        const u = res?.data?.user || null;
        if (!cancelled) setProfileUser(u);
      } catch {
        if (!cancelled) setProfileUser(null);
      } finally {
        if (!cancelled) setProfileLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeNav]);

  useEffect(() => {
    if (activeNav !== 'messages') return;
    if (!chatWithUserId) return;

    const run = async () => {
      setChatLoading(true);
      try {
        const res = await getChatHistory(String(chatWithUserId), chatRoomId);
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
  }, [activeNav, chatWithUserId, chatRoomId]);

  useEffect(() => {
    if (activeNav !== 'messages' || !chatWithUserId) return;
    const s = getChatSocket();
    if (!s) return;

    const meId = readStoredUserId();
    if (!meId) return;

    const onIncoming = (payload: any) => {
      const other = String(chatWithUserId);
      const a = String(payload.senderId ?? '');
      const b = String(payload.receiverId ?? '');
      const pairOk =
        (a === meId && b === other) || (a === other && b === meId);
      if (!pairOk) return;
      const pRoom = payload.roomId ? String(payload.roomId) : '';
      const cRoom = chatRoomId ? String(chatRoomId) : '';
      if (pRoom !== cRoom) return;

      setChatMessages((prev) => {
        if (prev.some((m: any) => String(m._id) === String(payload._id))) return prev;
        return [
          ...prev,
          {
            _id: payload._id,
            message: payload.message,
            senderId: { _id: a, name: '' },
            isOwn: a === meId,
            timestamp: payload.timestamp,
          },
        ];
      });
    };

    s.on('message', onIncoming);
    return () => {
      s.off('message', onIncoming);
    };
  }, [activeNav, chatWithUserId, chatRoomId]);

  const handleSwipe = async (direction: 'left' | 'right') => {
    const top = filteredSwipeCards[0];
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

  const handleSendChat = async () => {
    const text = chatDraft.trim();
    if (!text || !chatWithUserId || chatSending) return;
    const sock = getChatSocket();
    if (!sock) return;
    if (!sock.connected) sock.connect();

    setChatSending(true);
    const payload: { receiverId: string; message: string; roomId?: string } = {
      receiverId: String(chatWithUserId),
      message: text,
    };
    if (chatRoomId) payload.roomId = String(chatRoomId);

    const failSafe = window.setTimeout(() => setChatSending(false), 12000);
    const onSent = async () => {
      window.clearTimeout(failSafe);
      sock.off('message_sent', onSent);
      sock.off('error', onSockErr);
      setChatDraft('');
      setChatSending(false);
      try {
        const res = await getChatHistory(String(chatWithUserId), chatRoomId);
        setChatMessages(res?.data?.messages || []);
      } catch {
        // ignore
      }
    };
    const onSockErr = (err: any) => {
      window.clearTimeout(failSafe);
      sock.off('message_sent', onSent);
      sock.off('error', onSockErr);
      setChatSending(false);
      // eslint-disable-next-line no-console
      console.error('chat socket error:', err);
    };
    sock.once('message_sent', onSent);
    sock.once('error', onSockErr);
    sock.emit('message', payload);
  };

  const quickActions = [
    { icon: MessageCircle, label: 'View Messages', color: 'blue' },
    { icon: Edit, label: 'Edit Preferences', color: 'purple' },
    { icon: User, label: 'Complete Profile', color: 'green' }
  ];

  if (!intentResolved) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    );
  }

  if (renderOfferDashboard) {
    return (
      <OfferRoomDashboard
        onLogout={onLogout}
        userEmail={userEmail}
        onEditProfile={onEditProfile}
      />
    );
  }

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
            onClick={() => {
              setActiveNav('messages');
              setChatWithUserId(null);
              setChatRoomId(null);
              setChatMessages([]);
              setChatDraft('');
            }}
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
      <main className="flex-1 overflow-auto flex flex-col min-h-0">
        {/* Top Navigation Bar */}
        <header className="bg-white shadow-sm px-8 py-4 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-gray-900">
              {activeNav === 'messages'
                ? 'Messages'
                : activeNav === 'discover'
                  ? 'Discover Matches'
                  : activeNav === 'matches'
                    ? 'My Matches'
                    : activeNav === 'activity'
                      ? 'Activity & Stats'
                      : activeNav === 'profile'
                        ? 'Profile'
                        : activeNav === 'settings'
                          ? 'Settings'
                          : 'Dashboard'}
            </h1>

            <div className="flex items-center gap-4">
              {/* Search */}
              {activeNav !== 'messages' && activeNav !== 'settings' && (
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="search"
                  value={dashboardSearch}
                  onChange={(e) => setDashboardSearch(e.target.value)}
                  placeholder="Search matches, locations, preferences"
                  autoComplete="off"
                  className="pl-10 pr-4 py-2 bg-gray-100 border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-80"
                />
              </div>
              )}

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
        <div
          className={
            activeNav === 'messages'
              ? 'p-3 md:p-6 flex-1 flex flex-col min-h-0'
              : 'p-8'
          }
        >
          {showLoginNotice && userEmail && activeNav !== 'messages' && (
            <div className="mb-6 rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3 text-emerald-800 text-sm">
              Logged in as <span className="font-semibold">{userEmail}</span>
            </div>
          )}

          {activeNav === 'messages' ? (
            <div className="flex rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden flex-1 min-h-[480px] md:min-h-[calc(100vh-9.5rem)] max-h-[calc(100vh-9.5rem)]">
              {/* Chat list — light WhatsApp-style desktop */}
              <aside
                className={`flex flex-col w-full md:w-[min(100%,400px)] md:max-w-[400px] flex-shrink-0 bg-white border-r border-gray-200 ${
                  chatWithUserId ? 'hidden md:flex' : 'flex'
                }`}
              >
                <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
                  <h2 className="text-xl font-bold text-gray-900 tracking-tight">Chats</h2>
                  <button
                    type="button"
                    className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors"
                    aria-label="Compose"
                    title="New message"
                  >
                    <PenLine size={20} strokeWidth={2} />
                  </button>
                </div>

                <div className="px-3 py-2 bg-white border-b border-gray-100">
                  <div className="relative">
                    <Search
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                    />
                    <input
                      type="search"
                      value={chatListSearch}
                      onChange={(e) => setChatListSearch(e.target.value)}
                      placeholder="Search chats"
                      className="w-full pl-9 pr-3 py-2 rounded-lg bg-gray-100 border-0 text-sm text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-gray-200 focus:bg-white outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="flex gap-2 px-3 py-2 bg-white border-b border-gray-100 flex-wrap">
                  {(
                    [
                      { id: 'all' as const, label: 'All' },
                      { id: 'listing' as const, label: 'Listings' },
                      { id: 'direct' as const, label: 'Direct' },
                    ]
                  ).map(({ id, label }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setChatListFilter(id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        chatListFilter === id
                          ? 'bg-gray-200 text-gray-900'
                          : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <div className="flex-1 overflow-y-auto bg-white">
                  {(activeMatches as any[]).length === 0 ? (
                    <div className="p-8 text-center">
                      <MessageCircle className="mx-auto mb-3 text-gray-200" size={44} strokeWidth={1.25} />
                      <p className="text-sm font-medium text-gray-700">No conversations yet</p>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                        Accept a match from the dashboard to start chatting.
                      </p>
                    </div>
                  ) : filteredChatMatches.length === 0 ? (
                    <div className="p-8 text-center text-sm text-gray-500">No chats match your search.</div>
                  ) : (
                    filteredChatMatches.map((match: any) => {
                      const otherId = String(match.userId ?? match.id ?? match.user?._id ?? '').trim();
                      if (!otherId) return null;
                      const rowKey = `${otherId}-${match.roomId || 'explore'}`;
                      const isActive =
                        chatWithUserId &&
                        String(chatWithUserId) === otherId &&
                        String(chatRoomId || '') === String(match.roomId || '');
                      const imgSrc = match.image
                        ? normalizeImageUrl(match.image)
                        : 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop';
                      const meta = inboxPreviews[rowKey];
                      return (
                        <button
                          key={rowKey}
                          type="button"
                          onClick={() => {
                            setChatWithUserId(otherId);
                            setChatRoomId(match.roomId ? String(match.roomId) : null);
                          }}
                          className={`w-full flex items-start gap-3 px-4 py-3 text-left border-b border-gray-100 transition-colors ${
                            isActive ? 'bg-gray-100' : 'bg-white hover:bg-gray-50'
                          }`}
                        >
                          <img
                            src={imgSrc}
                            alt=""
                            className="w-12 h-12 rounded-full object-cover bg-gray-100 flex-shrink-0 ring-1 ring-gray-100"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline justify-between gap-2">
                              <p className="font-semibold text-gray-900 text-[15px] truncate">
                                {match.name}
                              </p>
                              {meta?.time ? (
                                <span className="text-[11px] text-gray-400 flex-shrink-0 tabular-nums">
                                  {meta.time}
                                </span>
                              ) : null}
                            </div>
                            <p className="text-[13px] text-gray-500 truncate mt-0.5 leading-snug">
                              {meta?.preview ||
                                (match.roomId
                                  ? 'Listing conversation'
                                  : `${match.match ?? 0}% match`)}
                            </p>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </aside>

              {/* Conversation pane — white / soft gray */}
              <section
                className={`flex flex-col flex-1 min-w-0 bg-[#f8fafc] ${
                  chatWithUserId ? 'flex' : 'hidden md:flex'
                }`}
              >
                {!chatWithUserId ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center px-8 py-12 bg-[#fafbfc]">
                    <div className="w-[120px] h-[120px] rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-sm mb-6">
                      <MessageCircle
                        className="text-[#25D366]"
                        size={56}
                        strokeWidth={1.15}
                      />
                    </div>
                    <p className="text-[26px] font-light text-gray-800 tracking-tight">
                      Rumi Messenger
                    </p>
                    <p className="text-sm text-gray-500 mt-3 max-w-sm leading-relaxed">
                      Select a chat from your list to view messages and reply. Your sidebar stays available for the rest of Rumi.
                    </p>
                    <p className="inline-flex items-center gap-1.5 text-xs text-[#25D366] mt-12 font-medium">
                      <Lock size={12} strokeWidth={2.5} aria-hidden />
                      Messages are private between you and your matches.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 bg-white shrink-0">
                      <button
                        type="button"
                        className="md:hidden p-2 rounded-full hover:bg-gray-100 text-gray-700 -ml-1"
                        aria-label="Back to chats"
                        onClick={() => {
                          setChatWithUserId(null);
                          setChatRoomId(null);
                          setChatMessages([]);
                          setChatDraft('');
                        }}
                      >
                        <ChevronLeft size={22} />
                      </button>
                      <img
                        src={
                          selectedChatMatch?.image
                            ? normalizeImageUrl(selectedChatMatch.image)
                            : 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop'
                        }
                        alt=""
                        className="w-10 h-10 rounded-full object-cover ring-1 ring-gray-100"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-gray-900 truncate text-[15px]">
                          {selectedChatMatch?.name || 'Chat'}
                        </p>
                        {selectedChatMatch?.roomId ? (
                          <p className="text-xs text-gray-500 truncate">Listing conversation</p>
                        ) : (
                          <p className="text-xs text-gray-500 truncate">Direct message</p>
                        )}
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 min-h-0 bg-[#f0f4f8]">
                      {chatLoading ? (
                        <p className="text-sm text-gray-500 text-center py-8">Loading messages…</p>
                      ) : chatMessages.length ? (
                        chatMessages.map((m: any) => (
                          <div
                            key={m._id}
                            className={`flex ${m.isOwn ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[78%] px-3 py-2 rounded-lg text-[14px] leading-snug shadow-sm border ${
                                m.isOwn
                                  ? 'bg-[#d9fdd3] text-gray-900 border-[#b8e8bc] rounded-br-sm'
                                  : 'bg-white text-gray-900 border-gray-200/80 rounded-bl-sm'
                              }`}
                            >
                              <div className="whitespace-pre-wrap break-words">{m.message}</div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                          <p className="text-sm text-gray-500">No messages yet</p>
                          <p className="text-xs text-gray-400 mt-1">Send a message below to say hello</p>
                        </div>
                      )}
                    </div>

                    <div className="p-3 bg-white border-t border-gray-200 flex gap-2 shrink-0">
                      <input
                        value={chatDraft}
                        onChange={(e) => setChatDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            void handleSendChat();
                          }
                        }}
                        disabled={chatSending}
                        placeholder="Type a message…"
                        className="flex-1 px-4 py-2.5 rounded-full border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-[#25D366]/30 focus:border-[#25D366] outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => void handleSendChat()}
                        disabled={chatSending || !chatDraft.trim()}
                        className="px-6 py-2.5 rounded-full bg-[#25D366] text-white text-sm font-semibold hover:bg-[#20bd5a] disabled:opacity-45 disabled:cursor-not-allowed transition-colors shadow-sm"
                      >
                        Send
                      </button>
                    </div>
                  </>
                )}
              </section>
            </div>
          ) : (
          <>
            {activeNav === 'matches' ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Your matches</h2>
                    <p className="text-sm text-gray-500 mt-1">
                      These are accepted connections. Tap to message in real time.
                    </p>
                  </div>
                  <div className="text-xs text-gray-500">{activeMatches.length} total</div>
                </div>

                <div className="p-4">
                  {(activeMatches as any[]).length === 0 ? (
                    <div className="py-12 text-center">
                      <Heart className="mx-auto mb-3 text-gray-200" size={44} strokeWidth={1.25} />
                      <p className="text-sm font-medium text-gray-700">No matches yet</p>
                      <p className="text-xs text-gray-500 mt-1">Accept a request to unlock chat.</p>
                      <button
                        type="button"
                        onClick={() => setActiveNav('discover')}
                        className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
                      >
                        <Search size={16} /> Discover matches
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {(filteredChatMatches as any[]).map((m) => {
                        const imgSrc = m.image
                          ? normalizeImageUrl(m.image)
                          : 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop';
                        const key = `${m.userId}-${m.roomId || 'explore'}`;
                        const meta = inboxPreviews[key];
                        return (
                          <div
                            key={key}
                            className="border border-gray-100 rounded-2xl bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-start gap-3">
                              <img
                                src={imgSrc}
                                alt=""
                                className="w-12 h-12 rounded-full object-cover bg-gray-100 ring-1 ring-gray-100 flex-shrink-0"
                              />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="font-semibold text-gray-900 truncate">{m.name}</p>
                                  <span className="text-[11px] px-2 py-1 rounded-full bg-gray-50 text-gray-600 border border-gray-100">
                                    {m.roomId ? 'Listing' : 'Direct'}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-500 mt-0.5 truncate">
                                  {meta?.preview ||
                                    (m.roomId ? 'Listing · start the conversation' : `${m.match ?? 0}% match`)}
                                </p>
                                <div className="mt-3 flex items-center justify-between gap-3">
                                  <span className="text-xs font-semibold text-emerald-600">
                                    {m.match ?? 0}% match
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setChatWithUserId(m.userId ?? m.id);
                                      setChatRoomId(m.roomId ? String(m.roomId) : null);
                                      setChatMessages([]);
                                      setChatDraft('');
                                      setActiveNav('messages');
                                    }}
                                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
                                  >
                                    <MessageCircle size={16} /> Message
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ) : activeNav === 'profile' ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-6 border-b border-gray-100 flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">Your profile</h2>
                      <p className="text-sm text-gray-500 mt-1">
                        Keep your details up to date for better matches.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onEditProfile?.()}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
                    >
                      <Edit size={16} /> Edit profile
                    </button>
                  </div>

                  <div className="p-6">
                    {profileLoading ? (
                      <div className="text-sm text-gray-500">Loading profile…</div>
                    ) : (
                      <div className="flex items-start gap-4">
                        <img
                          src={
                            avatarSrc ||
                            'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80'
                          }
                          alt=""
                          className="w-16 h-16 rounded-2xl object-cover bg-gray-100 ring-1 ring-gray-100"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-lg font-semibold text-gray-900 truncate">
                            {profileUser?.name || 'Your name'}
                          </p>
                          <p className="text-sm text-gray-500 truncate">
                            {profileUser?.email || userEmail || 'Signed in'}
                          </p>
                          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                              <p className="text-xs text-gray-500">City</p>
                              <p className="text-sm font-semibold text-gray-900 mt-1">
                                {profileUser?.city || profileUser?.location?.city || '—'}
                              </p>
                            </div>
                            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                              <p className="text-xs text-gray-500">Profession</p>
                              <p className="text-sm font-semibold text-gray-900 mt-1">
                                {profileUser?.profession || '—'}
                              </p>
                            </div>
                            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                              <p className="text-xs text-gray-500">Intent</p>
                              <p className="text-sm font-semibold text-gray-900 mt-1">
                                {profileUser?.intent || '—'}
                              </p>
                            </div>
                            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                              <p className="text-xs text-gray-500">Profile status</p>
                              <p className="text-sm font-semibold text-gray-900 mt-1">
                                {profileUser?.profileCompleted ? 'Completed' : 'Incomplete'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h3 className="font-semibold text-gray-900 mb-2">Quick actions</h3>
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => setActiveNav('messages')}
                        className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                      >
                        <span className="text-sm font-medium text-gray-700">Open messages</span>
                        <MessageCircle size={18} className="text-gray-500" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveNav('discover')}
                        className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                      >
                        <span className="text-sm font-medium text-gray-700">Discover matches</span>
                        <Search size={18} className="text-gray-500" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : activeNav === 'settings' ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-6 border-b border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-900">Settings</h2>
                    <p className="text-sm text-gray-500 mt-1">Manage notifications and account.</p>
                  </div>
                  <div className="p-6 space-y-6">
                    <div className="p-5 rounded-2xl border border-gray-100 bg-gray-50">
                      <p className="text-sm font-semibold text-gray-900">Notifications</p>
                      <div className="mt-4 space-y-3">
                        <button
                          type="button"
                          onClick={() => setSettingsEmailUpdates((v) => !v)}
                          className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-white border border-gray-100 hover:bg-gray-50 transition-colors"
                        >
                          <div className="text-left">
                            <p className="text-sm font-medium text-gray-900">Email updates</p>
                            <p className="text-xs text-gray-500">Match alerts and account updates</p>
                          </div>
                          <span
                            className={`text-xs font-semibold px-2 py-1 rounded-full ${
                              settingsEmailUpdates ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {settingsEmailUpdates ? 'On' : 'Off'}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSettingsPushUpdates((v) => !v)}
                          className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-white border border-gray-100 hover:bg-gray-50 transition-colors"
                        >
                          <div className="text-left">
                            <p className="text-sm font-medium text-gray-900">In-app notifications</p>
                            <p className="text-xs text-gray-500">New messages and requests</p>
                          </div>
                          <span
                            className={`text-xs font-semibold px-2 py-1 rounded-full ${
                              settingsPushUpdates ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {settingsPushUpdates ? 'On' : 'Off'}
                          </span>
                        </button>
                      </div>
                    </div>

                    <div className="p-5 rounded-2xl border border-gray-100 bg-gray-50">
                      <p className="text-sm font-semibold text-gray-900">Account</p>
                      <div className="mt-3 text-sm text-gray-600">
                        Signed in as <span className="font-semibold text-gray-900">{profileUser?.email || userEmail || '—'}</span>
                      </div>
                      <div className="mt-4">
                        <button
                          type="button"
                          onClick={onLogout}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-50 text-red-700 border border-red-100 hover:bg-red-100 transition-colors text-sm font-semibold"
                        >
                          <LogOut size={16} /> Logout
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h3 className="font-semibold text-gray-900 mb-2">Shortcuts</h3>
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => setActiveNav('profile')}
                        className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                      >
                        <span className="text-sm font-medium text-gray-700">Profile</span>
                        <User size={18} className="text-gray-500" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveNav('messages')}
                        className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                      >
                        <span className="text-sm font-medium text-gray-700">Messages</span>
                        <MessageCircle size={18} className="text-gray-500" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Column - Discover Matches (2/3 width) */}
                <div className="lg:col-span-2">
                  <div className="bg-white rounded-3xl p-8 shadow-sm">
                    <div className="mb-6">
                      {isExploreLocked && !revealExploreMatches ? (
                        <>
                          <h2 className="text-2xl font-semibold text-gray-900 mb-1">
                            Here are rooms you might like
                          </h2>
                          <p className="text-gray-500">
                            Complete your profile to unlock matching.
                          </p>
                        </>
                      ) : (
                        <>
                          <h2 className="text-2xl font-semibold text-gray-900 mb-1">Discover Matches</h2>
                          <p className="text-gray-500">Swipe right to connect, left to pass.</p>
                        </>
                      )}
                    </div>

                {/* Swipe Card Stack */}
                  {(!isExploreLocked || revealExploreMatches) && (
                    <div className="relative h-[600px] flex items-center justify-center">
                      <AnimatePresence>
                        {loading ? (
                          <div className="text-center text-gray-400">
                            <Users size={64} className="mx-auto mb-4 opacity-50" />
                            <p className="text-lg">Loading matches…</p>
                          </div>
                        ) : filteredSwipeCards.length > 0 ? (
                          filteredSwipeCards.map((card, index) => (
                            index < 3 && (
                              <motion.div
                                key={card.id}
                                className="absolute w-full max-w-md"
                                style={{
                                  zIndex: filteredSwipeCards.length - index,
                                }}
                                initial={
                                  index === 0
                                    ? { scale: 1, y: 0, opacity: 1 }
                                    : { scale: 0.95 - index * 0.05, y: index * 10, opacity: 1 - index * 0.3 }
                                }
                                animate={{
                                  scale: 1 - index * 0.05,
                                  y: index * 10,
                                  opacity: 1 - index * 0.3,
                                }}
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
                                    {(card.city || card.state) ? (
                                      <p className="text-sm text-gray-500 flex items-center gap-1 mb-2">
                                        <MapPin size={14} className="shrink-0" />
                                        {[card.city, card.state].filter(Boolean).join(', ')}
                                      </p>
                                    ) : null}
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

                                  {/* Offerer room details */}
                                  {card.hasRoom && (() => {
                                    const offerRoom =
                                      recommendedRooms?.find(
                                        (r: any) => String(r?.ownerUserId) === String(card.userId)
                                      ) || null;
                                    if (!offerRoom) return null;
                                    return (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setRoomDetailsRoom(offerRoom);
                                          setRoomDetailsOpen(true);
                                        }}
                                        className="mt-4 w-full px-3 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
                                      >
                                        View room details
                                      </button>
                                    );
                                  })()}
                                  </div>
                                </div>
                              </motion.div>
                            )
                          ))
                        ) : swipeCards.length > 0 ? (
                          <div className="text-center text-gray-400 max-w-md px-4">
                            <Users size={64} className="mx-auto mb-4 opacity-50" />
                            <p className="text-lg text-gray-700">No profiles match your search</p>
                            <p className="text-sm mt-2">
                              Try another city, preference (e.g. non-smoker, night owl), or name.
                            </p>
                          </div>
                        ) : (
                          <div className="text-center text-gray-400">
                            <Users size={64} className="mx-auto mb-4 opacity-50" />
                            <p className="text-lg">No more profiles to show</p>
                            <p className="text-sm">Check back later for new matches!</p>
                          </div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                {/* Action Buttons */}
                {(!isExploreLocked || revealExploreMatches) && !showExploreProfileModal && filteredSwipeCards.length > 0 && (
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

                {/* Recommended Rooms */}
                {normalizeSearchQuery(dashboardSearch) &&
                  recommendedRooms.length > 0 &&
                  filteredRecommendedRooms.length === 0 &&
                  !roomsLoading && (
                    <p className="mt-6 text-sm text-gray-500">
                      No recommended rooms match “{dashboardSearch.trim()}”. Try a different area or keyword.
                    </p>
                  )}
                <RecommendedRoomsSection
                  rooms={filteredRecommendedRooms}
                  loading={roomsLoading}
                  title="Recommended Rooms"
                />
              </div>
            </div>

            {/* Right Column - Side Widgets (Find a Room / Discover only) */}
            {showFindRoomSideWidgets && (
            <div className="space-y-6">
              {/* Requests Received */}
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
                          {request.roomLabel ? (
                            <p className="text-xs text-blue-600 font-medium mt-1">{request.roomLabel}</p>
                          ) : null}
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

              {/* Sent Requests */}
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

              {/* Active Matches */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Users size={20} className="text-blue-600" />
                  Active Matches
                </h3>
                <div className="space-y-3">
                  {activeMatches.map((match) => (
                    <div
                      key={`${match.userId}-${match.roomId || 'explore'}`}
                      className="flex items-center gap-3"
                    >
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
                        {match.roomId ? (
                          <p className="text-[10px] text-gray-500 mt-0.5">Listing chat</p>
                        ) : null}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setChatWithUserId(match.userId ?? match.id);
                          setChatRoomId(match.roomId ? String(match.roomId) : null);
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

              {/* Quick Actions */}
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

              {/* Compatibility Insights */}
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
            </div>
            )}
          </div>
          )}
          </>
          )}
        </div>
      </main>

      <RoomDetailsModal
        open={roomDetailsOpen}
        room={roomDetailsRoom}
        onClose={() => {
          setRoomDetailsOpen(false);
          setRoomDetailsRoom(null);
        }}
      />

      {/* Full-screen lock prompt for explore mode */}
      {showExploreProfileModal && (
        <div className="fixed inset-0 z-[200] bg-black/60 flex items-center justify-center p-6">
          <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-xl text-center">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Want better matches?
            </h2>
            <p className="text-gray-600 mb-6">Complete your profile.</p>
            <button
              type="button"
              onClick={() => {
                setShowExploreProfileModal(false);
                onEditProfile?.();
              }}
              className="w-full py-3.5 px-4 bg-[#081A35] text-white rounded-xl font-semibold hover:bg-[#081A35]/90 transition-all shadow-lg"
            >
              Complete Profile
            </button>
          </div>
        </div>
      )}

    </div>
  );
};