import React from 'react';
import { X } from 'lucide-react';
import { API_BASE_URL } from '../../services/api';

export type RoomDetailsModalProps = {
  open: boolean;
  room: any | null;
  onClose: () => void;
};

export const RoomDetailsModal = ({ open, room, onClose }: RoomDetailsModalProps) => {
  if (!open || !room) return null;

  const rawCover =
    room?.coverUrl ||
    room?.photoUrls?.[0] ||
    'https://images.unsplash.com/photo-1496307653780-42ee777d4833?w=600&h=400&fit=crop';

  const cover = (() => {
    const s = String(rawCover || '');
    if (s.startsWith('http://') || s.startsWith('https://')) return s;
    if (s.startsWith('/')) return `${API_BASE_URL}${s}`;
    return s;
  })();

  const score = Number(room?.compatibility ?? room?.matchScore ?? 0) || 0;
  const tags: string[] = Array.isArray(room?.tags) ? room.tags : [];

  return (
    <div className="fixed inset-0 z-[500] bg-black/50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-xl overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Room details</h2>
            <p className="text-sm text-gray-500 mt-1">Compatibility: {score}%</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 max-h-[75vh] overflow-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
              <img src={cover} alt="Room cover" className="w-full h-56 object-cover rounded-2xl bg-slate-100" />
              {tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {tags.slice(0, 3).map((t, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 text-[11px] bg-blue-50 text-blue-700 border border-blue-100 rounded-full font-medium"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="md:col-span-2">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {room?.propertyType || 'Room'} {room?.roomType ? `- ${room.roomType}` : ''}
                    </p>
                    <p className="text-xs text-gray-500 truncate mt-1">
                      {room?.location?.area || room?.location?.city || room?.location?.address || 'Location'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">₹{room?.monthlyRent ?? 0}</p>
                    <p className="text-xs text-gray-500">/ month</p>
                  </div>
                </div>

                <div className="mt-2">
                  <p className="text-sm font-medium text-gray-900 mb-2">Description</p>
                  {room?.roomDescription ? (
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{room.roomDescription}</p>
                  ) : (
                    <p className="text-sm text-gray-500">No description provided yet.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

