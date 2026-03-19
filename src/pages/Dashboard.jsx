import React, { useState, useEffect } from 'react';
import { SwipeCardStack } from '../components/SwipeCardStack.jsx';
import { RequestCard } from '../components/RequestCard.jsx';
import { ReportModal } from '../components/ReportModal.jsx';
import { getMatches, getReceivedRequests, getSentRequests, sendRequest, acceptRequest, rejectRequest, passRequest } from '../services/api.js';
import { DEMO_DISCOVER, DEMO_RECEIVED, DEMO_SENT, DEMO_ACTIVE_MATCHES } from '../data/mockData.js';
import { Link } from 'react-router-dom';
import { Heart, Send, Users, MessageCircle, Edit, User, Target } from 'lucide-react';

export function Dashboard() {
  const [matches, setMatches] = useState([...DEMO_DISCOVER]);
  const [received, setReceived] = useState([...DEMO_RECEIVED]);
  const [sent, setSent] = useState([...DEMO_SENT]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [useDemoData, setUseDemoData] = useState(true);
  const [reportUser, setReportUser] = useState(null);

  const load = () => {
    Promise.all([
      getMatches().then((r) => (r.data?.success ? r.data.matches : [])),
      getReceivedRequests().then((r) => (r.data?.success ? r.data.requests : [])),
      getSentRequests().then((r) => (r.data?.success ? r.data.requests : [])),
    ])
      .then(([m, rec, s]) => {
        if (m.length > 0) {
          setUseDemoData(false);
          setMatches(m);
        }
        if (rec.length > 0 || s.length > 0) {
          setUseDemoData(false);
          setReceived(rec);
          setSent(s);
        }
        // else keep existing demo data for any section that came back empty
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
  const handleConnectItem = (item) => {
    if (!item?.user?._id) return;
    if (useDemoData) {
      setMatches((prev) => {
        const next = prev.filter((m) => (m.user?._id ?? m._id) !== (item.user?._id ?? item._id));
        return next.length === 0 ? [...DEMO_DISCOVER] : next;
      });
      setSent((prev) => [...prev, { _id: `sent-${Date.now()}`, status: 'pending', matchScore: item.matchScore, toUserId: item.user }]);
      return;
    }
    setSending(true);
    sendRequest(item.user._id).then(load).finally(() => setSending(false));
  };
  const handleSkipItem = (item) => {
    if (!item?.user?._id) return;
    if (useDemoData) {
      setMatches((prev) => {
        const next = prev.filter((m) => (m.user?._id ?? m._id) !== (item.user?._id ?? item._id));
        return next.length === 0 && useDemoData ? [...DEMO_DISCOVER] : next;
      });
      return;
    }
    setSending(true);
    passRequest(item.user._id).then(load).finally(() => setSending(false));
  };
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
    <>
    {reportUser && (
      <ReportModal
        reportedUserId={reportUser._id}
        reportedUserName={reportUser.name}
        onClose={() => setReportUser(null)}
      />
    )}
    <div className="flex-1 p-8 w-full min-w-0">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full max-w-[1600px] mx-auto">
        {/* Discover Matches (main card) - 2/3 width */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-3xl p-8 shadow-sm">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-1">Discover Matches</h2>
              <p className="text-gray-500">Swipe right to connect, left to pass.</p>
            </div>
          {loading ? (
            <div className="relative h-[520px] flex items-center justify-center rounded-2xl bg-gray-50 animate-pulse">
              <p className="text-gray-500">Loading…</p>
            </div>
          ) : (
            <div className="w-full max-w-lg relative h-[520px]">
              <SwipeCardStack
                matchItems={matches}
                onSwipeLeft={handleSkipItem}
                onSwipeRight={handleConnectItem}
                loading={sending}
              />
            </div>
          )}
          </div>
        </div>

        {/* Right widgets */}
        <div className="space-y-6 min-w-0">
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Heart size={20} className="text-blue-600" />
            Requests Received
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {received.length === 0 ? (
              <p className="text-sm text-gray-500">No requests yet</p>
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

        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Send size={20} className="text-blue-600" />
            Sent Requests
          </h3>
          <div className="space-y-3 max-h-44 overflow-y-auto">
            {sent.length === 0 ? (
              <p className="text-sm text-gray-500">No requests sent yet</p>
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
                  <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 font-medium ${
                    req.status === 'accepted' ? 'bg-emerald-50 text-emerald-600' : req.status === 'pending' ? 'bg-yellow-50 text-yellow-600' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {req.status === 'accepted' && <span>✓</span>}
                    {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Users size={20} className="text-blue-600" />
            Active Matches
          </h3>
          <div className="space-y-3">
            {activeMatches.length === 0 ? (
              <p className="text-sm text-gray-500">No matches yet</p>
            ) : (
              activeMatches.map((u) => (
                <div key={u._id} className="flex items-center gap-3">
                  <img
                    src={u.photo || u.profilePicture || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop'}
                    alt=""
                    className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{u.name || 'User'}</p>
                    <p className="text-xs text-emerald-600 font-medium">{u.match ?? '—'}% Match</p>
                  </div>
                  <Link
                    to={`/dashboard/messages?userId=${u._id}`}
                    className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white hover:bg-blue-700 transition-colors flex-shrink-0"
                  >
                    <MessageCircle size={16} />
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-2">
            <Link to="/dashboard/messages" className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors text-sm font-medium text-gray-700">
              <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                <MessageCircle size={20} />
              </div>
              View Messages
            </Link>
            <Link to="/dashboard/settings" className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors text-sm font-medium text-gray-700">
              <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                <Edit size={20} />
              </div>
              Edit Preferences
            </Link>
            <Link to="/dashboard/profile" className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors text-sm font-medium text-gray-700">
              <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                <User size={20} />
              </div>
              Complete Profile
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Target size={20} className="text-blue-600" />
            Compatibility Insights
          </h3>
          <div className="flex flex-col items-center mb-4">
            <div className="relative w-24 h-24 rounded-full flex items-center justify-center" style={{ background: `conic-gradient(#2563eb ${avgScore * 3.6}deg, #E5E7EB 0deg)` }}>
              <div className="absolute inset-2 rounded-full bg-white flex items-center justify-center">
                <span className="text-xl font-bold text-gray-900">{avgScore}%</span>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-2">Average Match Score</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-blue-50 p-3 text-center">
              <p className="text-2xl font-bold text-blue-600">{nearbyCount}</p>
              <p className="text-xs text-blue-600 font-medium">Nearby Matches</p>
            </div>
            <div className="rounded-xl bg-blue-50 p-3 text-center">
              <p className="text-2xl font-bold text-blue-600">{lifestyleMatch}%</p>
              <p className="text-xs text-blue-600 font-medium">Lifestyle Match</p>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
    </>
  );
}
