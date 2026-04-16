import React from 'react';
import { Users } from 'lucide-react';
import { RecommendedRoomCard } from './RecommendedRoomCard';
import { RoomDetailsModal } from './RoomDetailsModal';

export type RecommendedRoomsSectionProps = {
  rooms: any[];
  loading: boolean;
  title?: string;
};

export const RecommendedRoomsSection = ({
  rooms,
  loading,
  title = 'Recommended Rooms',
}: RecommendedRoomsSectionProps) => {
  const [open, setOpen] = React.useState(false);
  const [selectedRoom, setSelectedRoom] = React.useState<any | null>(null);

  return (
    <div className="mt-6">
      <div className="flex items-end justify-between gap-4 mb-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-500 mt-1">Sorted by compatibility</p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="border border-gray-100 rounded-2xl bg-white overflow-hidden shadow-sm"
            >
              <div className="h-36 bg-slate-100 animate-pulse" />
              <div className="p-3 space-y-2">
                <div className="h-4 w-2/3 bg-slate-100 rounded animate-pulse" />
                <div className="h-3 w-1/2 bg-slate-100 rounded animate-pulse" />
                <div className="h-5 w-1/3 bg-slate-100 rounded animate-pulse" />
                <div className="h-9 w-full bg-slate-100 rounded-xl animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : rooms.length === 0 ? (
        <div className="text-sm text-gray-500">No recommended rooms found.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {rooms.map((room) => (
            <RecommendedRoomCard
              key={room._id}
              room={room}
              onViewDetails={(r) => {
                setSelectedRoom(r);
                setOpen(true);
              }}
            />
          ))}
        </div>
      )}

      <RoomDetailsModal open={open} room={selectedRoom} onClose={() => setOpen(false)} />
    </div>
  );
};

