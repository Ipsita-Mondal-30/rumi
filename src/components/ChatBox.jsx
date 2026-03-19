import React, { useState, useEffect, useRef } from 'react';
import { Send } from 'lucide-react';
import { getChatHistory } from '../services/api.js';

const API_BASE = import.meta.env.VITE_API_URL
  ? (import.meta.env.VITE_API_URL.startsWith('http') ? import.meta.env.VITE_API_URL : `${typeof window !== 'undefined' ? window.location.origin : ''}${import.meta.env.VITE_API_URL}`)
  : 'http://localhost:4000';

export function ChatBox({ otherUser, currentUserId, socket, seedMessages, onReport }) {
  const [messages, setMessages] = useState(Array.isArray(seedMessages) ? seedMessages : []);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef(null);

  const otherId = otherUser?._id || otherUser?.id;

  useEffect(() => {
    if (!otherId) return;
    setLoading(true);
    getChatHistory(otherId)
      .then((res) => {
        if (res.data?.success && Array.isArray(res.data.messages) && res.data.messages.length > 0) {
          setMessages(res.data.messages.map((m) => ({ ...m, isOwn: m.senderId === currentUserId })));
        } else if (Array.isArray(seedMessages) && seedMessages.length > 0) {
          setMessages(seedMessages);
        }
      })
      .catch(() => {
        if (Array.isArray(seedMessages) && seedMessages.length > 0) setMessages(seedMessages);
        else setMessages([]);
      })
      .finally(() => setLoading(false));
  }, [otherId, currentUserId, seedMessages]);

  useEffect(() => {
    if (!socket) return;
    const onMsg = (msg) => {
      if (msg.receiverId === currentUserId || msg.senderId === currentUserId) {
        setMessages((prev) => [...prev, { ...msg, isOwn: msg.senderId === currentUserId }]);
      }
    };
    socket.on('message', onMsg);
    return () => socket.off('message', onMsg);
  }, [socket, currentUserId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = () => {
    const text = input.trim();
    if (!text || !otherId) return;
    if (socket) {
      socket.emit('message', { receiverId: otherId, message: text });
      setInput('');
    }
  };

  if (!otherUser) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-slate-500 p-4">
        <p>Select a conversation</p>
      </div>
    );
  }

  const name = otherUser.name || 'User';
  const photo = otherUser.photo || otherUser.profilePicture;

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-slate-100 overflow-hidden">
      <div className="p-3 border-b border-slate-100 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <img
            src={photo || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop'}
            alt=""
            className="w-10 h-10 rounded-full object-cover flex-shrink-0"
          />
          <span className="font-semibold text-slate-900 truncate">{name}</span>
        </div>
        {onReport && (
          <button type="button" onClick={() => onReport(otherUser)} className="text-xs text-slate-500 hover:text-red-600 hover:underline flex-shrink-0">
            Report
          </button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
        {loading ? (
          <p className="text-sm text-slate-400">Loading…</p>
        ) : (
          messages.map((m) => (
            <div
              key={m._id || m.timestamp}
              className={`flex ${m.isOwn ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                  m.isOwn
                    ? 'bg-rose-500 text-white rounded-br-md'
                    : 'bg-slate-100 text-slate-900 rounded-bl-md'
                }`}
              >
                {m.message}
                {m.timestamp && (
                  <p className={`text-xs mt-0.5 ${m.isOwn ? 'text-rose-100' : 'text-slate-500'}`}>
                    {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
      <div className="p-3 border-t border-slate-100 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="Type a message…"
          className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
        />
        <button
          type="button"
          onClick={send}
          className="p-2.5 rounded-xl bg-rose-500 text-white hover:bg-rose-600 transition-colors"
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );
}
