import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getReceivedRequests, getSentRequests, acceptRequest, rejectRequest } from '../services/api.js';
import { RequestCard } from '../components/RequestCard.jsx';
import { MessageCircle } from 'lucide-react';

export function Matches() {
  const [received, setReceived] = useState([]);
  const [sent, setSent] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    Promise.all([
      getReceivedRequests().then((r) => (r.data?.success ? r.data.requests : [])),
      getSentRequests().then((r) => (r.data?.success ? r.data.requests : [])),
    ])
      .then(([rec, s]) => {
        setReceived(rec);
        setSent(s);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const acceptedReceived = received.filter((r) => r.status === 'accepted').map((r) => r.fromUserId);
  const acceptedSent = sent.filter((r) => r.status === 'accepted').map((r) => r.toUserId);
  const byId = new Map();
  [...acceptedReceived, ...acceptedSent].forEach((u) => u?._id && byId.set(u._id.toString(), u));
  const activeMatches = Array.from(byId.values());

  const handleAccept = (req) => {
    acceptRequest({ fromUserId: req.fromUserId?._id || req.fromUserId }).then(load);
  };
  const handleReject = (req) => {
    rejectRequest({ fromUserId: req.fromUserId?._id || req.fromUserId }).then(load);
  };

  return (
    <div className="flex-1 p-6 max-w-4xl mx-auto w-full bg-[#F7F8FC]">
      <h1 className="text-2xl font-semibold text-slate-900 mb-6">My Matches</h1>

      <div className="space-y-6">
        <section className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Requests Received</h2>
          {loading ? (
            <p className="text-slate-500">Loading…</p>
          ) : received.length === 0 ? (
            <p className="text-slate-500 text-sm">No requests received yet</p>
          ) : (
            <div className="space-y-3">
              {received.map((req) => (
                <RequestCard
                  key={req._id}
                  request={req}
                  onAccept={handleAccept}
                  onReject={handleReject}
                />
              ))}
            </div>
          )}
        </section>

        <section className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Sent Requests</h2>
          {sent.length === 0 ? (
            <p className="text-slate-500 text-sm">No requests sent yet</p>
          ) : (
            <div className="space-y-2">
              {sent.map((req) => (
                <div key={req._id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-3">
                    <img
                      src={req.toUserId?.photo || req.toUserId?.profilePicture || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop'}
                      alt=""
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <span className="font-medium text-slate-900">{req.toUserId?.name || 'User'}</span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    req.status === 'accepted' ? 'bg-blue-50 text-[#2F80ED]' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {req.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Active Matches</h2>
          {activeMatches.length === 0 ? (
            <p className="text-slate-500 text-sm">No matches yet. Connect with someone from Discover!</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {activeMatches.map((u) => (
                <Link
                  key={u._id}
                  to={`/messages?userId=${u._id}`}
                  className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100 transition-colors"
                >
                  <img
                    src={u.photo || u.profilePicture || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop'}
                    alt=""
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <span className="font-medium text-slate-900 flex-1 truncate">{u.name || 'User'}</span>
                  <div className="w-10 h-10 rounded-full bg-[#2F80ED] text-white flex items-center justify-center flex-shrink-0">
                    <MessageCircle size={20} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
