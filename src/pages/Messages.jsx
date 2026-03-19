import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChatBox } from '../components/ChatBox.jsx';
import { getReceivedRequests, getSentRequests } from '../services/api.js';
import { DEMO_CONVERSATIONS, DEMO_MESSAGES_BY_OTHER } from '../data/mockData.js';
import { ReportModal } from '../components/ReportModal.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL
  ? (import.meta.env.VITE_API_URL.startsWith('http') ? import.meta.env.VITE_API_URL : window.location.origin)
  : 'http://localhost:4000';

export function Messages() {
  const [searchParams] = useSearchParams();
  const userIdParam = searchParams.get('userId');
  const [conversations, setConversations] = useState([...DEMO_CONVERSATIONS]);
  const [selected, setSelected] = useState(null);
  const [socket, setSocket] = useState(null);
  const [reportUser, setReportUser] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    Promise.all([
      getReceivedRequests().then((r) => (r.data?.success ? r.data.requests : [])),
      getSentRequests().then((r) => (r.data?.success ? r.data.requests : [])),
    ]).then(([rec, sent]) => {
      const byId = new Map();
      rec.filter((r) => r.status === 'accepted').forEach((r) => r.fromUserId?._id && byId.set(r.fromUserId._id.toString(), r.fromUserId));
      sent.filter((r) => r.status === 'accepted').forEach((r) => r.toUserId?._id && byId.set(r.toUserId._id.toString(), r.toUserId));
      const list = Array.from(byId.values());
      if (list.length > 0) setConversations(list);
    });
  }, []);

  useEffect(() => {
    if (userIdParam && conversations.length) {
      const u = conversations.find((c) => c._id === userIdParam || c._id?.toString() === userIdParam);
      setSelected(u || conversations[0]);
    } else if (conversations.length && !selected) {
      setSelected(conversations[0]);
    }
  }, [userIdParam, conversations]);
  const seedMessages = selected?._id ? DEMO_MESSAGES_BY_OTHER[String(selected._id)] : undefined;

  useEffect(() => {
    const token = localStorage.getItem('rumi_token');
    if (!token || !user?._id) return;
    const s = io(SOCKET_URL, { auth: { token }, path: '/socket.io' });
    setSocket(s);
    return () => s.disconnect();
  }, [user?._id]);

  return (
    <>
      {reportUser && (
        <ReportModal
          reportedUserId={reportUser._id}
          reportedUserName={reportUser.name}
          onClose={() => setReportUser(null)}
        />
      )}
    <div className="flex-1 flex flex-col lg:flex-row h-[calc(100vh-8rem)] lg:h-[calc(100vh-4rem)] min-h-0 bg-gray-100 p-4 lg:p-6 gap-4">
      <div className="w-full lg:w-72 flex-shrink-0 rounded-2xl bg-white shadow-sm overflow-y-auto">
        <h2 className="p-4 font-semibold text-slate-900 border-b border-slate-100">Messages</h2>
        {conversations.length === 0 ? (
          <p className="p-4 text-sm text-slate-500">No conversations yet. Accept a request to start chatting.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {conversations.map((u) => (
              <li key={u._id}>
                <button
                  type="button"
                  onClick={() => setSelected(u)}
                  className={`w-full flex items-center gap-3 p-4 text-left hover:bg-slate-50 transition-colors rounded-lg ${
                    selected?._id === u._id ? 'bg-blue-50' : ''
                  }`}
                >
                  <img
                    src={u.photo || u.profilePicture || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop'}
                    alt=""
                    className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                  />
                  <span className="font-medium text-slate-900 truncate flex-1">{u.name || 'User'}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="flex-1 min-w-0 rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
        {selected ? (
          <ChatBox
            otherUser={selected}
            currentUserId={user?._id}
            socket={socket}
            seedMessages={seedMessages}
            onReport={setReportUser}
          />
        ) : (
          <div className="h-full flex items-center justify-center text-slate-500">
            Select a conversation
          </div>
        )}
      </div>
    </div>
    </>
  );
}
