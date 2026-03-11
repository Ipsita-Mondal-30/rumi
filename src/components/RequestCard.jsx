import React from 'react';

export function RequestCard({ request, onAccept, onReject, loading }) {
  const user = request?.fromUserId || request?.toUserId || request;
  const name = user?.name || 'Unknown';
  const age = user?.age ?? '';
  const match = request?.matchScore ?? user?.match ?? 0;
  const photo = user?.photo || user?.profilePicture || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop';

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
      <img
        src={photo}
        alt={name}
        className="w-12 h-12 rounded-full object-cover flex-shrink-0"
        onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop'; }}
      />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-900 text-sm truncate">{name}{age ? `, ${age}` : ''}</p>
        <p className="text-xs text-[#2F80ED] font-medium">{match}% Match</p>
      </div>
      <div className="flex gap-2 flex-shrink-0">
        <button
          type="button"
          onClick={() => onAccept(request)}
          disabled={loading}
          className="px-3 py-1.5 rounded-lg text-sm font-medium bg-[#2F80ED] text-white hover:bg-blue-700 disabled:opacity-50"
        >
          Accept
        </button>
        <button
          type="button"
          onClick={() => onReject(request)}
          disabled={loading}
          className="px-3 py-1.5 rounded-lg text-sm font-medium bg-slate-200 text-slate-600 hover:bg-slate-300 disabled:opacity-50"
        >
          Reject
        </button>
      </div>
    </div>
  );
}
