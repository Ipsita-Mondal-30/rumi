import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bell,
  ChevronLeft,
  Edit,
  Home,
  MessageCircle,
  Plus,
  Search,
  Send,
  Settings,
  LogOut,
  Users,
} from 'lucide-react';
import {
  API_BASE_URL,
  getChatHistoryWithRoom,
  getChatThreads,
  getMyRooms,
  getProfile,
  getRoomReceivedRequests,
  getRoomSuggestions,
  getSentRequests,
  incrementRoomView,
  inviteToConnect,
  updateRoom,
  updateRoomStatus,
  createRoom,
  deleteRoom,
} from '../../services/api';
import { getChatSocket } from '../../services/chatSocket';
import { acceptRequest, rejectRequest } from '../../services/api';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { RoomFormModal } from './RoomFormModal';
import { ListingCard } from './ListingCard';
import { IncomingRequestCard } from './IncomingRequestCard';
import { ChatThreadCard } from './ChatThreadCard';
import { SuggestedMatchCard } from './SuggestedMatchCard';

type DashboardProps = {
  onLogout: () => void;
  userEmail?: string;
  onEditProfile?: () => void;
};

export const OfferRoomDashboard = ({ onLogout, userEmail, onEditProfile }: DashboardProps) => {
  const [activeNav, setActiveNav] = useState('dashboard');

  const [avatarSrc, setAvatarSrc] = useState('');
  const [intentLoading, setIntentLoading] = useState(true);

  const [loadingListings, setLoadingListings] = useState(false);
  const [listings, setListings] = useState<any[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);

  const [incomingLoading, setIncomingLoading] = useState(false);
  const [incomingRequests, setIncomingRequests] = useState<any[]>([]);

  const [threadsLoading, setThreadsLoading] = useState(false);
  const [chatThreads, setChatThreads] = useState<any[]>([]);

  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [pendingInvites, setPendingInvites] = useState<any[]>([]);
  const [inviteBanner, setInviteBanner] = useState<{ ok: boolean; text: string } | null>(null);

  const [actionSending, setActionSending] = useState(false);

  const [chatLoading, setChatLoading] = useState(false);
  const [activeOtherUserId, setActiveOtherUserId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [roomChatDraft, setRoomChatDraft] = useState('');
  const [roomChatSending, setRoomChatSending] = useState(false);

  const [roomModalOpen, setRoomModalOpen] = useState(false);
  const [roomModalMode, setRoomModalMode] = useState<'create' | 'edit'>('create');
  const [roomModalInitialRoom, setRoomModalInitialRoom] = useState<any | undefined>(undefined);

  const requestsCardRef = useRef<HTMLDivElement | null>(null);
  const chatsCardRef = useRef<HTMLDivElement | null>(null);

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

  const selectedRoom = useMemo(() => {
    if (!selectedRoomId) return null;
    return listings.find((r) => String(r._id) === String(selectedRoomId)) || null;
  }, [selectedRoomId, listings]);

  const loadAvatar = async () => {
    try {
      const res = await getProfile();
      const u = res?.data?.user;
      const src = u?.photo || u?.profilePicture;
      if (src) setAvatarSrc(normalizeImageUrl(src));
    } catch {
      // ignore
    }
  };

  const loadListings = async () => {
    setLoadingListings(true);
    try {
      const res = await getMyRooms();
      const rooms = res?.data?.rooms || [];
      setListings(
        rooms.map((r: any) => ({
          ...r,
          coverUrl: normalizeImageUrl(r?.coverUrl || r?.photoUrls?.[0] || ''),
        }))
      );

      setSelectedRoomId((prev) => {
        if (rooms.length === 0) return null;
        if (prev && rooms.some((x: any) => String(x._id) === String(prev))) return prev;
        return String(rooms[0]?._id || '');
      });
    } finally {
      setLoadingListings(false);
    }
  };

  const loadRoomPanels = async (roomId: string) => {
    setIncomingLoading(true);
    setThreadsLoading(true);
    setSuggestionsLoading(true);
    try {
      // Track views when owner opens a room in the dashboard.
      await incrementRoomView(roomId).catch(() => {});

      const [reqRes, threadRes, suggRes, sentRes] = await Promise.all([
        getRoomReceivedRequests(roomId),
        getChatThreads(roomId),
        getRoomSuggestions(roomId, 10),
        getSentRequests({ roomId }),
      ]);

      const reqs = reqRes?.data?.requests || [];
      setIncomingRequests(
        reqs.map((r: any) => ({
          ...r,
          fromUserId: {
            ...(r.fromUserId || {}),
            image:
              normalizeImageUrl(r.fromUserId?.photo || r.fromUserId?.profilePicture || '') ||
              r.fromUserId?.photo ||
              r.fromUserId?.profilePicture ||
              '',
          },
        }))
      );

      const threads = threadRes?.data?.threads || [];
      setChatThreads(
        threads.map((t: any) => ({
          ...t,
          image: normalizeImageUrl(t?.image || ''),
        }))
      );

      const suggestionsRes = suggRes?.data?.suggestions || [];
      setSuggestions(
        suggestionsRes.map((s: any) => ({
          ...s,
          image: normalizeImageUrl(s?.image || ''),
        }))
      );

      const sentList = sentRes?.data?.requests || [];
      setPendingInvites(sentList.filter((r: any) => r.status === 'pending'));
    } finally {
      setIncomingLoading(false);
      setThreadsLoading(false);
      setSuggestionsLoading(false);
    }
  };

  useEffect(() => {
    const run = async () => {
      setIntentLoading(true);
      await loadAvatar();
      // If user is not logged in, avoid crashes.
      const token = localStorage.getItem('rumi_token');
      if (!token) {
        setIntentLoading(false);
        return;
      }
      await loadListings();
      setIntentLoading(false);
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedRoomId) return;
    loadRoomPanels(String(selectedRoomId));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRoomId]);

  const openChat = async (otherUserId: string) => {
    if (!selectedRoomId) return;
    setActiveNav('messages');
    setActiveOtherUserId(String(otherUserId));
    setChatLoading(true);
    setChatMessages([]);
    try {
      const res = await getChatHistoryWithRoom(otherUserId, selectedRoomId);
      setChatMessages(res?.data?.messages || []);
      // Refresh unread counts after opening.
      await getChatThreads(selectedRoomId).then((r) => setChatThreads(r?.data?.threads || []));
    } catch {
      setChatMessages([]);
    } finally {
      setChatLoading(false);
    }
  };

  const openCreateEditor = () => {
    setRoomModalMode('create');
    setRoomModalInitialRoom(undefined);
    setRoomModalOpen(true);
  };

  const openEditEditor = (room: any) => {
    setSelectedRoomId(room?._id ? String(room._id) : null);
    setRoomModalMode('edit');
    setRoomModalInitialRoom(room);
    setRoomModalOpen(true);
  };

  const reloadEverything = async () => {
    await loadListings();
    if (selectedRoomId) await loadRoomPanels(String(selectedRoomId));
  };

  const handleAcceptRequest = async (requestId: string) => {
    if (!selectedRoomId) return;
    setActionSending(true);
    try {
      await acceptRequest({ requestId, roomId: selectedRoomId });
      await reloadEverything();
    } finally {
      setActionSending(false);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    if (!selectedRoomId) return;
    setActionSending(true);
    try {
      await rejectRequest({ requestId, roomId: selectedRoomId });
      await reloadEverything();
    } finally {
      setActionSending(false);
    }
  };

  const sendRoomChatMessage = async () => {
    const text = roomChatDraft.trim();
    if (!text || !activeOtherUserId || !selectedRoomId || roomChatSending) return;
    const sock = getChatSocket();
    if (!sock) return;
    if (!sock.connected) sock.connect();

    setRoomChatSending(true);
    const failSafe = window.setTimeout(() => setRoomChatSending(false), 12000);
    const onSent = async () => {
      window.clearTimeout(failSafe);
      sock.off('message_sent', onSent);
      sock.off('error', onSockErr);
      setRoomChatDraft('');
      setRoomChatSending(false);
      try {
        const res = await getChatHistoryWithRoom(activeOtherUserId, selectedRoomId);
        setChatMessages(res?.data?.messages || []);
        const tr = await getChatThreads(selectedRoomId);
        setChatThreads(tr?.data?.threads || []);
      } catch {
        // ignore
      }
    };
    const onSockErr = (err: unknown) => {
      window.clearTimeout(failSafe);
      sock.off('message_sent', onSent);
      sock.off('error', onSockErr);
      setRoomChatSending(false);
      // eslint-disable-next-line no-console
      console.error('room chat socket error:', err);
    };
    sock.once('message_sent', onSent);
    sock.once('error', onSockErr);
    sock.emit('message', {
      receiverId: activeOtherUserId,
      message: text,
      roomId: selectedRoomId,
    });
  };

  useEffect(() => {
    if (activeNav !== 'messages' || !activeOtherUserId || !selectedRoomId) return;
    const s = getChatSocket();
    if (!s) return;
    const meId = readStoredUserId();
    if (!meId) return;
    const roomId = String(selectedRoomId);
    const other = String(activeOtherUserId);
    const onIncoming = (payload: any) => {
      const a = String(payload.senderId ?? '');
      const b = String(payload.receiverId ?? '');
      const pairOk =
        (a === meId && b === other) || (a === other && b === meId);
      if (!pairOk) return;
      const pRoom = payload.roomId ? String(payload.roomId) : '';
      if (pRoom !== roomId) return;
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
  }, [activeNav, activeOtherUserId, selectedRoomId]);

  const handleTogglePause = async (roomId: string) => {
    setActionSending(true);
    try {
      const room = listings.find((r) => String(r._id) === String(roomId));
      const current = room?.status || 'active';
      const next = current === 'active' ? 'paused' : 'active';
      await updateRoomStatus(roomId, next);
      await loadListings();
    } finally {
      setActionSending(false);
    }
  };

  const handleDeleteRoom = async (roomId: string) => {
    setActionSending(true);
    try {
      await deleteRoom(roomId);
      await loadListings();
    } finally {
      setActionSending(false);
    }
  };

  const quickActions = [
    {
      key: 'add',
      label: 'Add New Listing',
      icon: Plus,
      onClick: () => {
        openCreateEditor();
      },
    },
    {
      key: 'edit',
      label: 'Edit Listing',
      icon: Edit,
      onClick: () => {
        if (!selectedRoomId) return;
        const room = listings.find((r) => String(r._id) === String(selectedRoomId));
        if (!room) return;
        openEditEditor(room);
      },
      disabled: !selectedRoomId,
    },
    {
      key: 'view-requests',
      label: 'View Requests',
      icon: Users,
      onClick: () => {
        requestsCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      },
    },
    {
      key: 'open-messages',
      label: 'Open Messages',
      icon: MessageCircle,
      onClick: () => {
        setActiveNav('messages');
        setActiveOtherUserId(null);
        setChatMessages([]);
        if (chatThreads.length > 0) void openChat(String(chatThreads[0].otherUserId));
      },
    },
  ];

  if (intentLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-sm flex flex-col">
        <div className="p-6 flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Home size={18} className="text-white" />
          </div>
          <span className="text-xl font-semibold text-gray-900">Rumi</span>
        </div>

        <nav className="flex-1 px-4 py-2">
          <button
            onClick={() => setActiveNav('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl mb-2 transition-colors ${
              activeNav === 'dashboard' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Home size={20} />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => setActiveNav('listings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl mb-2 transition-colors ${
              activeNav === 'listings' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <span className="w-5 h-5 rounded bg-blue-50 flex items-center justify-center text-blue-600 font-semibold">
              +
            </span>
            <span>My Listings</span>
          </button>

          <button
            onClick={() => setActiveNav('requests')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl mb-2 transition-colors ${
              activeNav === 'requests' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Users size={20} />
            <span>Requests</span>
          </button>

          <button
            onClick={() => {
              setActiveNav('messages');
              setActiveOtherUserId(null);
              setChatMessages([]);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl mb-2 transition-colors ${
              activeNav === 'messages' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <MessageCircle size={20} />
            <span>Messages</span>
          </button>

          <button
            onClick={() => setActiveNav('profile')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl mb-2 transition-colors ${
              activeNav === 'profile' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <span className="w-5 h-5 rounded bg-gray-100 flex items-center justify-center text-gray-600 font-semibold">
              P
            </span>
            <span>Profile</span>
          </button>

          <button
            onClick={() => setActiveNav('settings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl mb-2 transition-colors ${
              activeNav === 'settings' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Settings size={20} />
            <span>Settings</span>
          </button>
        </nav>

        <div className="mx-4 mb-4 p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl text-white">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-semibold">AI in action</span>
          </div>
          <p className="text-xs leading-relaxed opacity-90">
            Get better flatmate matches by improving your listing.
          </p>
        </div>

        <button
          onClick={onLogout}
          className="mx-4 mb-6 flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-xl transition-colors"
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <header className="bg-white shadow-sm px-8 py-4 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-gray-900">
              {activeNav === 'messages'
                ? 'Messages'
                : activeNav === 'requests'
                  ? 'Requests'
                  : activeNav === 'listings'
                    ? 'My Listings'
                    : activeNav === 'profile'
                      ? 'Profile'
                      : activeNav === 'settings'
                        ? 'Settings'
                        : 'Dashboard'}
            </h1>

            <div className="flex items-center gap-4">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search listings, requests, messages"
                  className="pl-10 pr-4 py-2 bg-gray-100 border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-80"
                />
              </div>

              <button className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors relative">
                <Bell size={20} />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              </button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="w-10 h-10 rounded-full overflow-hidden focus:outline-none">
                    <img
                      src={avatarSrc || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80'}
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
                    <span className="text-xs text-gray-500 truncate">{userEmail || 'Signed in'}</span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => onEditProfile?.()} className="gap-2">
                    <span className="text-sm">Edit Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setActiveNav('settings')} className="gap-2">
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

        <div className="p-8">
          {activeNav === 'messages' ? (
            <div className="flex rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden min-h-[520px] max-h-[calc(100vh-8.5rem)]">
              <aside
                className={`flex flex-col w-full md:w-[min(100%,400px)] md:max-w-[400px] shrink-0 bg-white border-r border-gray-200 ${
                  activeOtherUserId ? 'hidden md:flex' : 'flex'
                }`}
              >
                <div className="p-4 border-b border-gray-200">
                  <label className="text-xs font-medium text-gray-500">Listing</label>
                  <select
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white disabled:opacity-60"
                    disabled={listings.length === 0}
                    value={selectedRoomId || ''}
                    onChange={(e) => {
                      const v = e.target.value || null;
                      setSelectedRoomId(v);
                      setActiveOtherUserId(null);
                      setChatMessages([]);
                    }}
                  >
                    {listings.length === 0 ? (
                      <option value="">Add a listing first</option>
                    ) : (
                      listings.map((r) => (
                        <option key={String(r._id)} value={String(r._id)}>
                          {(r.propertyType || 'Room') + ` · ₹${r.monthlyRent ?? 0}/mo`}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Chats</h2>
                    <p className="text-xs text-gray-500 mt-0.5">Accepted invites for this listing</p>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto bg-white">
                  {!selectedRoomId ? (
                    <div className="p-4 text-sm text-gray-500">Select a listing to see chats.</div>
                  ) : threadsLoading ? (
                    <div className="p-4 text-sm text-gray-500">Loading chats…</div>
                  ) : chatThreads.length === 0 ? (
                    <div className="p-4 text-sm text-gray-600">
                      No chats yet. When someone accepts your invite (or you accept their request), they’ll appear here.
                    </div>
                  ) : (
                    chatThreads.map((t) => {
                      const active = String(activeOtherUserId) === String(t.otherUserId);
                      return (
                        <button
                          key={String(t.otherUserId)}
                          type="button"
                          onClick={() => void openChat(String(t.otherUserId))}
                          className={`w-full text-left px-4 py-3 border-b border-gray-100 transition-colors ${
                            active ? 'bg-gray-100' : 'bg-white hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <img
                              src={
                                t.image ||
                                'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop'
                              }
                              alt=""
                              className="w-11 h-11 rounded-full object-cover bg-slate-100 ring-1 ring-gray-100 flex-shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-sm font-semibold text-gray-900 truncate">{t.name || 'User'}</p>
                                {Number(t.unreadCount ?? 0) > 0 ? (
                                  <span className="text-[10px] font-bold text-white bg-blue-600 rounded-full px-2 py-0.5">
                                    {t.unreadCount}
                                  </span>
                                ) : null}
                              </div>
                              <p className="text-xs text-gray-500 truncate mt-0.5">
                                {t.lastMessagePreview || 'No messages yet.'}
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </aside>

              <section
                className={`flex flex-col flex-1 min-w-0 bg-[#f8fafc] ${
                  activeOtherUserId ? 'flex' : 'hidden md:flex'
                }`}
              >
                {!activeOtherUserId ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center px-8 py-12">
                    <MessageCircle className="text-blue-500 mb-4" size={48} strokeWidth={1.15} />
                    <p className="text-lg font-semibold text-gray-900">Listing messages</p>
                    <p className="text-sm text-gray-500 mt-2 max-w-sm">
                      Pick a person on the left to open the thread. Messages use the same real-time connection as Find a Room.
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
                          setActiveOtherUserId(null);
                          setChatMessages([]);
                          setRoomChatDraft('');
                        }}
                      >
                        <ChevronLeft size={22} />
                      </button>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-gray-900 truncate">
                          {chatThreads.find((x) => String(x.otherUserId) === String(activeOtherUserId))?.name ||
                            'Chat'}
                        </p>
                        <p className="text-xs text-gray-500 truncate">Room chat · listing</p>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 min-h-0 bg-[#f0f4f8]">
                      {chatLoading ? (
                        <p className="text-sm text-gray-500 text-center py-8">Loading messages…</p>
                      ) : chatMessages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                          <p className="text-sm text-gray-500">No messages yet</p>
                          <p className="text-xs text-gray-400 mt-1">Send a message below to start the conversation</p>
                        </div>
                      ) : (
                        chatMessages.map((m) => (
                          <div key={m._id} className={`flex ${m.isOwn ? 'justify-end' : 'justify-start'}`}>
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
                      )}
                    </div>

                    <div className="p-3 bg-white border-t border-gray-200 flex gap-2 shrink-0">
                      <input
                        value={roomChatDraft}
                        onChange={(e) => setRoomChatDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            void sendRoomChatMessage();
                          }
                        }}
                        disabled={roomChatSending}
                        placeholder="Type a message…"
                        className="flex-1 px-4 py-2.5 rounded-full border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-[#25D366]/30 focus:border-[#25D366] outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => void sendRoomChatMessage()}
                        disabled={roomChatSending || !roomChatDraft.trim()}
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-3xl p-8 shadow-sm">
                <div className="mb-6">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-1">My Listings</h2>
                  <p className="text-gray-500">Manage your rooms, respond to requests, and track performance.</p>
                </div>

                {selectedRoom && (
                  <div className="mb-6 border border-gray-100 rounded-3xl overflow-hidden bg-gray-50">
                    <div className="p-5 flex flex-col md:flex-row gap-4 items-start">
                      <div className="w-full md:w-48 md:flex-shrink-0">
                        <div className="h-28 md:h-32 bg-slate-100 rounded-2xl overflow-hidden">
                          <img
                            src={
                              selectedRoom.coverUrl ||
                              selectedRoom.photoUrls?.[0] ||
                              'https://images.unsplash.com/photo-1496307653780-42ee777d4833?w=400&h=240&fit=crop'
                            }
                            alt="Listing cover"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">
                              {selectedRoom.propertyType || 'Room'}{' '}
                              {selectedRoom.roomType ? `- ${selectedRoom.roomType}` : ''}
                            </p>
                            <p className="text-xs text-gray-500 truncate mt-1">
                              {selectedRoom.location?.area ||
                                selectedRoom.location?.city ||
                                selectedRoom.location?.address ||
                                'Location'}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-gray-900">₹{selectedRoom.monthlyRent ?? 0}</p>
                            <p className="text-xs text-gray-500">/ month</p>
                          </div>
                        </div>

                        <div className="mt-4">
                          <p className="text-xs text-gray-500 mb-2">Description</p>
                          {selectedRoom.roomDescription ? (
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">
                              {selectedRoom.roomDescription}
                            </p>
                          ) : (
                            <p className="text-sm text-gray-500">No description added yet.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {loadingListings ? (
                  <div className="text-center text-gray-400 py-10">
                    <Users size={56} className="mx-auto mb-4 opacity-50" />
                    <p className="text-lg">Loading listings...</p>
                  </div>
                ) : listings.length === 0 ? (
                  <div className="text-center border border-gray-100 rounded-3xl p-10 bg-gray-50">
                    <p className="text-gray-700 font-semibold">You haven’t listed a room yet. Add your first listing.</p>
                    <button
                      type="button"
                      onClick={() => {
                        openCreateEditor();
                      }}
                      className="mt-6 w-full md:w-auto px-6 py-3 bg-[#081A35] text-white rounded-xl font-semibold hover:bg-[#081A35]/90 transition-all shadow-lg shadow-blue-900/10"
                    >
                      Add New Listing
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {listings.map((room) => (
                      <ListingCard
                        key={room._id}
                        room={room}
                        selected={String(room._id) === String(selectedRoomId)}
                        onSelect={() => {
                          setSelectedRoomId(String(room._id));
                        }}
                        onEdit={() => {
                          openEditEditor(room);
                        }}
                        onTogglePause={() => handleTogglePause(String(room._id))}
                        onDelete={() => handleDeleteRoom(String(room._id))}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              {/* Incoming Requests */}
              <div
                ref={requestsCardRef}
                className="bg-white rounded-2xl p-6 shadow-sm"
              >
                <div className="flex items-center justify-between gap-3 mb-4">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Users size={20} className="text-blue-600" />
                    Incoming Requests
                  </h3>
                  {selectedRoomId && (
                    <span className="text-xs text-gray-500">
                      For <span className="font-semibold">{selectedRoom?.propertyType || 'Room'}</span>
                    </span>
                  )}
                </div>

                {!selectedRoomId ? (
                  <div className="text-sm text-gray-500">Select a listing to see requests.</div>
                ) : incomingLoading ? (
                  <div className="text-sm text-gray-500">Loading requests...</div>
                ) : incomingRequests.length === 0 ? (
                  <div className="text-sm text-gray-600 bg-gray-50 border border-gray-100 rounded-2xl p-4">
                    No requests yet. Improve your listing to attract users.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {incomingRequests.map((request) => (
                      <IncomingRequestCard
                        key={request._id}
                        request={request}
                        onAccept={() => handleAcceptRequest(String(request._id))}
                        onReject={() => handleRejectRequest(String(request._id))}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Outgoing invites (owner → seeker); seeker accepts on their Find dashboard */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
                  <Send size={20} className="text-blue-600" />
                  Invites you&apos;ve sent
                </h3>
                <p className="text-xs text-gray-500 mb-4">
                  Pending until they accept in their account. After acceptance, open Active Chats.
                </p>
                {inviteBanner ? (
                  <div
                    className={`mb-4 text-sm rounded-xl px-3 py-2 border ${
                      inviteBanner.ok
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-100'
                        : 'bg-red-50 text-red-700 border-red-100'
                    }`}
                  >
                    {inviteBanner.text}
                  </div>
                ) : null}
                {!selectedRoomId ? (
                  <div className="text-sm text-gray-500">Select a listing.</div>
                ) : incomingLoading ? (
                  <div className="text-sm text-gray-500">Loading…</div>
                ) : pendingInvites.length === 0 ? (
                  <div className="text-sm text-gray-600 bg-gray-50 border border-gray-100 rounded-2xl p-4">
                    No pending invites. Use Suggested Matches below.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingInvites.map((req: any) => {
                      const u = req.toUserId || {};
                      return (
                        <div
                          key={String(req._id)}
                          className="flex items-center gap-3 border border-gray-100 rounded-2xl p-3"
                        >
                          <img
                            src={
                              normalizeImageUrl(u.photo || u.profilePicture) ||
                              'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop'
                            }
                            alt=""
                            className="w-10 h-10 rounded-full object-cover"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">
                              {u.name || 'User'}
                            </p>
                            <p className="text-xs text-amber-600 font-medium">Awaiting their response</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Active Chats */}
              <div ref={chatsCardRef} className="bg-white rounded-2xl p-6 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <MessageCircle size={20} className="text-blue-600" />
                  Active Chats
                </h3>

                {!selectedRoomId ? (
                  <div className="text-sm text-gray-500">Select a listing to see active chats.</div>
                ) : threadsLoading ? (
                  <div className="text-sm text-gray-500">Loading chats...</div>
                ) : chatThreads.length === 0 ? (
                  <div className="text-sm text-gray-600 bg-gray-50 border border-gray-100 rounded-2xl p-4">
                    No active chats yet.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {chatThreads.map((thread) => (
                      <ChatThreadCard
                        key={thread.otherUserId}
                        thread={thread}
                        onOpen={() => openChat(String(thread.otherUserId))}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Listing Performance */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-4">Listing Performance</h3>

                {!selectedRoom ? (
                  <div className="text-sm text-gray-500">Select a listing to see metrics.</div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-3 bg-gray-50 rounded-xl">
                      <p className="text-xs text-gray-500">Total views</p>
                      <p className="text-2xl font-bold text-gray-900">{selectedRoom.viewsCount ?? 0}</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-xl">
                      <p className="text-xs text-gray-500">Total requests</p>
                      <p className="text-2xl font-bold text-gray-900">{selectedRoom.totalRequests ?? 0}</p>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-xl">
                      <p className="text-xs text-blue-700">Acceptance rate</p>
                      <p className="text-2xl font-bold text-blue-800">{selectedRoom.acceptanceRate ?? 0}%</p>
                    </div>
                    <div className="text-center p-3 bg-emerald-50 rounded-xl">
                      <p className="text-xs text-emerald-700">Avg compatibility</p>
                      <p className="text-2xl font-bold text-emerald-800">{selectedRoom.avgCompatibilityScore ?? 0}%</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  {quickActions.map((a) => {
                    const Icon = a.icon;
                    return (
                      <button
                        key={a.key}
                        type="button"
                        onClick={a.onClick}
                        disabled={Boolean(a.disabled) || actionSending}
                        className="w-full flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                          <Icon size={20} />
                        </div>
                        <span className="text-sm font-medium text-gray-700">{a.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Suggested Matches */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-4">Suggested Matches</h3>

                {!selectedRoomId ? (
                  <div className="text-sm text-gray-500">Select a listing to see matches.</div>
                ) : suggestionsLoading ? (
                  <div className="text-sm text-gray-500">Loading suggestions...</div>
                ) : suggestions.length === 0 ? (
                  <div className="text-sm text-gray-600 bg-gray-50 border border-gray-100 rounded-2xl p-4">
                    No suggested matches right now.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {suggestions.map((s) => (
                      <SuggestedMatchCard
                        key={s.userId}
                        suggestion={s}
                        onInvite={() => {
                          if (!selectedRoomId) return;
                          setInviteBanner(null);
                          inviteToConnect(s.userId, String(selectedRoomId))
                            .then(async () => {
                              setInviteBanner({
                                ok: true,
                                text: 'Invite sent. They can accept it from their Find dashboard under Requests Received.',
                              });
                              await reloadEverything();
                              window.setTimeout(() => setInviteBanner(null), 6000);
                            })
                            .catch((err: any) => {
                              const msg =
                                err?.response?.data?.message ||
                                err?.message ||
                                'Could not send invite.';
                              setInviteBanner({ ok: false, text: msg });
                            });
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          )}
        </div>
      </main>

      {/* Room create/edit modal */}
      <RoomFormModal
        mode={roomModalMode}
        open={roomModalOpen}
        variant="page"
        initialRoom={roomModalMode === 'edit' ? roomModalInitialRoom : undefined}
        onClose={() => setRoomModalOpen(false)}
        onSave={async (form) => {
          if (roomModalMode === 'create') {
            await createRoom(form);
          } else if (roomModalInitialRoom?._id) {
            await updateRoom(String(roomModalInitialRoom._id), form);
          }
          await reloadEverything();
        }}
      />

    </div>
  );
};

