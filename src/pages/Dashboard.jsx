import React, { useState, useEffect } from 'react';
import { MatchCard } from '../components/MatchCard.jsx';
import { RequestCard } from '../components/RequestCard.jsx';
import { getMatches, getReceivedRequests, getSentRequests, sendRequest, acceptRequest, rejectRequest } from '../services/api.js';
import { DEMO_DISCOVER, DEMO_RECEIVED, DEMO_SENT, DEMO_ACTIVE_MATCHES } from '../data/mockData.js';
import { Link } from 'react-router-dom';
import { Heart, Send, Users, MessageCircle, Edit, User, Target } from 'lucide-react';

export function Dashboard() {
  const [matches, setMatches] = useState([...DEMO_DISCOVER]);
  const [received, setReceived] = useState([...DEMO_RECEIVED]);
  const [sent, setSent] = useState([...DEMO_SENT]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [useDemoData, setUseDemoData] = useState(true);

  const load = () => {
    setLoading(true);
    Promise.all([
      getMatches().then((r) => (r.data?.success ? r.data.matches : [])),
      getReceivedRequests().then((r) => (r.data?.success ? r.data.requests : [])),
      getSentRequests().then((r) => (r.data?.success ? r.data.requests : [])),
    ])
      .then(([m, rec, s]) => {
        const hasApiData = m.length > 0 || rec.length > 0 || s.length > 0;
        if (hasApiData) {
          setUseDemoData(false);
          setMatches(m);
          setReceived(rec);
          setSent(s);
        }
        // else keep existing demo data
      })
      .catch(() => {
        setUseDemoData(true);
        setMatches((prev) => (prev.length ? prev : [...DEMO_DISCOVER]));
        setReceived((prev) => (prev.length ? prev : [...DEMO_RECEIVED]));
        setSent((prev) => (prev.length ? prev : [...DEMO_SENT]));
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const current = matches[0];
  const handleConnect = () => {
    if (!current?.user?._id) return;
    if (useDemoData) {
      setSending(true);
      setMatches((prev) => prev.slice(1));
      setSent((prev) => [...prev, { _id: `sent-${Date.now()}`, status: 'pending', matchScore: current.matchScore, toUserId: current.user }]);
      setSending(false);
      return;
    }
    setSending(true);
    sendRequest(current.user._id).then(load).finally(() => setSending(false));
  };
  const handleSkip = () => setMatches((prev) => prev.slice(1));
  const handleAccept = (req) => {
    if (useDemoData) {
      setReceived((prev) => prev.filter((r) => r._id !== req._id));
      setSent((prev) => [...prev, { _id: `acc-${Date.now()}`, status: 'accepted', fromUserId: req.fromUserId }]);
      return;
    }
    acceptRequest({ fromUserId: req.fromUserId?._id || req.fromUserId }).then(load);
  };
  const handleReject = (req) => {
    if (useDemoData) {
      setReceived((prev) => prev.filter((r) => r._id !== req._id));
      return;
    }
    rejectRequest({ fromUserId: req.fromUserId?._id || req.fromUserId }).then(load);
  };

  const acceptedReceived = received.filter((r) => r.status === 'accepted').map((r) => r.fromUserId);
  const acceptedSent = sent.filter((r) => r.status === 'accepted').map((r) => r.toUserId);
  const byId = new Map();
  [...acceptedReceived, ...acceptedSent].forEach((u) => u?._id && byId.set(u._id.toString(), { ...u, match: u.match ?? 90 }));
  const activeFromApi = Array.from(byId.values());
  const activeMatches = activeFromApi.length > 0 ? activeFromApi : DEMO_ACTIVE_MATCHES;

  const avgScore = matches.length
    ? Math.round(matches.reduce((s, m) => s + (m.matchScore ?? 0), 0) / matches.length)
    : 89;
  const nearbyCount = matches.length || 24;
  const lifestyleMatch = current?.matchScore ?? 91;

  return (
    <div className="flex-1 p-6 w-full min-w-0">
      <div className="grid grid-cols-12 gap-6 w-full max-w-[1600px] mx-auto">
        {/* Discover Matches (main card) - 8 columns */}
        <div className="col-span-12 lg:col-span-8 flex flex-col items-start min-w-0">
          <div className="w-full mb-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-1">Discover Matches</h2>
            <p className="text-slate-500 text-sm">Swipe right to connect, left to pass.</p>
          </div>
          {loading ? (
            <div className="w-full max-w-lg rounded-xl bg-white border border-slate-200 shadow-md animate-pulse h-96 flex items-center justify-center">
              <p className="text-slate-500">Loading…</p>
            </div>
          ) : current ? (
            <div className="w-full max-w-lg">
              <MatchCard
                profile={current.user}
                matchScore={current.matchScore}
                reasons={current.reasons}
                onConnect={handleConnect}
                onSkip={handleSkip}
                loading={sending}
              />
            </div>
          ) : (
            <div className="w-full max-w-lg rounded-xl bg-white border border-slate-200 shadow-md p-12 text-center">
              <p className="text-slate-500">No more profiles. Try filters or check back later.</p>
            </div>
          )}
        </div>

        {/* Right widgets - 4 columns */}
        <div className="col-span-12 lg:col-span-4 space-y-6 min-w-0">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-md">
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Heart size={20} className="text-slate-500" />
            Requests Received
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {received.length === 0 ? (
              <p className="text-sm text-slate-500">No requests yet</p>
            ) : (
              received.map((req) => (
                <RequestCard
                  key={req._id}
                  request={req}
                  onAccept={handleAccept}
                  onReject={handleReject}
                  loading={sending}
                />
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-md">
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Send size={20} className="text-slate-500" />
            Sent Requests
          </h3>
          <div className="space-y-3 max-h-44 overflow-y-auto">
            {sent.length === 0 ? (
              <p className="text-sm text-slate-500">No requests sent yet</p>
            ) : (
              sent.map((req) => (
                <div key={req._id} className="flex items-center gap-3 py-1">
                  <img
                    src={req.toUserId?.photo || req.toUserId?.profilePicture || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop'}
                    alt=""
                    className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{req.toUserId?.name || 'User'}</p>
                    <p className="text-xs text-slate-500">{req.matchScore ?? req.toUserId?.match ?? '—'}% Match</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 flex items-center gap-1 ${
                    req.status === 'accepted' ? 'bg-blue-50 text-[#2F80ED]' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {req.status === 'accepted' && <span>✓</span>}
                    {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-md">
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Users size={20} className="text-slate-500" />
            Active Matches
          </h3>
          <div className="space-y-3">
            {activeMatches.length === 0 ? (
              <p className="text-sm text-slate-500">No matches yet</p>
            ) : (
              activeMatches.map((u) => (
                <div key={u._id} className="flex items-center gap-3 py-2">
                  <img
                    src={u.photo || u.profilePicture || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop'}
                    alt=""
                    className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{u.name || 'User'}</p>
                    <p className="text-xs text-[#2F80ED] font-medium">{u.match ?? '—'}% Match</p>
                  </div>
                  <Link
                    to={`/messages?userId=${u._id}`}
                    className="p-2 rounded-lg bg-[#2F80ED] text-white hover:bg-blue-700 flex-shrink-0"
                  >
                    <MessageCircle size={16} />
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-md">
          <h3 className="font-semibold text-slate-900 mb-4">Quick Actions</h3>
          <div className="space-y-2">
            <Link to="/messages" className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors text-sm font-medium text-slate-700 border border-blue-100">
              <div className="w-10 h-10 rounded-lg bg-[#2F80ED] text-white flex items-center justify-center">
                <MessageCircle size={20} />
              </div>
              View Messages
            </Link>
            <Link to="/settings" className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors text-sm font-medium text-slate-700 border border-blue-100">
              <div className="w-10 h-10 rounded-lg bg-[#2F80ED] text-white flex items-center justify-center">
                <Edit size={20} />
              </div>
              Edit Preferences
            </Link>
            <Link to="/profile" className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors text-sm font-medium text-slate-700 border border-blue-100">
              <div className="w-10 h-10 rounded-lg bg-[#2F80ED] text-white flex items-center justify-center">
                <User size={20} />
              </div>
              Complete Profile
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-md">
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Target size={20} className="text-[#2F80ED]" />
            Compatibility Insights
          </h3>
          <div className="flex flex-col items-center mb-4">
            <div className="relative w-24 h-24 rounded-full flex items-center justify-center" style={{ background: `conic-gradient(#2F80ED ${avgScore * 3.6}deg, #E2E8F0 0deg)` }}>
              <div className="absolute inset-2 rounded-full bg-white flex items-center justify-center">
                <span className="text-xl font-bold text-slate-900">{avgScore}%</span>
              </div>
            </div>
            <p className="text-sm text-slate-500 mt-2">Average Match Score</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-blue-50 p-3 text-center">
              <p className="text-2xl font-bold text-[#2F80ED]">{nearbyCount}</p>
              <p className="text-xs text-[#2F80ED] font-medium">Nearby Matches</p>
            </div>
            <div className="rounded-xl bg-blue-50 p-3 text-center">
              <p className="text-2xl font-bold text-[#2F80ED]">{lifestyleMatch}%</p>
              <p className="text-xs text-[#2F80ED] font-medium">Lifestyle Match</p>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
